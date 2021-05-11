import {Contract, BigNumberish} from "ethers";
import {OrderEntryWithId, OrderMatching} from "./order";

export interface OrderTest extends Contract {
    allBuyers(): Promise<OrderEntryWithId[]>
    allSellers(): Promise<OrderEntryWithId[]>
    putBuyOrder(account: string, balance: BigNumberish, price: BigNumberish): Promise<void>;
    putSellOrder(account: string, volume: BigNumberish, price: BigNumberish): Promise<void>;
    removeBuyOrder(account: string, id: BigNumberish): Promise<void>;
    removeSellOrder(account: string, id: BigNumberish): Promise<void>;
    matchBuyOrder(balance: BigNumberish, price: BigNumberish): Promise<void>;
    matchSellOrder(volume: BigNumberish, price: BigNumberish): Promise<void>;
    matching(): Promise<OrderMatching>;
}