import { ethers } from "hardhat";
import {BaseClient} from "../client/base-client";
import {fromFixedPointString} from "../app/amount-utils";
import {getSigner} from "./task-utils";
import {deployment} from "../deployment/deployment-info";
import ETH from "../eth.json";

export default async function(
    {
        account,
        volume,
        currency,
        price
    }: {
        account: string,
        volume: string,
        currency: string,
        price: string
    }
) {
    const signer = await getSigner(account)

    const baseClient = new BaseClient(ethers.provider, ETH)
    const exchanger = baseClient.getExchangerClient(deployment().exchangeAddress)
    const stableToken = await exchanger.getStableToken(currency)
    if (!stableToken) {
        throw new Error(`Couldn't found specified stable token with currency: ${currency}`)
    }
    const orderBook = await exchanger.getOrderBook(stableToken);
    if (!orderBook) {
        throw new Error(`Couldn't found specified order-book with currency: ${currency}`)
    }
    const tokenCurrency = await stableToken.getCurrency();

    const volumeInteger = fromFixedPointString(volume, baseClient.currency.precision);
    const priceInteger = fromFixedPointString(price, tokenCurrency.precision);

    await (await orderBook.putSellOrder(
        signer, volumeInteger, priceInteger
    )).wait()

}