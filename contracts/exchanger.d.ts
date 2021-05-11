import {ExtendedContract} from "./extended";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import {BigNumberish} from "ethers";

export interface Exchanger extends ExtendedContract<Exchanger> {
    admin(): Promise<string>
    addManager(newManager: string): Promise<TransactionResponse>
    stableTokens(index: BigNumberish): Promise<string>
    orderBooks(index: BigNumberish): Promise<string>
    registerStableToken(stableTokenAddress: string): Promise<TransactionResponse>
    registerOrderBook(orderBookAddress: string): Promise<TransactionResponse>
    totalStableTokens(): Promise<BigNumberish>
    totalOrderBooks(): Promise<BigNumberish>
}