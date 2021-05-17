import React, {useEffect, useMemo, useState} from "react";
import {HashRouter as Router, Redirect, Route, Switch} from "react-router-dom";
import {BaseClientProvider} from "./base-client-provider";
import {BaseClient} from "../client/base-client";
import {ExchangerPage} from "./exchanger-page";
import {AccountProvider} from "./account-provider";
import {
    AppBar,
    Box,
    createMuiTheme,
    ThemeProvider,
    Toolbar,
    Typography,
} from "@material-ui/core";
import ETH from "../eth.json";
import {blue, pink} from "@material-ui/core/colors";
import {useLoggedObservable} from "./logger-hooks";
import {AccountSelect} from "./account-select";
import {ConnectionSourceManager, Account} from "../client/providers";
import {MetamaskSource} from "../client/providers/metamask";
import {WalletConnectSource} from "../client/providers/wallet-connect";
import WalletConnect from "@walletconnect/browser";
import QRCodeModal from "@walletconnect/qrcode-modal";
import {InfuraSource} from "../client/providers/infura";
import {MemPool} from "../client/mempool";
import {ProviderPool} from "../client/mempool/provider";
import {LocalStoragePool} from "../client/mempool/local-storage";
import {BroadcastChannelPool} from "../client/mempool/broadcast-channel";
import {BackButton} from "./back-button";

export function App() {
    const manager = useMemo(
        () => new ConnectionSourceManager(
            new MetamaskSource(
                "metamask"
            ),
            new WalletConnectSource(
                "wallet-connect",
                new WalletConnect({
                    bridge: 'https://bridge.walletconnect.org',
                    qrcodeModal: QRCodeModal
                })
            ),
            new InfuraSource(
                "infura",
                "08dc529f20ef46a1a543bd6a9a427de9",
                3
            )
        ),
        []
    )

    const currency = useMemo(
        () => ETH,
        []
    )

    const preferredChainId = useMemo(
        () => 3,
        []
    )

    useEffect(
        () => {
            manager.setPreferredChainId(preferredChainId)
        },
        [manager, preferredChainId]
    )

    const [providers] = useLoggedObservable(
        () => manager.providers$,
        [manager]
    );
    const provider = providers?.[0];

    const [wallets] = useLoggedObservable(
        () => manager.wallets$,
        [manager]
    )

    const memPool = useMemo(
        () => new MemPool(0),
        []
    )
    window["wallets"] = wallets
    window["mp"] = memPool
    useEffect(
        () => {
            if (LocalStoragePool.available) {
                memPool.registerSource(
                    new LocalStoragePool()
                )
            }
            if (BroadcastChannelPool.available) {
                memPool.registerSource(
                    new BroadcastChannelPool()
                )
            }
        },
        [memPool]
    )

    useEffect(
        () => {
            if (provider != undefined) {
                const pool = new ProviderPool(provider)
                memPool.registerSource(pool)
                return () => memPool.unregisterSource(pool)
            }
        },
        [memPool, provider]
    )

    const client = useMemo(
        () => provider && new BaseClient(
            memPool,
            provider,
            currency
        ),
        [memPool, provider, currency]
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

    const [account, setAccount] = useState<Account>()

    return <Router>
        <ThemeProvider theme={theme}>
            <AppBar position="static">
                <Toolbar>
                    <BackButton />
                    <Typography variant="h6">Simple Exchanger</Typography>
                    <Typography variant="subtitle1"><>
                        &nbsp;|&nbsp;
                        {provider == undefined && "No provider connected!"}
                        {provider == undefined || `Chain ID: ${provider.chainId}`}
                    </></Typography>
                    <Box flexGrow={1} />
                    {wallets && <AccountSelect wallets={wallets} setAccount={setAccount} />}
                </Toolbar>
            </AppBar>
            <AccountProvider account={account}>
                {client && <BaseClientProvider client={client}>
                    <AccountProvider account={account}>
                        <Switch>
                            <Route exact path={["/", ""]} render={() => <Redirect to="/official.simple-exchanger.eth" />} />
                            <Route path="/:exchangerAddress">
                                <ExchangerPage />
                            </Route>
                        </Switch>
                    </AccountProvider>
                </BaseClientProvider>}
            </AccountProvider>
        </ThemeProvider>
    </Router>
}
