import {BigNumber, BigNumberish} from "@ethersproject/bignumber";
import {ExtendedContract, ExtendedEventFilter, Overrides, PayableOverrides} from "./extended";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import {OrderEntry, OrderEntryWithId} from "./order";

export interface Stats {
    buyersBalance: BigNumber,
    sellersVolume: BigNumber
}

export enum OrderType {
    Buy,
    Sell
}

export enum UpdateType {
    Match,
    PartialMatch,
    Cancel
}

export interface OrderUpdate {
    orderId: BigNumber,
    orderType: OrderType,
    updateType: UpdateType
}

export interface OrderAdd {
    orderId: BigNumber,
    orderType: OrderType,
    index: BigNumber
}

export interface OrderBook extends ExtendedContract<OrderBook> {
    admin(): Promise<string>
    divider(): Promise<BigNumber>
    stableToken(): Promise<string>
    getStats(overrides?: Overrides): Promise<Stats>
    getOrder(id: BigNumberish, orderType: OrderType, overrides?: Overrides): Promise<OrderEntry>
    getAllOrders(orderType: OrderType, overrides?: Overrides): Promise<OrderEntryWithId[]>
    putSellOrder(price: BigNumberish, overrides: PayableOverrides): Promise<TransactionResponse>;
    putBuyOrder(balance: BigNumberish, price: BigNumberish): Promise<TransactionResponse>;
    cancelSellOrder(id: BigNumberish): Promise<TransactionResponse>;
    cancelBuyOrder(id: BigNumberish): Promise<TransactionResponse>;

    filters: {
        OrderUpdate(orderId: BigNumberish|null, orderType: OrderType|null, updateType: UpdateType|null): ExtendedEventFilter<OrderUpdate>
        OrderAdd(orderId: BigNumberish|null, orderType: OrderType|null, index: BigNumberish|null): ExtendedEventFilter<OrderAdd>
    }
}