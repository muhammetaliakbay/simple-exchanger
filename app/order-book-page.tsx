import React, {useState} from "react";
import {useParams,} from "react-router-dom";
import {useBaseClient} from "./base-client-provider";
import {useObservable} from "react-use-observable";
import usePromise from "react-use-promise";
import {OrderBookClient} from "../client/order-book";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@material-ui/core";
import {AmountInput} from "./amount-input";
import {BigNumber} from "ethers";
import {OrderEntryWithId} from "../contracts/order";
import {Currency} from "../client/currency";
import {AmountView} from "./amount-view";
import {OrderType} from "../contracts/order-book";
import {useWallet} from "./wallet-provider";
import {Wallet} from "../client/wallet";

export function OrderBookPage() {
    let {orderBookAddress} = useParams() as {orderBookAddress: string}

    const baseClient = useBaseClient();
    const orderBook = baseClient.getOrderBookClient(orderBookAddress)

    return <OrderBookView orderBook={orderBook} />
}

export function OrderBookView(
    {
        orderBook
    }: {
        orderBook: OrderBookClient
    }
) {
    const wallet = useWallet();

    return <>
        {wallet && <SellOrderForm orderBook={orderBook} wallet={wallet} />}
        {wallet && <BuyOrderForm orderBook={orderBook} wallet={wallet} />}
        <OrderStocks orderBook={orderBook} />
    </>
}

export function SellOrderForm(
    {
        orderBook,
        wallet
    }: {
        orderBook: OrderBookClient,
        wallet: Wallet
    }
) {
    const [stableToken] = usePromise(() => orderBook.getStableToken(), [orderBook]);
    const [currency] = usePromise(async () => await stableToken?.getCurrency(), [stableToken]);
    const [volume, setVolume] = useState<BigNumber>();
    const [price, setPrice] = useState<BigNumber>();

    let volumeErrorMessage: string | undefined;
    let priceErrorMessage: string | undefined;

    let hasError = false;

    if (volume !== undefined) {
        if (volume.lte(0)) {
            volumeErrorMessage = 'must be > 0'
            hasError = true;
        }
    }

    if (price !== undefined) {
        if (price.lte(0)) {
            priceErrorMessage = 'must be > 0'
            hasError = true;
        }
    }

    const valid = !hasError && !!volume && !!price;
    const [sending, setSending] = useState(false);

    const putOrder = async () => {
        setSending(true);
        try {
            const tx = await orderBook.putSellOrder(wallet.getSigner(), volume!, price!);
            console.log(tx);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    }

    return <>{
        currency && <Card>
            <CardContent>
                <AmountInput currency={orderBook.baseClient.currency}
                             onChange={setVolume}
                             textFieldProps={{label: "Volume"}}
                             errorMessage={volumeErrorMessage}/>
                <br/>
                <AmountInput currency={currency}
                             onChange={setPrice}
                             textFieldProps={{label: "Price"}}
                             errorMessage={priceErrorMessage}/>
            </CardContent>
            <CardActions>
                <Button disabled={!valid && !sending} onClick={() => putOrder()}>Sell</Button>
            </CardActions>
        </Card>
    }</>
}

export function BuyOrderForm(
    {
        orderBook,
        wallet
    }: {
        orderBook: OrderBookClient,
        wallet: Wallet
    }
) {
    const [stableToken] = usePromise(() => orderBook.getStableToken(), [orderBook]);
    const [currency] = usePromise(async () => await stableToken?.getCurrency(), [stableToken]);
    const [balance, setBalance] = useState<BigNumber>();
    const [price, setPrice] = useState<BigNumber>();

    let balanceErrorMessage: string | undefined;
    let priceErrorMessage: string | undefined;

    let hasError = false;

    if (balance !== undefined) {
        if (balance.lte(0)) {
            balanceErrorMessage = 'must be > 0'
            hasError = true;
        }
    }

    if (price !== undefined) {
        if (price.lte(0)) {
            priceErrorMessage = 'must be > 0'
            hasError = true;
        }
    }

    const valid = !hasError && !!balance && !!price;
    const [sending, setSending] = useState(false);

    const putOrder = async () => {
        setSending(true);
        try {
            const tx = await orderBook.putBuyOrder(wallet.getSigner(), balance!, price!);
            console.log(tx);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    }

    return <>{
        currency && <Card>
            <CardContent>
                <AmountInput currency={currency}
                             onChange={setBalance}
                             textFieldProps={{label: "Balance"}}
                             errorMessage={balanceErrorMessage}/>
                <br/>
                <AmountInput currency={currency}
                             onChange={setPrice}
                             textFieldProps={{label: "Price"}}
                             errorMessage={priceErrorMessage}/>
            </CardContent>
            <CardActions>
                <Button disabled={!valid && !sending} onClick={() => putOrder()}>Buy</Button>
            </CardActions>
        </Card>
    }</>
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
            <OrderTable orderBook={orderBook}
                        wallet={wallet}
                        currency={orderBook.baseClient.currency}
                        stableTokenCurrency={stableTokenCurrency}
                        orderType={OrderType.Sell}
                        orders={orders.sellers}/>
            <OrderTable orderBook={orderBook}
                        wallet={wallet}
                        currency={orderBook.baseClient.currency}
                        stableTokenCurrency={stableTokenCurrency}
                        orderType={OrderType.Buy}
                        orders={orders.buyers}/>
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
    return <TableContainer component={Paper}>
        <Table>
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
        wallet
    }: {
        orderBook: OrderBookClient,
        order: OrderEntryWithId,
        currency: Currency,
        stableTokenCurrency: Currency,
        orderType: OrderType,
        wallet?: Wallet
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
            {owned && <Button disabled={cancelling} onClick={() => cancelOrder()}>Cancel Order</Button>}
        </TableCell>
    </TableRow>
}
