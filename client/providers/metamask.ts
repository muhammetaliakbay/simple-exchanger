import {
    AddressAccess,
    Wallet,
    ConnectionSource,
    Account,
    UnsignedTransaction,
    SentTransaction,
    WalletInfo
} from "./index";
import {BehaviorSubject, combineLatest, concat, defer, merge, Observable, of} from "rxjs";
import {distinctUntilChanged, map, shareReplay, switchMap} from "rxjs/operators";
import {BigNumber, BigNumberish, ethers} from "ethers";
import {ReactiveProvider} from "../reactive-provider";

interface Ethereum {
    request<T>(data: {
        method: string,
        params?: any[]
    }): Promise<T>
    on(event: string, handler: Function);
    removeEventListener(event: string, handler: Function);
}

class ReactiveEthereum {
    constructor(
        readonly id,
        readonly ethereum: Ethereum
    ) {}

    readonly chainId$ = concat(
        defer(
            () => this.ethereum.request<string>({ method: 'eth_chainId' })
        ),
        new Observable<string>(
            subscriber => {
                const listener = (chainId: string) => {
                    subscriber.next(chainId)
                }
                this.ethereum.on('chainChanged', listener)
                return () => this.ethereum.removeEventListener('chainChanged', listener)
            }
        )
    ).pipe(
        map(
            chainId => BigNumber.from(chainId).toNumber()
        ),
        distinctUntilChanged(),
        shareReplay(1)
    )

    readonly reactiveProvider$ = this.chainId$.pipe(
        map(
            chainId => new ReactiveProvider(
                this.id,
                new ethers.providers.Web3Provider(
                    this.ethereum
                ),
                chainId
            )
        )
    )

    readonly addresses$ = concat(
        defer(
            () => this.ethereum.request<string[]>({ method: 'eth_accounts' })
        ),
        new Observable<string[]>(
            subscriber => {
                const listener = (accounts: string[]) => {
                    subscriber.next(accounts)
                }
                this.ethereum.on('accountsChanged', listener)
                return () => this.ethereum.removeEventListener('accountsChanged', listener)
            }
        )
    ).pipe(
        distinctUntilChanged(
            (a, b) => JSON.stringify(a) === JSON.stringify(b)
        ),
        shareReplay(1)
    )

    private requestingSubject = new BehaviorSubject<Promise<void> | null>(null)
    request(): Promise<void> {
        if (this.requestingSubject.value == null) {
            const request = this.ethereum.request<void>({method: 'eth_requestAccounts'});
            this.requestingSubject.next(request);
            request.finally(
                () => this.requestingSubject.next(null)
            )
            return request;
        } else {
            return this.requestingSubject.value;
        }
    }
    readonly requesting$: Observable<boolean> = this.requestingSubject.pipe(
        map(requesting => requesting != null)
    )

    manage(): Promise<void> {
        return this.ethereum.request({
            method: "wallet_requestPermissions",
            params: [
                {
                    eth_accounts: {}
                }
            ]
        })
    }
}

declare global {
    interface Window {
        ethereum?: Ethereum
    }
}

class MetamaskAccount implements Account {
    constructor(
        readonly reactiveEthereum: ReactiveEthereum,
        readonly address: string
    ) {
    }
    async sendTransaction(unsigned: UnsignedTransaction): Promise<SentTransaction> {
        const hash = await this.reactiveEthereum.ethereum.request<string>({
            method: 'eth_sendTransaction',
            params: [{
                from: this.address,
                to: unsigned.to,
                gas: unsigned.gasLimit?.toHexString(),
                gasPrice: unsigned.gasPrice?.toHexString(),
                value: unsigned.value?.toHexString(),
                data: unsigned.data,
                nonce: unsigned.nonce
            }]
        })
        const tx = await this.reactiveEthereum.ethereum.request<{
            blockHash: string | null,
            blockNumber: number | null,
            from: string,
            gas: BigNumberish,
            gasPrice: BigNumberish,
            hash: string,
            input: string,
            nonce: BigNumberish,
            to: string,
            transactionIndex: number | null,
            value: BigNumberish,
            v: BigNumberish,
            r: string,
            s: string

        }>({
            method: 'eth_getTransactionByHash',
            params: [hash]
        })
        return {
            to: tx.to,
            data: tx.input,
            gasLimit: BigNumber.from(tx.gas),
            gasPrice: BigNumber.from(tx.gasPrice),
            nonce: BigNumber.from(tx.nonce).toNumber(),
            value: BigNumber.from(tx.value),
            hash: tx.hash,
            from: this.address,
            chainId: unsigned.chainId
        } as SentTransaction
    }
}

export class MetamaskSource implements ConnectionSource{
    constructor(
        readonly id: string
    ) {
    }

    readonly walletInfo: WalletInfo = {
        title: 'Metamask',
        name: 'metamask'
    }


    static ethereum$ = merge(
        defer(() => of(window.ethereum)),
        new Observable<Ethereum>(
            subscriber => {
                const listener = () => {
                    subscriber.next(window.ethereum)
                };
                window.addEventListener('ethereum#initialized', listener);
                return () => window.removeEventListener('ethereum#initialized', listener)
            }
        )
    ).pipe(
        distinctUntilChanged(),
        shareReplay(1)
    )

    reactiveEthereum$ = MetamaskSource.ethereum$.pipe(
        map(
            ethereum => ethereum == undefined ?
                undefined :
                new ReactiveEthereum(
                    this.id,
                    ethereum
                )
        ),
        shareReplay(1)
    )

    lookupProvider(): Observable<ReactiveProvider | undefined> {
        return this.reactiveEthereum$.pipe(
            switchMap(
                re => {
                    if (re == undefined) {
                        return of(undefined)
                    } else {
                        return re.reactiveProvider$
                    }
                }
            )
        )
    }

    lookupWallet(): Observable<Wallet> {
        return this.reactiveEthereum$.pipe(
            switchMap(
                re => {
                    if (re == undefined) {
                        return of({
                            access: AddressAccess.NotAvailable as const
                        })
                    } else {
                        return combineLatest([
                            re.addresses$,
                            re.requesting$
                        ]).pipe(
                            map(
                                ([addresses, requesting]) => {
                                    if (requesting) {
                                        return ({
                                            access: AddressAccess.Requesting as const
                                        })
                                    } else if (addresses.length == 0) {
                                        return ({
                                            access: AddressAccess.NeedRequest as const,
                                            request: () => re.request()
                                        })
                                    } else {
                                        return ({
                                            access: AddressAccess.Available as const,
                                            accounts: addresses.map(
                                                address => new MetamaskAccount(
                                                    re, address
                                                )
                                            ),
                                            manage: () => re.manage()
                                        })
                                    }
                                }
                            )
                        );
                    }
                }
            )
        )
    }
}
