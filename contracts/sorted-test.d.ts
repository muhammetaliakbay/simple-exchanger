import {BigNumberish} from "@ethersproject/bignumber";
import {TContract} from "./extended";
import {BigNumber} from "ethers";

export type TSortedTest = TContract<{
    functions: {
        length(): BigNumber
        all(): string[]
        insert(rank: BigNumberish, value: string, asc: boolean): void
        removeFirst(): void
        removeAt(offset: BigNumberish): void
        remove(id: BigNumberish): void
    }
}>
