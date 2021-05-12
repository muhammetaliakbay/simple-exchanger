import {Wallet} from "../client/wallet";
import {Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@material-ui/core";
import React from "react";
import {StableTokenAccount, StableTokenClient} from "../client/stable-token";
import usePromise from "react-use-promise";
import {useObservable} from "react-use-observable";
import {Link, useRouteMatch} from "react-router-dom";
import {toFixedPointString} from "./amount-utils";

export function WalletOverview(
    {
        wallet,
        tokens
    }: {
        wallet: Wallet,
        tokens: StableTokenClient[]
    }
) {
    const address = wallet.getAddress();
    const accounts = tokens.map(
        token => token.getAccount(address)
    )

    return <TableContainer component={Paper}>
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>Currency</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Locked</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell />
                </TableRow>
            </TableHead>
            <TableBody>
                {accounts.map(
                    account => <AccountRow key={account.client.getContractAddress()} account={account} />
                )}
            </TableBody>
        </Table>
    </TableContainer>
}

function AccountRow(
    {
        account
    }: {
        account: StableTokenAccount
    }
) {
    const {url} = useRouteMatch();

    const token = account.client;
    const [currency] = usePromise(() => token.getCurrency(), [token])
    const [balance] = useObservable(() => account.balance$, [account])

    return <TableRow>
        <TableCell>{currency?.code}</TableCell>
        <TableCell>{balance && currency && toFixedPointString(balance.available, currency.precision)}</TableCell>
        <TableCell>{balance && currency && toFixedPointString(balance.locked, currency.precision)}</TableCell>
        <TableCell>{balance && currency && toFixedPointString(balance.available.add(balance.locked), currency.precision)}</TableCell>
        <TableCell>
            {
                currency && <>
                    <Link to={`${url}/${currency.code}/deposit`}>
                        <Button>Deposit</Button>
                    </Link>
                    <Link to={`${url}/${currency.code}/withdraw`}>
                        <Button>Withdraw</Button>
                    </Link>
                </>
            }
        </TableCell>
    </TableRow>
}
