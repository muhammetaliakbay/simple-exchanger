import React from "react";
import {
    Link, Route,
    Switch,
    useParams, useRouteMatch
} from "react-router-dom";
import {useBaseClient} from "./base-client-provider";
import {useObservable} from "react-use-observable";
import usePromise from "react-use-promise";
import {ExchangerClient} from "../client/exchanger";
import {Button, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@material-ui/core";
import {OrderBookClient} from "../client/order-book";
import {StableTokenName} from "./stable-token";
import {useWallet} from "./wallet-provider";
import {WalletOverview} from "./wallet-overview";
import {AmountView} from "./amount-view";
import {ethers} from "ethers";
import {OrderBookPage} from "./order-book-page";

export function ExchangerPage() {
    let {exchangerAddress} = useParams() as {exchangerAddress: string}

    const baseClient = useBaseClient();

    const [resolvedAddress, , state] = usePromise(
        async () => {
            if (ethers.utils.isAddress(exchangerAddress)) {
                return exchangerAddress
            } else {
                return baseClient.resolveName(exchangerAddress);
            }
        }, [exchangerAddress, baseClient]
    )

    const exchanger = resolvedAddress && baseClient.getExchangerClient(resolvedAddress)

    const {path} = useRouteMatch();

    return <>
        {state === 'pending' && <>
            Resolving exchanger address...
        </>}
        {state === 'rejected' && <>
            Couldn't resolve exchanger address!
        </>}
        {state === 'resolved' && resolvedAddress == null && <>
            Address is not found
        </>}

        {state === 'resolved' && exchanger && <Switch>
            <Route exact path={`${path}`}>
                <ExchangerView exchanger={exchanger} />
            </Route>
            <Route path={`${path}/:currency`}>
                <OrderBookPage exchanger={exchanger} />
            </Route>
        </Switch>}
    </>
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

    const showWallet = wallet && tokens;

    return <Grid container spacing={2}>
        {showWallet && <Grid item md={12} lg={6}>
            <WalletOverview wallet={wallet!} tokens={tokens!} />
        </Grid>}
        <Grid item md={12} lg={showWallet ? 6 : 12}>
            <TableContainer component={Paper}>
                <Table size="small">
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
        </Grid>
    </Grid>
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

    const {url} = useRouteMatch();

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
            {stats && stableCurrency && <Link to={`${url}/${stableCurrency.code}`}>
                <Button>Trade</Button>
            </Link>}
        </TableCell>
    </TableRow>
}
