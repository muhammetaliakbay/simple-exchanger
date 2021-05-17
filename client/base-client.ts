import {concat, defer, EMPTY, from, merge, Observable, ObservableInput} from "rxjs";
import {
    concatMap,
    distinctUntilChanged,
    map,
    pluck,
    scan,
    shareReplay,
    tap,
    toArray
} from "rxjs/operators";
import {BigNumber, Contract, Event} from "ethers"
import {TContract, TEventFilter} from "../contracts/extended";
import {ContractDefinition} from "../instances/loader";
import {StableTokenClient} from "./stable-token";
import {ExchangerClient} from "./exchanger";
import {OrderBookClient} from "./order-book";
import {Currency} from "./currency";
import {exhaustMapWithTrailing} from "./reactive-util";
import {MemPool} from "./mempool";
import {ReactiveProvider} from "./reactive-provider";
import {addressNormalize} from "./address-util";

function sortEventsAndRemoveDuplicates(events: Event[]): Event[] {
    const sorted = events.sort(
        (a, b) => {
            return (a.blockNumber - b.blockNumber) || (a.transactionIndex - b.transactionIndex) || (a.logIndex - b.logIndex)
        }
    )
    const uniques = sorted.filter(
        (event, index, events) => {
            if (index === 0) {
                return true;
            } else {
                const prev = events[index - 1];
                const same = prev.blockNumber === event.blockNumber && prev.transactionIndex === event.transactionIndex && prev.logIndex === event.logIndex;
                return !same;
            }
        }
    )
    return uniques;
}

export class BaseClient {

    constructor(
        readonly memPool: MemPool,
        readonly provider: ReactiveProvider,
        readonly currency: Currency
    ) {
    }

    readonly blockNumber$: Observable<number> = merge(
        defer(
            () => this.provider.provider.getBlockNumber()
        ),
        new Observable<number>(
            subscriber => {
                const listener = (blockNumber: number) => {
                    subscriber.next(blockNumber);
                }
                this.provider.provider.on('block', listener);
                return () => this.provider.provider.off('block', listener);
            }
        )
    ).pipe(
        scan((prev, curr) => Math.max(prev, curr), 0),
        distinctUntilChanged(),
        shareReplay(1)
    )

    onBlocks<T>(
        initial: (blockNumber: number) => ObservableInput<T>,
        update: (startBlockNumber: number, endBlockNumber: number, previous: T) => ObservableInput<T>
    ): Observable<T> {
        return defer(
            () => {
                let last: [blockNumber: number, value: T] | null = null;

                return this.blockNumber$.pipe(
                    exhaustMapWithTrailing(
                        blockNumber => {
                            return from(
                                last == null ?
                                    initial(blockNumber) :
                                    update(last[0], blockNumber, last[1])
                            ).pipe(
                                map(
                                    value => [blockNumber, value] as [blockNumber: number, value: T]
                                )
                            )
                        }
                    ),
                    tap(result => last = result)
                )
            }
        ).pipe(
            pluck(1)
        );
    }

    onEvents<T, E extends any>(
        contract: Contract,
        filters: TEventFilter<any>[],
        initial: (blockNumber: number) => ObservableInput<T>,
        update?: (blockRange: [startBlockNumber: number, endBlockNumber: number], events: (Event & {args: E})[], previous: T) => ObservableInput<T>
    ): Observable<T> {
        return this.onBlocks(
            initial,
            (start, end, prev) =>
                concat(
                    ...filters.map(
                        filter => contract.queryFilter(filter, start + 1, end)
                    )
                ).pipe(
                    concatMap(events => events),
                    toArray(),
                    map(
                        allEvents => sortEventsAndRemoveDuplicates(allEvents)
                    ),
                    concatMap(
                        allEvents => allEvents.length > 0 ? (
                            update == null ?
                                initial(end) :
                                update([start + 1, end], allEvents as any as (Event & {args: E})[], prev)
                        ) : EMPTY
                    )
                )
        )
    }

    async resolveName(name: string): Promise<string> {
        return await this.provider.provider.resolveName(name)
    }

    private contractCache: {
        [name: string]: {
            [address: string]: TContract<any>
        }
    } = {}
    getContract<T extends TContract<any>>(definition: ContractDefinition<T>, address: string): T {
        address = addressNormalize(address)
        return (this.contractCache[address] ??= definition.loadContract(address)) as T
    }

    private exchangerCache: {
        [address: string]: ExchangerClient
    } = {}
    getExchangerClient(address: string): ExchangerClient {
        address = addressNormalize(address)
        return this.exchangerCache[address] ??= new ExchangerClient(this, address)
    }

    private stableTokenCache: {
        [address: string]: StableTokenClient
    } = {}
    getStableTokenClient(address: string): StableTokenClient {
        address = addressNormalize(address)
        return this.stableTokenCache[address] ??= new StableTokenClient(this, address)
    }

    private orderBookCache: {
        [address: string]: OrderBookClient
    } = {}
    getOrderBookClient(address: string): OrderBookClient {
        address = addressNormalize(address)
        return this.orderBookCache[address] ??= new OrderBookClient(this, address)
    }

    private balanceCache: {
        [address: string]: Observable<BigNumber>
    } = {}
    getBalance(address: string): Observable<BigNumber> {
        address = addressNormalize(address)
        return this.balanceCache[address] ??= this.blockNumber$.pipe(
            exhaustMapWithTrailing(
                blockNumber => this.provider.provider.getBalance(address, blockNumber)
            ),
            shareReplay(1)
        )
    }
}
