import React, {useState} from "react";
import {useParams,} from "react-router-dom";
import {OrderBookClient} from "../client/order-book";
import {
    AppBar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Divider,
    Grid,
    Hidden,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Theme,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
    Zoom
} from "@material-ui/core";
import {AmountInput} from "./amount-input";
import {BigNumber} from "ethers";
import {OrderEntryWithId} from "../contracts/order";
import {Currency} from "../client/currency";
import {AmountView} from "./amount-view";
import {OrderType} from "../contracts/order-book";
import {useWallet} from "./wallet-provider";
import {Wallet} from "../client/wallet";
import {ExchangerClient} from "../client/exchanger";
import {TransactionState} from "../client/mempool";
import {CircularProgressWithLabel} from "./circular-progress";
import {of} from "rxjs";
import {useLoggedObservable, useLoggedPromise} from "./logger-hooks";

export function OrderBookPage(
    {
        exchanger
    }: {
        exchanger: ExchangerClient
    }
) {
    let {currency} = useParams() as {currency: string}

    const [orderBook, , state] = useLoggedPromise(
        async () => {
            const stableToken = await exchanger.getStableToken(currency);
            if (stableToken == null) {
                return null;
            }
            return await exchanger.getOrderBook(stableToken);
        }, [currency, exchanger]
    )

    return <>
        {state === 'pending' && <Box m={4}>
            <Typography>Resolving order-book...</Typography>
        </Box>}
        {state === 'rejected' && <Box m={4}>
            <Typography>Couldn't resolve exchanger address!</Typography>
        </Box>}
        {state === 'resolved' && orderBook == null && <Box m={4}>
            <Typography>The exchanger doesn't support the currency: <b>{currency}</b></Typography>
        </Box>}

        {state === 'resolved' && orderBook && <OrderBookView orderBook={orderBook} />}
    </>
}

export function OrderBookView(
    {
        orderBook
    }: {
        orderBook: OrderBookClient
    }
) {
    const wallet = useWallet();

    const [tab, setTab] = useState<OrderType>(OrderType.Buy)

    const sm = useMediaQuery<Theme>(theme => theme.breakpoints.down('sm'));

    return <>
        {sm && <AppBar position="sticky" color="inherit">
            <Toolbar variant="dense">
                <Tabs
                    style={{flexGrow: 1}}
                    value={tab}
                    onChange={(e, selectedTab) => setTab(selectedTab)}
                    indicatorColor="primary"
                    textColor="primary"
                    centered >
                    <Tab label="Sell" value={OrderType.Sell} />
                    <Tab label="Buy" value={OrderType.Buy} />
                </Tabs>
            </Toolbar>
        </AppBar>}
        <Box p={4}>
            <Grid container spacing={3}>
                <Zoom in={!sm || tab === OrderType.Sell} unmountOnExit timeout={{exit: 0, enter: 350}}>
                    <Grid item xs={12} md={6}>
                        <Grid container spacing={3}>
                            <OrderBookTab orderBook={orderBook} wallet={wallet} orderType={OrderType.Sell} />
                        </Grid>
                    </Grid>
                </Zoom>
                <Zoom in={!sm || tab === OrderType.Buy} unmountOnExit timeout={{exit: 0, enter: 350}}>
                    <Grid item xs={12} md={6}>
                        <Grid container spacing={3}>
                            <OrderBookTab orderBook={orderBook} wallet={wallet} orderType={OrderType.Buy} />
                        </Grid>
                    </Grid>
                </Zoom>
            </Grid>
        </Box>
    </>
}

export function OrderBookTab(
    {
        orderBook,
        wallet,
        orderType
    }: {
        orderBook: OrderBookClient,
        wallet?: Wallet,
        orderType: OrderType
    }
) {
    return <>
        {orderType === OrderType.Sell && <Hidden mdDown><Grid item xs={4} /></Hidden>}
        <Grid item xs={12} lg={8}>
            {wallet && <OrderForm orderBook={orderBook} wallet={wallet} orderType={orderType} />}
        </Grid>
        {orderType === OrderType.Buy && <Hidden mdDown><Grid item xs={4} /></Hidden>}

        <Grid item xs={12}>
            <OrderStocks orderBook={orderBook} orderType={orderType} />
        </Grid>
    </>
}

