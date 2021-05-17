import {
    Account,
    AddressAccess,
    ConnectionSource,
    SentTransaction,
    UnsignedTransaction,
    Wallet,
    WalletInfo
} from "./index";
import {BehaviorSubject, combineLatest, concat, merge, Observable, of, Subject} from "rxjs";
import WalletConnect from "@walletconnect/core";
import {distinctUntilChanged, map, mapTo, shareReplay, switchMap} from "rxjs/operators";
import {BigNumber} from "ethers";

class WalletConnectAccount implements Account {
    constructor(
        readonly connector: WalletConnect,
        readonly address: string
    ) {
    }

    async sendTransaction(unsigned: UnsignedTransaction): Promise<SentTransaction> {
        const data = unsigned.data ?? '';
        const value = unsigned.value ?? BigNumber.from(0)
        const hash: string = await this.connector.sendTransaction({
            from: this.address,
            to: unsigned.to,
            gas: unsigned.gasLimit?.toHexString(),
            gasPrice: unsigned.gasPrice?.toHexString(),
            value: unsigned.value?.toHexString(),
            data: unsigned.data,
            nonce: unsigned.nonce
        })
        return {
            hash,
            to: unsigned.to,
            data,
            value,
            from: this.address,
            chainId: unsigned.chainId
        } as SentTransaction
    }
}

export class WalletConnectSource implements ConnectionSource{
    private onConnect = new Subject<void>()
    private onDisconnect = new Subject<void>()
    private onSessionUpdate = new Subject<void>()

    constructor(
        readonly id,
        readonly connector: WalletConnect
    ) {
        // Using persistent subjects, because there is no off/removeEventListener features in WalletConnect
        connector.on('connect', () => this.onConnect.next())
        connector.on('disconnect', () => this.onDisconnect.next())
        connector.on('session_update', () => this.onSessionUpdate.next())
    }

    readonly walletInfo: WalletInfo = {
        title: 'WalletConnect',
        name: 'walletconnect'
    }

    readonly connected$: Observable<boolean> = concat(
        of(this.connector.connected),
        merge(
            this.onConnect.pipe(mapTo(true)),
            this.onDisconnect.pipe(mapTo(false)),
        ),
        distinctUntilChanged(),
        shareReplay(1)
    )
    readonly connectedSession$: Observable<{
        accounts: string[],
        chainId: number
    } | undefined> = this.connected$.pipe(
        switchMap(
            connected => connected ?
                concat(
                    of(void 0),
                    this.onSessionUpdate
                ).pipe(
                    map(
                        () => ({
                            accounts: this.connector.accounts,
                            chainId: this.connector.chainId
                        })
                    )
                ) :
                of(undefined)
        ),
        shareReplay(1)
    )

    private connectingSubject = new BehaviorSubject<Promise<void> | null>(null)
    connect(): Promise<void> {
        if (this.connectingSubject.value == null) {
            const connect = this.connector.createSession();
            this.connectingSubject.next(connect);
            connect.finally(
                () => this.connectingSubject.next(null)
            )
            return connect;
        } else {
            return this.connectingSubject.value;
        }
    }
    readonly connecting$: Observable<boolean> = this.connectingSubject.pipe(
        map(requesting => requesting != null)
    )

    disconnect(): Promise<void> {
        return this.connector.killSession();
    }

    lookupProvider(): Observable<undefined> {
        return of(undefined)
    }

    lookupWallet(): Observable<Wallet> {
        return combineLatest([
            this.connectedSession$,
            this.connecting$,
        ]).pipe(
            map(
                ([connectedSession, connecting]) => {
                    if (connecting) {
                        return ({
                            access: AddressAccess.Requesting as const
                        })
                    } else {
                        if (connectedSession == undefined) {
                            return {
                                access: AddressAccess.NeedRequest,
                                request: () => this.connect()
                            }
                        } else {
                            return {
                                access: AddressAccess.Available,
                                accounts: connectedSession.accounts.map(
                                    address => new WalletConnectAccount(
                                        this.connector, address
                                    )
                                ),
                                disconnect: () => this.disconnect()
                            }
                        }
                    }
                }
            )
        );
    }
}
