import React, {useMemo, useState} from "react";
import {
    HashRouter as Router,
    Switch,
    Route,
    Redirect
} from "react-router-dom";
import {BaseClientProvider} from "./base-client-provider";
import {BaseClient} from "../client/base-client";
import {ethers} from "ethers";
import {ExchangerPage} from "./exchanger-page";
import {Wallet} from "../client/wallet";
import {WalletProvider} from "./wallet-provider";
import usePromise from "react-use-promise";
import detectEthereumProvider from "@metamask/detect-provider";
import {AppBar, Box, Button, Divider, MenuItem, Select, Toolbar, Typography} from "@material-ui/core";
import {Currency} from "../client/currency";
import ETH from "../eth.json";

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
            providerState === 'pending' && <Box m={4}>
                Looking for Ethereum provider...
                <Divider />
                Please wait...
            </Box>
        }
        {
            providerState !== 'pending' && <>
                {!!provider && <>
                    {
                        accessState === 'pending' && <Box m={4}>
                            Accessing Ethereum...
                            <Divider />
                            (You may need to allow in your provider.)
                        </Box>
                    }
                    {
                        accessState === 'rejected' && <Box m={4}>
                            Rejected Ethereum access!
                            <Divider />
                            <Button onClick={() => setAccessTry(accessTry + 1)}>Try again</Button>
                        </Box>
                    }
                    {
                        accessState === 'resolved' && <WithProvider provider={new ethers.providers.Web3Provider(provider as any)} />
                    }
                </>}
                {!!provider || <Box m={4}>
                    No Ethereum provider found. <br />
                    Install one, Metamask is suggested.
                    <Divider />
                    <Button onClick={() => setProviderTry(providerTry + 1)}>Try again</Button>
                </Box>}
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
    const currency: Currency = ETH;
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
        () => new BaseClient(provider, currency),
        [provider]
    )
    return <>
        <AppBar position="static">
            <Toolbar variant="dense">
                <Typography>Simple Exchanger</Typography>
                <Box flexGrow={1} />
                {
                    addresses && addresses.length > 0 &&
                    <Select value={address}
                            onChange={e => setAddress(e.target.value as string)}
                            style={{color: "white"}}>{
                        addresses.map(
                            address => <MenuItem color="inherit" key={address} value={address}>
                                {address}
                            </MenuItem>
                        )
                    }</Select>
                }
            </Toolbar>
        </AppBar>
        <Box p={4}>
            <Router>
                <BaseClientProvider client={client}>
                    <WalletProvider wallet={wallet}>
                        <Switch>
                            <Route exact path={["/", ""]} render={() => <Redirect to="/official.simple-exchanger.eth" />} />
                            <Route path="/:exchangerAddress">
                                <ExchangerPage />
                            </Route>
                        </Switch>
                    </WalletProvider>
                </BaseClientProvider>
            </Router>
        </Box>
    </>
}

