import React, {useState} from "react";
import {useParams,} from "react-router-dom";
import {useObservable} from "react-use-observable";
import usePromise from "react-use-promise";
import {OrderBookClient} from "../client/order-book";
import {
    Button,
    Card,
    CardActions,
    CardContent, Divider,
    Grid,
    Hidden,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow, Typography
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

export function OrderBookPage(
    {
        exchanger
    }: {
        exchanger: ExchangerClient
    }
) {
    let {currency} = useParams() as {currency: string}

    const [orderBook, , state] = usePromise(
        async () => {
            const stableToken = await exchanger.getStableToken(currency);
            if (stableToken == null) {
                return null;
            }
            return await exchanger.getOrderBook(stableToken);
        }, [currency, exchanger]
    )

    return <>
        {state === 'pending' && <>
            Resolving order-book...
        </>}
        {state === 'rejected' && <>
            Couldn't resolve exchanger address!
        </>}
        {state === 'resolved' && orderBook == null && <>
            The exchanger doesn't support the currency: {currency}
        </>}

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

    return <Grid container spacing={3}>
        {wallet && <>
            <Hidden mdDown><Grid item xs={3} /></Hidden>
            <OrderForm orderBook={orderBook} wallet={wallet} orderType={OrderType.Sell} />

            <OrderForm orderBook={orderBook} wallet={wallet} orderType={OrderType.Buy} />
            <Hidden mdDown><Grid item xs={3} /></Hidden>
        </>}
        <OrderStocks orderBook={orderBook} />
    </Grid>
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
    const [stableToken] = usePromise(() => orderBook.getStableToken(), [orderBook]);
    const [stableCurrency] = usePromise(async () => await stableToken?.getCurrency(), [stableToken]);
    const [amount, setAmount] = useState<BigNumber>();
    const [price, setPrice] = useState<BigNumber>();

    const [stableBalance] = useObservable(
        () => stableToken?.getBalance(wallet.getAddress()) ?? of(undefined),
        [stableToken, wallet]
    )
    const [cryptoBalance] = useObservable(
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
    const [transactions, error] = useObservable(
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

    return <Grid item sm={6} lg={3}>{
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
                             textFieldProps={{label: orderType === OrderType.Sell ? "Volume" : "Balance"}}
                             errorMessage={amountErrorMessage}/>
                <br/>
                <AmountInput currency={stableCurrency}
                             onChange={setPrice}
                             textFieldProps={{label: "Price"}}
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
    }</Grid>
}

export function OrderStocks(
    {
        orderBook
    }: {
        orderBook: OrderBookClient
    }
) {
    const [stableToken] = usePromise(() => orderBook.getStableToken(), [orderBook]);
    const [stableTokenCurrency] = usePromise(async () => await stableToken?.getCurrency(), [stableToken]);

    const [orders] = useObservable(() => orderBook.orders$, [orderBook]);

    const wallet = useWallet();

    return <>{
        stableTokenCurrency && orders && <>
            <Grid item sm={6}>
                <OrderTable orderBook={orderBook}
                            wallet={wallet}
                            currency={orderBook.baseClient.currency}
                            stableTokenCurrency={stableTokenCurrency}
                            orderType={OrderType.Sell}
                            orders={orders.sellers}/>
            </Grid>
            <Grid item sm={6}>
                <OrderTable orderBook={orderBook}
                            wallet={wallet}
                            currency={orderBook.baseClient.currency}
                            stableTokenCurrency={stableTokenCurrency}
                            orderType={OrderType.Buy}
                            orders={orders.buyers}/>
            </Grid>
        </>
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
    const [cancelsTransactions, error] = useObservable(
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
