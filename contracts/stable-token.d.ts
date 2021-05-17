import {BigNumber} from "ethers";
import {Currency} from "../client/currency";
import {TContract} from "./extended";

export type Balance = [
    available: BigNumber,
    locked: BigNumber
];

export type TStableToken = TContract<{
    functions: {
        admin(): string
        code(): string
        precision(): number
        getCurrency(): Currency
        addManager(newManager: string): void
        mint(to: string, amount: BigNumber): void
        burn(from: string, amount: BigNumber): void
        transfer(from: string, to: string, amount: BigNumber): void
        transferLocked(from: string, to: string, amount: BigNumber): void
        lock(from: string, amount: BigNumber): void
        unlock(to: string, amount: BigNumber): void
        availableBalance(account: string): BigNumber
        lockedBalance(account: string): BigNumber
        balance(account: string): Balance
    }

    filters: {
        Mint(manager: string, to: string)
        Burn(manager: string, from: string)
        Transfer(manager: string, from: string, to: string)
        Lock(manager: string, from: string)
        Unlock(manager: string, to: string)
    }
}>
