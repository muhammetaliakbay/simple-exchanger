import {
    Avatar,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Select,
    Typography
} from "@material-ui/core";
import React, {useState} from "react";
import {AccountCircle} from "@material-ui/icons";

export function AccountSelect(
    {
        address,
        addresses,
        setAddress
    }: {
        address?: string,
        addresses: string[],
        setAddress: (newAddress: string) => void
    }
) {
    const [open, setOpen] = useState(false);

    return <>
        <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>
                Select account
            </DialogTitle>
            <DialogContent>
                <Select value={address}
                        fullWidth
                        onChange={e => setAddress(e.target.value as string)}>{
                    addresses.map(
                        address => <MenuItem key={address} value={address}>
                            <Typography noWrap>
                                {address}
                            </Typography>
                        </MenuItem>
                    )
                }</Select>
            </DialogContent>
        </Dialog>
        {
            (address != undefined) && <Avatar onClick={() => setOpen(true)}>{
                address.substring(0, 4)
            }</Avatar>
        }
        {
            (address == undefined) && <IconButton color="inherit" onClick={() => setOpen(true)}>
                <AccountCircle />
            </IconButton>
        }
    </>
}
