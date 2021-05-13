import React, {useMemo, useState} from "react";
import {
    HashRouter as Router,
    Switch,
    Route,
    Redirect,
    Link,
    useRouteMatch,
    useHistory
} from "react-router-dom";
import {BaseClientProvider} from "./base-client-provider";
import {BaseClient} from "../client/base-client";
import {ethers} from "ethers";
import {ExchangerPage} from "./exchanger-page";
import {Wallet} from "../client/wallet";
import {WalletProvider} from "./wallet-provider";
import detectEthereumProvider from "@metamask/detect-provider";
import {
    AppBar,
    Box,
    Button, createMuiTheme,
    Divider,
    Icon,
    IconButton,
    MenuItem,
    Select,
    ThemeProvider,
    Toolbar,
    Typography,
    useTheme
} from "@material-ui/core";
import {Currency} from "../client/currency";
import ETH from "../eth.json";
import {ArrowBack} from "@material-ui/icons"
import {amber, blue, pink} from "@material-ui/core/colors";
import {useLoggedPromise} from "./logger-hooks";

export function App() {
    const [providerTry, setProviderTry] = useState(0);
    const [accessTry, setAccessTry] = useState(0);
    const [provider, , providerState] = useLoggedPromise(() => detectEthereumProvider(), [providerTry]);
    const [ , , accessState] = useLoggedPromise(
        async () => (provider != null) && (provider as any).request({ method: 'eth_requestAccounts' }),
        [provider, accessTry]
    );

    return <Router>
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
    </Router>
}

export function WithProvider(
    {
        provider
    }: {
        provider: ethers.providers.Web3Provider
    }
) {
    const currency: Currency = ETH;
    const [addresses] = useLoggedPromise(
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

    const theme = useMemo(
        () => createMuiTheme({
            palette: {
                primary: blue,
                secondary: pink
            },
        }),
        []
    )

    const homeMatch = useRouteMatch({
        path: ["/", "/:exchangerAddress"],
        exact: true
    });
    const history = useHistory()

    return <ThemeProvider theme={theme}>
        <AppBar position="static">
            <Toolbar variant="dense">
                {
                    <IconButton disabled={!!homeMatch} onClick={() => history.goBack()} edge="start" color="inherit">
                        <ArrowBack />
                    </IconButton>
                }
                <Box flexGrow={1} />
                <Typography variant="h6">Simple Exchanger</Typography>
                <Box flexGrow={1} />
                {
                    addresses && addresses.length > 0 &&
                    <Select value={address}
                            style={{color: "white"}}
                            onChange={e => setAddress(e.target.value as string)}>{
                        addresses.map(
                            address => <MenuItem key={address} value={address}>
                                {address}
                            </MenuItem>
                        )
                    }</Select>
                }
            </Toolbar>
        </AppBar>
        <Box p={4}>
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
        </Box>
    </ThemeProvider>
}

