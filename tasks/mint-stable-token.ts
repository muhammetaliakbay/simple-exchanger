import { ethers } from "hardhat";
import {BaseClient} from "../client/base-client";
import {getAddress} from "./task-utils";
import {fromFixedPointString} from "../app/amount-utils";

export default async function(
    {
        account,
        amount,
        currency
    }: {
        account: string,
        amount: string,
        currency: string
    }
) {
    account = await getAddress(account)

    const baseClient = new BaseClient(ethers.provider)
    const exchanger = baseClient.getExchangerClient()
    const stableToken = await exchanger.getStableToken(currency)
    if (!stableToken) {
        throw new Error(`Couldn't found specified stable token with currency: ${currency}`)
    }
    const tokenCurrency = await stableToken.getCurrency();

    const stableTokenContract = stableToken.contract.connect(
        await ethers.getSigner(
            await stableToken.contract.admin()
        )
    )

    const amountInteger = fromFixedPointString(amount, tokenCurrency.precision);

    await (await stableTokenContract.mint(account, amountInteger)).wait()

}