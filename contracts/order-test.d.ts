import {OrderEntryWithId, OrderMatching} from "./order";
import {TContract} from "./extended";
import {BigNumber} from "ethers";

export type TOrderTest = TContract<{
    functions: {
        allBuyers(): OrderEntryWithId[]
        allSellers(): OrderEntryWithId[]
        putBuyOrder(account: string, balance: BigNumber, price: BigNumber): void;
        putSellOrder(account: string, volume: BigNumber, price: BigNumber): void;
        removeBuyOrder(account: string, id: BigNumber): void;
        removeSellOrder(account: string, id: BigNumber): void;
        matchBuyOrder(balance: BigNumber, price: BigNumber): void;
        matchSellOrder(volume: BigNumber, price: BigNumber): void;
        matching(): OrderMatching;
    }
}>
