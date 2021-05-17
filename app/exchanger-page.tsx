import React from "react";
import {
    Link, Route,
    Switch,
    useParams, useRouteMatch
} from "react-router-dom";
import {useBaseClient} from "./base-client-provider";
import {ExchangerClient} from "../client/exchanger";
import {
    Box,
    Button,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow, Typography
} from "@material-ui/core";
import {OrderBookClient} from "../client/order-book";
import {StableTokenName} from "./stable-token";
import {useAccount} from "./account-provider";
import {AccountOverview} from "./account-overview";
import {AmountView} from "./amount-view";
import {ethers} from "ethers";
import {OrderBookPage} from "./order-book-page";
import {useLoggedObservable, useLoggedPromise} from "./logger-hooks";

export function ExchangerPage() {
    let {exchangerAddress} = useParams() as {exchangerAddress: string}

    const baseClient = useBaseClient();

    const [resolvedAddress, , state] = useLoggedPromise(
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
        {state === 'pending' && <Box m={4}>
            <Typography>Resolving exchanger address...</Typography>
        </Box>}
        {state === 'rejected' && <Box m={4}>
            <Typography>Couldn't resolve exchanger address!</Typography>
        </Box>}
        {state === 'resolved' && resolvedAddress == null && <Box m={4}>
            <Typography>Address is not found</Typography>
        </Box>}

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
    const [tokens] = useLoggedPromise(() => exchanger.getStableTokens(), [exchanger])
    const [orderBooks] = useLoggedPromise(() => exchanger.getOrderBooks(), [exchanger])
    const account = useAccount();

    const showWallet = account && tokens;

    return <Box p={4}>
        <Grid container spacing={2}>
            {showWallet && <Grid item xs={12} lg={6}>
                <AccountOverview account={account!} tokens={tokens!} />
            </Grid>}
            <Grid item xs={12} lg={showWallet ? 6 : 12}>
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
    </Box>
}

export function OrderBookRow(
    {
        orderBook
    }: {
        orderBook: OrderBookClient
    }
) {
    const [stableToken] = useLoggedPromise(() => orderBook.getStableToken(), [orderBook])
    const [stats] = useLoggedObservable(() => orderBook.stats$, [orderBook])
    const currency = orderBook.baseClient.currency;
    const [stableCurrency] = useLoggedPromise(async () => await stableToken?.getCurrency(), [stableToken])

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
