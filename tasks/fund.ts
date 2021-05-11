import { ethers } from "hardhat";
import {BaseClient} from "../client/base-client";
import {fromFixedPointString} from "../app/amount-utils";

export default async function(
    {
        account,
        amount,
    }: {
        account: string,
        amount: string,
    }
) {
    const baseClient = new BaseClient(ethers.provider)
    const amountInteger = fromFixedPointString(amount, baseClient.currency.precision)
    const firstSigner = (await ethers.getSigners())[0]
    await (await firstSigner.sendTransaction({
        to: account,
        value: amountInteger
    })).wait()
}