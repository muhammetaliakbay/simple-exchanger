import {EventFilter, BigNumberish, BigNumber} from "ethers";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import {ExtendedContract, Overrides} from "./extended";
import {Currency} from "../client/currency";

export type Balance = [
    available: BigNumber,
    locked: BigNumber
];

export interface StableToken extends ExtendedContract<StableToken> {
    admin(): Promise<string>
    code(): Promise<string>
    precision(): Promise<number>
    getCurrency(): Promise<Currency>
    addManager(newManager: string): Promise<TransactionResponse>
    mint(to: string, amount: BigNumberish): Promise<TransactionResponse>
    burn(from: string, amount: BigNumberish): Promise<TransactionResponse>
    transfer(from: string, to: string, amount: BigNumberish): Promise<TransactionResponse>
    transferLocked(from: string, to: string, amount: BigNumberish): Promise<TransactionResponse>
    lock(from: string, amount: BigNumberish): Promise<TransactionResponse>
    unlock(to: string, amount: BigNumberish): Promise<TransactionResponse>
    availableBalance(account: string): Promise<BigNumber>
    lockedBalance(account: string): Promise<BigNumber>
    balance(account: string, overrides?: Overrides): Promise<Balance>

    filters: {
        Mint(manager: string|null, to: string|null): EventFilter
        Burn(manager: string|null, from: string|null): EventFilter
        Transfer(manager: string|null, from: string|null, to: string|null): EventFilter
        Lock(manager: string|null, from: string|null): EventFilter
        Unlock(manager: string|null, to: string|null): EventFilter
    }
}