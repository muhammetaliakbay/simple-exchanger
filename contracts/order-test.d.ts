import {Contract} from "ethers";
import {OrderEntry, OrderMatching} from "./order";
import {BigNumberish} from "@ethersproject/bignumber";

export interface OrderTest extends Contract {
    allBuyers(): Promise<OrderEntry[]>
    allSellers(): Promise<OrderEntry[]>
    putBuyOrder(account: string, volume: BigNumberish, price: BigNumberish): Promise<void>;
    putSellOrder(account: string, volume: BigNumberish, price: BigNumberish): Promise<void>;
    removeBuyOrder(account: string, id: BigNumberish): Promise<void>;
    removeSellOrder(account: string, id: BigNumberish): Promise<void>;
    matchBuyOrder(volume: BigNumberish, price: BigNumberish): Promise<void>;
    matching(): Promise<OrderMatching>;
}