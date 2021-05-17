import {
    Avatar, Button,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    List, ListItem, ListItemAvatar, ListItemSecondaryAction, ListItemText,
    Typography
} from "@material-ui/core";
import React, {useEffect, useMemo, useState} from "react";
import {AccountCircle, Close, ListAlt} from "@material-ui/icons";
import {addressNormalize} from "../client/address-util";
import {Account, AddressAccess, WalletWithInfo} from "../client/providers";

export function AccountSelect(
    {
        setAccount,
        wallets
    }: {
        setAccount: (account: Account | undefined) => void,
        wallets: WalletWithInfo[]
    }
) {
    const accounts = useMemo(
        () => wallets == undefined ? undefined : ([] as Account[]).concat(
            ...(
                wallets.filter<WalletWithInfo & {access: AddressAccess.Available}>(
                    (wallet => wallet.access === AddressAccess.Available) as any
                ).map(
                    wallet => wallet.accounts
                )
            )
        ),
        [wallets]
    )

    const [open, setOpen] = useState(false);
    const [selectedAddress, selectAddress] = useState<string | undefined>(
        () => localStorage.getItem("selected-address") ?? undefined
    );
    const theAccount = accounts == undefined || selectedAddress == undefined ? undefined : accounts.find(acc => acc.address === selectedAddress)
    useEffect(
        () => {
            setAccount(theAccount);
        },
        [theAccount]
    )
    useEffect(
        () => {
            if (selectedAddress == undefined) {
                localStorage.removeItem("selected-address")
            } else {
                localStorage.setItem("selected-address", selectedAddress)
            }
        },
        [selectedAddress]
    )

    const listedWallets = wallets.filter(wallet => wallet.access !== AddressAccess.NotAvailable)

    return <>
        {accounts && <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>
                Select account
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        {accounts.length > 0 && <List>
                            {accounts.map(
                                account => <ListItem key={account.address}
                                                     selected={account === theAccount}
                                                     button
                                                     onClick={
                                                         () => {
                                                             selectAddress(account.address)
                                                             setOpen(false)
                                                         }
                                                     }>
                                    <ListItemAvatar>
                                        <Avatar>{
                                            account.address.substring(0, 4)
                                        }</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={<Typography noWrap>
                                        {addressNormalize(account.address)}
                                    </Typography>} />
                                </ListItem>
                            )}
                        </List>}
                        {accounts.length === 0 && <Typography>
                            No accounts connected.
                        </Typography>}
                    </Grid>

                    {listedWallets.length > 0 && <>
                        <Grid xs={12} item>
                            <List>
                                {listedWallets.map(
                                    wallet => <ListItem key={wallet.name}
                                                        button={(wallet.access === AddressAccess.NeedRequest) as any}
                                                        onClick={"request" in wallet ? (() => wallet.request()) : undefined}>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <img style={{width: "100%", height:"100%"}} src={`assets/${wallet.name}.svg`}/>
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={wallet.title} />
                                        <ListItemSecondaryAction>
                                            {"manage" in wallet && <IconButton edge="end"
                                                        onClick={"manage" in wallet ? (() => wallet.manage?.()) : undefined}>
                                                <ListAlt />
                                            </IconButton>}
                                            {"disconnect" in wallet && <IconButton edge="end"
                                                        onClick={"disconnect" in wallet ? (() => wallet.disconnect?.()) : undefined}>
                                                <Close />
                                            </IconButton>}
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                )}
                            </List>
                        </Grid>
                    </>}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)}>
                    Ok
                </Button>
            </DialogActions>
        </Dialog>}
        <IconButton color="inherit" onClick={() => setOpen(true)}>
            {
                (theAccount != undefined) && <Avatar>{
                    theAccount.address.substring(0, 4)
                }</Avatar>
            }
            {
                (theAccount == undefined) && <AccountCircle />
            }
        </IconButton>
    </>
}
