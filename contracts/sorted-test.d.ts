import {Contract} from "ethers";
import {BigNumberish} from "@ethersproject/bignumber";

export interface SortedTest extends Contract {
    length(): Promise<BigNumberish>
    all(): Promise<string[]>
    insert(rank: BigNumberish, value: string, asc: boolean): Promise<void>
    removeFirst(): Promise<void>
    removeAt(offset: BigNumberish): Promise<void>
}