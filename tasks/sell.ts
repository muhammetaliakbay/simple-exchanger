import {fromFixedPointString} from "../app/amount-utils";
import {baseClient, getAccount, memPool} from "./task-utils";
import {deployment} from "../deployment/deployment-info";

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
    const acc = await getAccount(account)

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

    await memPool.wait(
        await orderBook.putSellOrder(
            acc, volumeInteger, priceInteger
        )
    )

}