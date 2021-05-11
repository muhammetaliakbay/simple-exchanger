import { ethers } from "hardhat";
import {BaseClient} from "../client/base-client";
import {getAddress} from "./task-utils";
import {fromFixedPointString} from "../app/amount-utils";
import {deployment} from "../deployment/deployment-info";
import ETH from "../eth.json";

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

    const baseClient = new BaseClient(ethers.provider, ETH)
    const exchanger = baseClient.getExchangerClient(deployment().exchangeAddress)
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