import {Contract} from "ethers";
import {BigNumber, BigNumberish} from "@ethersproject/bignumber";

export interface OrderBook extends Contract {
    admin(): Promise<string>
    multiplier(): Promise<BigNumber>
    putSellOrder(price: BigNumberish): Promise<void>;
    putBuyOrder(volume: BigNumberish, price: BigNumberish): Promise<void>;
    cancelSellOrder(id: BigNumberish): Promise<void>;
    cancelBuyOrder(id: BigNumberish): Promise<void>;
}