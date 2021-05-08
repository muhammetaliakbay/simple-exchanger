import { BigNumberish } from "@ethersproject/bignumber";

export type OrderEntry = [
    account: string,
    volume: BigNumberish,
    price: BigNumberish
];

export type OrderMatching = [
    found: boolean,
    more: boolean,
    account: string,
    volume: BigNumberish,
    cost: BigNumberish,
    sellerVolumeLeft: BigNumberish,
    buyerVolumeLeft: BigNumberish
]
