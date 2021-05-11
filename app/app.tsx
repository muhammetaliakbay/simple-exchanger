import React, {useMemo, useState} from "react";
import {
    BrowserRouter as Router,
    Switch,
    Route,
} from "react-router-dom";
import {BaseClientProvider} from "./base-client-provider";
import {BaseClient} from "../client/base-client";
import {ethers} from "ethers";
import {ExchangerPage} from "./exchanger-page";
import {Wallet} from "../client/wallet";
import {WalletProvider} from "./wallet-provider";
import {OrderBookPage} from "./order-book-page";
import usePromise from "react-use-promise";
import detectEthereumProvider from "@metamask/detect-provider";
import {Button, MenuItem, Select} from "@material-ui/core";

export function App() {
    const [providerTry, setProviderTry] = useState(0);
    const [accessTry, setAccessTry] = useState(0);
    const [provider, , providerState] = usePromise(() => detectEthereumProvider(), [providerTry]);
    const [ , , accessState] = usePromise(
        async () => (provider != null) && (provider as any).request({ method: 'eth_requestAccounts' }),
        [provider, accessTry]
    );

    return <>
        {
            providerState === 'pending' && <>
                Looking for Ethereum provider...<br/>
                Please wait...
            </>
        }
        {
            providerState !== 'pending' && <>
                {!!provider && <>
                    {
                        accessState === 'pending' && <>
                            Accessing Ethereum...<br/>
                            (You may need to allow in your provider.)
                        </>
                    }
                    {
                        accessState === 'rejected' && <>
                            Rejected Ethereum access!<br/>
                            <Button onClick={() => setAccessTry(accessTry + 1)}>Try again</Button>
                        </>
                    }
                    {
                        accessState === 'resolved' && <WithProvider provider={new ethers.providers.Web3Provider(provider as any)} />
                    }
                </>}
                {!!provider || <>
                    No Ethereum provider found. <br />
                    Install one, Metamask is suggested. <br />
                    <Button onClick={() => setProviderTry(providerTry + 1)}>Try again</Button>
                </>}
            </>
        }
    </>
}

export function WithProvider(
    {
        provider
    }: {
        provider: ethers.providers.Web3Provider
    }
) {
    const [addresses] = usePromise(
        () => provider.listAccounts(),
        [provider]
    )
    const [selectedAddress, setAddress] = useState<string>();
    const address = selectedAddress ?? addresses?.[0]
    const signer = useMemo(
        () => (address != null) ? provider.getSigner(address) : undefined,
        [provider, address]
    )
    const wallet = useMemo(
        () => (address != null) && (signer != null) ? new Wallet(signer, address) : undefined,
        [signer, address]
    )
    const client = useMemo(
        () => new BaseClient(provider),
        [provider]
    )
    return <Router>
        {addresses && addresses.length > 0 && <Select value={address} onChange={e => setAddress(e.target.value as string)}>{
            addresses.map(
                address => <MenuItem key={address} value={address}>
                    {address}
                </MenuItem>
            )
        }</Select>}
        <BaseClientProvider client={client}>
            <WalletProvider wallet={wallet}>
                <Switch>
                    <Route path="/exchangers/:exchangerAddress">
                        <ExchangerPage />
                    </Route>
                    <Route path="/order-books/:orderBookAddress">
                        <OrderBookPage />
                    </Route>
                </Switch>
            </WalletProvider>
        </BaseClientProvider>
    </Router>
}

