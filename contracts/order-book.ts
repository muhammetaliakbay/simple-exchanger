import {BigNumber, BigNumberish} from "@ethersproject/bignumber";
import {
    TContract,
} from "./extended";
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

export type TOrderBook = TContract<{
    functions: {
        admin(): string
        divider(): BigNumber
        stableToken(): string
        getStats(): Stats
        getOrder(id: BigNumber, orderType: OrderType): OrderEntry
        getAllOrders(orderType: OrderType): OrderEntryWithId[]
        putSellOrder(price: BigNumber): void
        putBuyOrder(balance: BigNumber, price: BigNumberish): void
        cancelSellOrder(id: BigNumber): void
        cancelBuyOrder(id: BigNumber): void
    }

    events: {
        OrderUpdate(orderId: BigNumberish, orderType: OrderType, updateType: UpdateType)
        OrderAdd(orderId: BigNumberish, orderType: OrderType, index: BigNumberish)
    }
}>;
