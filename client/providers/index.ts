import {merge, Observable, ReplaySubject} from "rxjs";
import {distinctUntilChanged, map, scan, switchMap} from "rxjs/operators";
import {ReactiveProvider} from "../reactive-provider";
import {BigNumber} from "ethers";

export enum AddressAccess {
    NotAvailable = 'not-available',
    NeedRequest = 'need-request',
    Requesting = 'requesting',
    Available = 'available'
}

export interface UnsignedTransaction {
    to: string;
    nonce?: number;

    gasLimit?: BigNumber;
    gasPrice?: BigNumber;

    data?: string;
    value?: BigNumber;

    chainId: number;
}
export interface SentTransaction {
    hash: string;
    chainId: number;

    from: string;
    to: string;
    nonce?: number;

    gasLimit?: BigNumber;
    gasPrice?: BigNumber;

    data: string;
    value: BigNumber;
}

export interface Account {
    readonly address: string
    sendTransaction(unsigned: UnsignedTransaction): Promise<SentTransaction>
}

export interface WalletInfo {
    name: string,
    title: string
}

export type Wallet = {
    access: AddressAccess.Available,
    accounts: Account[],
    disconnect?(): Promise<void>
    manage?(): Promise<void>
} | {
    access: AddressAccess.NotAvailable
} | {
    access: AddressAccess.NeedRequest,
    request(): Promise<void>
} | {
    access: AddressAccess.Requesting
}

export type WalletWithInfo = Wallet & WalletInfo;

export interface ConnectionSource {
    readonly walletInfo: WalletInfo
    lookupProvider(preferredChainId?: number): Observable<ReactiveProvider | undefined>
    lookupWallet(): Observable<Wallet>
}

export class ConnectionSourceManager {
    private sources: ConnectionSource[]
    private preferredChainId$ = new ReplaySubject<number | undefined>(1)

    readonly providers$: Observable<ReactiveProvider[]>;
    readonly wallets$: Observable<WalletWithInfo[]>;

    constructor(
        ...sources: ConnectionSource[]
    ) {
        this.sources = sources

        this.providers$ = merge(
            ...sources.map(
                (source, index) => this.preferredChainId$.pipe(
                    switchMap(
                        preferredChainId => source.lookupProvider(preferredChainId)
                    ),
                    distinctUntilChanged(),
                    map(
                        provider => ({
                            index,
                            provider
                        })
                    )
                )
            )
        ).pipe(
            scan(
                (acc, {index, provider}) => {
                    const copy = [...acc]
                    copy[index] = provider
                    return copy
                },
                [] as Array<ReactiveProvider | undefined>
            ),
            map(
                arr => arr.filter(
                    provider => provider != undefined
                ) as ReactiveProvider[]
            )
        );

        this.wallets$ = merge(
            ...sources.map(
                (source, index) => source.lookupWallet().pipe(
                    map(
                        wallet => ({
                            index,
                            wallet,
                            info: source.walletInfo
                        })
                    )
                )
            )
        ).pipe(
            scan(
                (acc, {index, wallet, info}) => {
                    const copy = [...acc]
                    copy[index] = {
                        ...wallet,
                        ...info
                    }
                    return copy
                },
                [] as Array<WalletWithInfo>
            ),
            map(
                arr => arr.filter(
                    provider => provider != undefined
                ) as WalletWithInfo[]
            )
        );
    }

    setPreferredChainId(chainId: number | undefined) {
        this.preferredChainId$.next(chainId)
    }
}