export function OrderForm(
    {
        orderBook,
        wallet,
        orderType
    }: {
        orderBook: OrderBookClient,
        wallet: Wallet,
        orderType: OrderType
    }
) {
    const [stableToken] = useLoggedPromise(() => orderBook.getStableToken(), [orderBook]);
    const [stableCurrency] = useLoggedPromise(async () => await stableToken?.getCurrency(), [stableToken]);
    const [amount, setAmount] = useState<BigNumber>();
    const [price, setPrice] = useState<BigNumber>();

    const [bestPrices] = useLoggedObservable(
        () => orderBook.bestPrices$,
        [orderBook]
    )
    const bestPrice = orderType === OrderType.Buy ? bestPrices?.seller : bestPrices?.buyer;

    const [stableBalance] = useLoggedObservable(
        () => stableToken?.getBalance(wallet.getAddress()) ?? of(undefined),
        [stableToken, wallet]
    )
    const [cryptoBalance] = useLoggedObservable(
        () => orderBook.baseClient.getBalance(wallet.getAddress()),
        [wallet]
    )

    let amountErrorMessage: string | undefined;
    let priceErrorMessage: string | undefined;

    let hasError = false;

    if (amount !== undefined) {
        if (amount.lte(0)) {
            amountErrorMessage = 'must be > 0'
            hasError = true;
        }
    }

    if (price !== undefined) {
        if (price.lte(0)) {
            priceErrorMessage = 'must be > 0'
            hasError = true;
        }
    }

    const valid = !hasError && !!amount && !!price;
    const [sending, setSending] = useState(false);
    const [transactions] = useLoggedObservable(
        () => orderBook[
            orderType === OrderType.Sell ? "watchSellTransactions" : "watchBuyTransactions"
        ](wallet.getSigner()),
        [orderBook, wallet]
    )
    const pending = transactions?.filter(tx => tx.state === TransactionState.Pending)?.length ?? 0

    const putOrder = async () => {
        setSending(true);
        try {
            const tx = await orderBook[
                orderType === OrderType.Sell ? "putSellOrder" : "putBuyOrder"
            ](wallet.getSigner(), amount!, price!);
            console.log(tx);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    }

    const theme = useTheme()

    return <>{
        stableCurrency && <Card>
            <CardContent>
                {orderType === OrderType.Buy && <Typography>
                    {stableBalance && <AmountView amount={stableBalance.available} currency={stableCurrency} />}
                    {stableBalance?.locked.gt(0) && <>
                        &nbsp;
                        (<AmountView amount={stableBalance?.locked} currency={stableCurrency} /> Locked)
                    </>}
                </Typography>}
                {orderType === OrderType.Sell && <Typography>
                    {cryptoBalance && <AmountView amount={cryptoBalance} currency={orderBook.baseClient.currency} />}
                </Typography>}
            </CardContent>
            <Divider />
            <CardContent>
                <AmountInput currency={orderType === OrderType.Sell ? orderBook.baseClient.currency : stableCurrency}
                             onChange={setAmount}
                             textFieldProps={{
                                 label: orderType === OrderType.Sell ? "Volume" : "Balance",
                                 fullWidth: true,
                                 style: {
                                     marginBottom: theme.spacing(1)
                                 }
                             }}
                             errorMessage={amountErrorMessage}/>
                <AmountInput currency={stableCurrency}
                             onChange={setPrice}
                             defaultAmount={bestPrice}
                             textFieldProps={{
                                 label: "Price",
                                 fullWidth: true
                             }}
                             errorMessage={priceErrorMessage}/>
            </CardContent>
            <Divider/>
            <CardActions>
                <Button disabled={!valid || sending} onClick={() => putOrder()}>
                    {orderType === OrderType.Sell ? "Sell" : "Buy"}
                    {pending > 0 && <CircularProgressWithLabel label={pending} />}
                </Button>
            </CardActions>
        </Card>
    }</>
}

export function OrderStocks(
    {
        orderBook,
        orderType
    }: {
        orderBook: OrderBookClient,
        orderType: OrderType
    }
) {
    const [stableToken] = useLoggedPromise(() => orderBook.getStableToken(), [orderBook]);
    const [stableTokenCurrency] = useLoggedPromise(async () => await stableToken?.getCurrency(), [stableToken]);

    const [orders] = useLoggedObservable(() => orderBook.orders$, [orderBook]);

    const wallet = useWallet();

    return <>{
        stableTokenCurrency && orders &&
        <OrderTable orderBook={orderBook}
                    wallet={wallet}
                    currency={orderBook.baseClient.currency}
                    stableTokenCurrency={stableTokenCurrency}
                    orderType={orderType}
                    orders={orderType === OrderType.Sell ? orders.sellers : orders.buyers} />
    }</>
}

function OrderTable(
    {
        orderBook,
        orders,
        currency,
        stableTokenCurrency,
        orderType,
        wallet
    }: {
        orderBook: OrderBookClient,
        orders: OrderEntryWithId[],
        currency: Currency,
        stableTokenCurrency: Currency,
        orderType: OrderType,
        wallet?: Wallet
    }
) {
    const [cancelsTransactions] = useLoggedObservable(
        () => wallet == undefined ? of(undefined) : orderBook[
            orderType === OrderType.Buy ? "watchCancelBuyTransactions" : "watchCancelSellTransactions"
            ](wallet.getSigner()),
        [orderBook, wallet]
    )
    const pendingCancelTransactions = cancelsTransactions?.filter(tx => tx.state === TransactionState.Pending)?.length

    return <TableContainer component={Paper}>
        <Table size="small">
            <TableHead>
                <TableRow>
                    {orderType === OrderType.Sell && <TableCell>Volume</TableCell>}
                    {orderType === OrderType.Buy && <TableCell>Balance</TableCell>}
                    <TableCell>Price</TableCell>
                    <TableCell />
                </TableRow>
            </TableHead>
            <TableBody>
                {
                    orders.map(
                        order => <OrderRow key={order.id.toNumber()}
                                           orderBook={orderBook}
                                           wallet={wallet}
                                           pendingCancels={pendingCancelTransactions}
                                           order={order}
                                           orderType={orderType}
                                           stableTokenCurrency={stableTokenCurrency}
                                           currency={currency} />
                    )
                }
            </TableBody>
        </Table>
    </TableContainer>
}

function OrderRow(
    {
        orderBook,
        order,
        currency,
        stableTokenCurrency,
        orderType,
        wallet,
        pendingCancels
    }: {
        orderBook: OrderBookClient,
        order: OrderEntryWithId,
        currency: Currency,
        stableTokenCurrency: Currency,
        orderType: OrderType,
        wallet?: Wallet,
        pendingCancels?: number
    }
) {
    const owned = wallet?.getAddress() === order.entry.account;

    const [cancelling, setCancelling] = useState(false);

    const cancelOrder = async () => {
        setCancelling(true);
        try {
            const tx = await orderBook[orderType === OrderType.Sell ? 'cancelSellOrder' : 'cancelBuyOrder'](
                wallet!.getSigner(),
                order.id
            )
            console.log(tx);
        } catch (e) {
            console.error(e);
        } finally {
            setCancelling(false);
        }
    }

    return <TableRow>
        <TableCell>
            <AmountView amount={order.entry.amount}
                        currency={orderType === OrderType.Sell ? currency : stableTokenCurrency}
                        reduceZeros />
        </TableCell>
        <TableCell><AmountView amount={order.entry.price} currency={stableTokenCurrency}/></TableCell>
        <TableCell>
            {owned && <Button disabled={cancelling} onClick={() => cancelOrder()}>
                Cancel Order
                {pendingCancels != undefined && pendingCancels > 0 && <CircularProgressWithLabel label={pendingCancels} />}
            </Button>}
        </TableCell>
    </TableRow>
}
