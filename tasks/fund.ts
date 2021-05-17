import { ethers } from "hardhat";
import {fromFixedPointString} from "../app/amount-utils";
import {baseClient} from "./task-utils";

export default async function(
    {
        account,
        amount,
    }: {
        account: string,
        amount: string,
    }
) {
    const amountInteger = fromFixedPointString(amount, baseClient.currency.precision)
    const firstSigner = (await ethers.getSigners())[0]
    await (await firstSigner.sendTransaction({
        to: account,
        value: amountInteger
    })).wait()
}