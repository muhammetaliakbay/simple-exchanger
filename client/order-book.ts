import {BaseClient} from "./base-client";
import {OrderBookDefinition} from "../instances/definitions";
import {OrderAdd, OrderType, OrderUpdate, Stats, TOrderBook, UpdateType} from "../contracts/order-book";
import {StableTokenClient} from "./stable-token";
import {defer, Observable} from "rxjs";
import {map, share, shareReplay} from "rxjs/operators";
import {OrderEntryWithId} from "../contracts/order";
import {Event, BigNumber, BigNumberish} from "ethers"
import {StoredTransaction} from "./mempool";
import {Account, SentTransaction} from "./providers";
import {addressEquals} from "./address-util";

export interface Orders {
    sellers: OrderEntryWithId[],
    buyers: OrderEntryWithId[]
}

export class OrderBookClient {
    readonly contract: TOrderBook;
    constructor(
        readonly baseClient: BaseClient,
        contract: TOrderBook | string
    ) {
        if (typeof contract == "string") {
            contract = OrderBookDefinition.loadContract(contract).connect(baseClient.provider.provider)
        }
        this.contract = contract;
    }

    getContractAddress(): string {
        return this.contract.address
    }

    private divider$: Promise<BigNumber> | null = null;
    async getDivider(): Promise<BigNumber> {
        return await (this.divider$ ??= this.contract.divider())
    }

    private stableToken$: Promise<string> | null = null;
    async getStableTokenAddress(): Promise<string> {
        return await (this.stableToken$ ??= this.contract.stableToken())
    }

    async getStableToken(): Promise<StableTokenClient> {
        return this.baseClient.getStableTokenClient(
            await this.getStableTokenAddress()
        )
    }

    async putSellOrder(account: Account, volume: BigNumberish, price: BigNumberish): Promise<SentTransaction> {
        const unsigned = await this.contract.populateTransaction.putSellOrder(
            price, {
                value: volume
            }
        )
        const signed = await account.sendTransaction({
            ...unsigned,
            chainId: this.baseClient.provider.chainId
        })
        return this.baseClient.memPool.putSent(signed)
    }

    async putBuyOrder(account: Account, balance: BigNumberish, price: BigNumberish): Promise<SentTransaction> {
        const unsigned = await this.contract.populateTransaction.putBuyOrder(
            balance, price
        )
        const signed = await account.sendTransaction({
            ...unsigned,
            chainId: this.baseClient.provider.chainId
        })
        return this.baseClient.memPool.putSent(signed)
    }

    async cancelBuyOrder(account: Account, id: BigNumberish): Promise<SentTransaction> {
        const unsigned = await this.contract.populateTransaction.cancelBuyOrder(
            id
        )
        const signed = await account.sendTransaction({
            ...unsigned,
            chainId: this.baseClient.provider.chainId
        })
        return this.baseClient.memPool.putSent(signed)
    }

    async cancelSellOrder(account: Account, id: BigNumberish): Promise<SentTransaction> {
        const unsigned = await this.contract.populateTransaction.cancelSellOrder(
            id
        )
        const signed = await account.sendTransaction({
            ...unsigned,
            chainId: this.baseClient.provider.chainId
        })
        return this.baseClient.memPool.putSent(signed)
    }

    private watchTransactions(account: string, methodName: string): Observable<StoredTransaction[]> {
        return defer(
            () => this.baseClient.memPool.watch(
                (tx) => (
                    addressEquals(tx.from, account) &&
                    addressEquals(tx.to, this.contract.address) &&
                    this.contract.interface.parseTransaction(
                        tx
                    ).name === methodName
                )
            )
        )
    }

    watchSellTransactions(account: string): Observable<StoredTransaction[]> {
        return this.watchTransactions(account, 'putSellOrder')
    }
    watchBuyTransactions(account: string): Observable<StoredTransaction[]> {
        return this.watchTransactions(account, 'putBuyOrder')
    }
    watchCancelSellTransactions(account: string): Observable<StoredTransaction[]> {
        return this.watchTransactions(account, 'cancelSellOrder')
    }
    watchCancelBuyTransactions(account: string): Observable<StoredTransaction[]> {
        return this.watchTransactions(account, 'cancelBuyOrder')
    }

    readonly stats$: Observable<Stats> = defer(
        () => this.baseClient.onEvents(
            this.contract,
            [
                this.contract.filters.OrderAdd(null, null, null),
                this.contract.filters.OrderUpdate(null, null, null)
            ],
            blockNumber =>
                this.contract.getStats({blockTag: blockNumber})
        )
    ).pipe(
        share()
    )

    private async updateOrderList(events: (Event & {args: OrderAdd|OrderUpdate})[], list: OrderEntryWithId[], type: OrderType): Promise<OrderEntryWithId[]> {
        const newList = [...list];
        const typeName = type === OrderType.Sell ? 'sell' : 'buy';
        for (const event of events) {
            if (event.args.orderType === type) {

                const id = event.args.orderId;

                if ('updateType' in event.args) {
                    const index = newList.findIndex(entry => entry.id.eq(id))
                    if (index === -1) {
                        throw new Error(`broken event, ${typeName}/${event.args.updateType} tried to update order with id ${id} but it is not found`)
                    }

                    const updateType = event.args.updateType;
                    if (updateType === UpdateType.Match || updateType === UpdateType.Cancel) {
                        newList.splice(index, 1);
                    } else {
                        const orderEntry = await this.contract.getOrder(id, type, {blockTag: event.blockNumber})
                        newList[index] = {
                            id,
                            entry: orderEntry
                        }
                    }
                } else {
                    if (newList.findIndex(entry => entry.id.eq(id)) !== -1) {
                        throw new Error(`broken event, ${typeName} made duplication with id ${id}`)
                    }

                    const index = event.args.index.toNumber();
                    if (index > newList.length) {
                        throw new Error(`broken event, ${typeName} tried to insert at ${index} but length is ${newList.length}`)
                    }

                    const orderEntry = await this.contract.getOrder(id, type, {blockTag: event.blockNumber})
                    newList.splice(
                        index, 0,
                        {
                            id,
                            entry: orderEntry
                        }
                    );
                }

            }
        }

        return newList
    }

    readonly orders$: Observable<Orders> = defer(
        () => this.baseClient.onEvents<Orders, OrderAdd | OrderUpdate>(
            this.contract,
            [
                this.contract.filters.OrderAdd(null, null, null),
                this.contract.filters.OrderUpdate(null, null, null)
            ],
            blockNumber =>
                Promise.all([
                    this.contract.getAllOrders(OrderType.Sell, {blockTag: blockNumber}),
                    this.contract.getAllOrders(OrderType.Buy, {blockTag: blockNumber})
                ]).then(
                    ([sellers, buyers]) => ({sellers, buyers})
                ),
            (blockRange, events, previous) => Promise.all([
                this.updateOrderList(events, previous.sellers, OrderType.Sell),
                this.updateOrderList(events, previous.buyers, OrderType.Buy)
            ]).then(
                ([sellers, buyers]) => ({sellers, buyers}),
            )
        )
    ).pipe(
        shareReplay(1)
    )

    readonly bestPrices$: Observable<{seller: BigNumber | undefined, buyer: BigNumber | undefined}> = this.orders$.pipe(
        map(
            (orders) => ({
                seller: orders.sellers[0]?.entry?.price,
                buyer: orders.buyers[0]?.entry?.price
            })
        ),
        shareReplay(1)
    )
}
