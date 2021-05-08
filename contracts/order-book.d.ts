import {Contract} from "ethers";
import {BigNumberish} from "@ethersproject/bignumber";

export interface OrderBook extends Contract {
    putSellOrder(price: BigNumberish): Promise<void>;
    putBuyOrder(volume: BigNumberish, price: BigNumberish): Promise<void>;
}