import {BigNumber, BigNumberish} from "@ethersproject/bignumber";

export interface OrderEntry {
    account: string,
    amount: BigNumber,
    price: BigNumber
}
export interface OrderEntryWithId {
    id: BigNumber,
    entry: OrderEntry
}

export type OrderMatching = [
    found: boolean,
    more: boolean,
    account: string,
    volume: BigNumberish,
    cost: BigNumberish,
    sellerVolumeLeft: BigNumberish,
    buyerVolumeLeft: BigNumberish
]
