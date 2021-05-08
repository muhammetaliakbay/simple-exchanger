import {Contract} from "ethers";
import {BigNumber, BigNumberish} from "@ethersproject/bignumber";

export interface StableToken extends Contract {
    admin(): Promise<string>
    currency(): Promise<string>
    divisor(): Promise<BigNumber>
    addManager(newManager: string): Promise<void>
    mint(to: string, amount: BigNumberish): Promise<void>
    burn(from: string, amount: BigNumberish): Promise<void>
    transfer(from: string, to: string, amount: BigNumberish): Promise<void>
    transferLocked(from: string, to: string, amount: BigNumberish): Promise<void>
    lock(from: string, amount: BigNumberish): Promise<void>
    unlock(to: string, amount: BigNumberish): Promise<void>
}