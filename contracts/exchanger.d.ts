import {BigNumber} from "ethers";
import {TContract} from "./extended";

export type TExchanger = TContract<{
    functions: {
        admin(): string
        addManager(newManager: string): void
        stableTokens(index: BigNumber): string
        orderBooks(index: BigNumber): string
        registerStableToken(stableTokenAddress: string): void
        registerOrderBook(orderBookAddress: string): void
        totalStableTokens(): BigNumber
        totalOrderBooks(): BigNumber
    }
}>
