import React from "react";
import {
    Link,
    useParams
} from "react-router-dom";
import {useBaseClient} from "./base-client-provider";
import {useObservable} from "react-use-observable";
import usePromise from "react-use-promise";
import {ExchangerClient} from "../client/exchanger";
import {ExchangerDefinition} from "../instances/definitions";
import {Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@material-ui/core";
import {OrderBookClient} from "../client/order-book";
import {StableTokenName} from "./stable-token";
import {useWallet} from "./wallet-provider";
import {WalletOverview} from "./wallet-overview";
import {AmountView} from "./amount-view";

export function ExchangerPage() {
    let {exchangerAddress} = useParams() as {exchangerAddress: string}
    if (exchangerAddress === 'default') {
        exchangerAddress = ExchangerDefinition.loadDefaultAddress();
    }

    const baseClient = useBaseClient();
    const exchanger = baseClient.getExchangerClient(exchangerAddress)

    return <ExchangerView exchanger={exchanger} />
}

export function ExchangerView(
    {
        exchanger
    }: {
        exchanger: ExchangerClient
    }
) {
    const [tokens] = usePromise(() => exchanger.getStableTokens(), [exchanger])
    const [orderBooks] = usePromise(() => exchanger.getOrderBooks(), [exchanger])
    const wallet = useWallet();
    return <>
        {wallet && tokens && <WalletOverview wallet={wallet} tokens={tokens} />}
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Stable token</TableCell>
                        <TableCell>Sellers Volume</TableCell>
                        <TableCell>Buyers Balance</TableCell>
                        <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {orderBooks && orderBooks.map(
                        orderBook => <OrderBookRow key={orderBook.getContractAddress()} orderBook={orderBook} />
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </>
}

export function OrderBookRow(
    {
        orderBook
    }: {
        orderBook: OrderBookClient
    }
) {
    const [stableToken] = usePromise(() => orderBook.getStableToken(), [orderBook])
    const [stats] = useObservable(() => orderBook.stats$, [orderBook])
    const currency = orderBook.baseClient.currency;
    const [stableCurrency] = usePromise(async () => await stableToken?.getCurrency(), [stableToken])

    return <TableRow>
        <TableCell>
            {stableToken && <StableTokenName token={stableToken} />}
        </TableCell>
        <TableCell>
            {stats && <AmountView amount={stats.sellersVolume} currency={currency} reduceZeros />}
        </TableCell>
        <TableCell>
            {stats && stableCurrency && <AmountView amount={stats.buyersBalance} currency={stableCurrency} />}
        </TableCell>
        <TableCell>
            <Link to={`/order-books/${orderBook.contract.address}`}>
                <Button>Trade</Button>
            </Link>
        </TableCell>
    </TableRow>
}
