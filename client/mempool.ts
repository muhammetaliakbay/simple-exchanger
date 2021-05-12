import {concat, defer, merge, Observable, of, Subject} from "rxjs";
import {BigNumber, ethers, Transaction} from "ethers";
import {Provider, TransactionResponse, TransactionReceipt} from "@ethersproject/abstract-provider";
import {distinct, filter, first, ignoreElements, map, mergeMap, pluck, scan, share, skipWhile} from "rxjs/operators";
import {Network} from "@ethersproject/networks";
import {fromArray} from "rxjs/internal/observable/fromArray";

export enum TransactionState {
    Pending = 'pending',
    Reverted = 'reverted',
    Mined = 'mined'
}

export interface StoredTransaction {
    hash: string;

    to: string;
    from: string;
    nonce: number;

    data: string;
    chainId: number;

    value: BigNumber;
    gasPrice: BigNumber,
    gasLimit: BigNumber,

    state: TransactionState
}

export interface TransactionIdentifier {
    chainId: number,
    hash: string
}

function equals(a: TransactionIdentifier, b: StoredTransaction): boolean {
    return a.chainId === b.chainId && a.hash === b.hash;
}

function isTxHash(hash: string): boolean {
    return ethers.utils.isHexString(hash, 32);
}

function isValidState(state: string): state is TransactionState {
    return state === TransactionState.Mined || state === TransactionState.Reverted || state === TransactionState.Pending;
}

function isValidTx(tx: any): tx is StoredTransaction {
    return (
        typeof tx === 'object' &&
        typeof tx.hash === 'string' && isTxHash(tx.hash) &&
        typeof tx.to === 'string' && ethers.utils.isAddress(tx.to) &&
        typeof tx.from === 'string' && ethers.utils.isAddress(tx.from) &&
        typeof tx.nonce === 'number' && tx.nonce >= 0 &&
        typeof tx.chainId === 'number' && tx.chainId > 0 &&
        typeof tx.data === 'string' && ethers.utils.isHexString(tx.data) &&
        typeof tx.state === 'string' && isValidState(tx.state) &&
        tx.value instanceof BigNumber &&
        tx.gasPrice instanceof BigNumber &&
        tx.gasLimit instanceof BigNumber
    )
}

function parseTx(serialized: string): StoredTransaction | false {
    try {
        const tx = JSON.parse(serialized);
        tx.value = BigNumber.from(tx.value);
        tx.gasPrice = BigNumber.from(tx.gasPrice);
        tx.gasLimit = BigNumber.from(tx.gasLimit);
        return isValidTx(tx) && tx;
    } catch (e) {
        return false;
    }
}

function serializeTx(tx: StoredTransaction) {
    return JSON.stringify({
        ...tx,
        value: tx.value.toHexString(),
        gasPrice: tx.gasPrice.toHexString(),
        gasLimit: tx.gasLimit.toHexString(),
    })
}

function localStoragePrefix(memPool: MemPool) {
    return 'mp_' + memPool.id + '_'
}
function loadLocalStorage(memPool: MemPool): StoredTransaction[] {
    const prefix = localStoragePrefix(memPool);

    const entries: StoredTransaction[] = [];
    for (let index = 0; index < localStorage.length; index ++) {
        const key = localStorage.key(index)
        if (key != null) {
            if (key.startsWith(prefix)) {
                const item = localStorage.getItem(key);
                if (item != null) {
                    const entry = parseTx(item);
                    if (
                        entry &&
                        localStorageKey(memPool, entry) === key
                    ) {
                        entries.push(entry)
                    }
                }
            }
        }
    }

    return entries
}
function localStorageKey(memPool: MemPool, tx: StoredTransaction) {
    return localStoragePrefix(memPool) + `${tx.chainId}_${tx.hash}`
}
function storeLocalStorage(memPool: MemPool, tx: StoredTransaction) {
    const key = localStorageKey(memPool, tx)
    localStorage.setItem(key, serializeTx(tx))
}
function removeLocalStorage(memPool: MemPool, entry: StoredTransaction) {
    const key = localStorageKey(memPool, entry)
    localStorage.removeItem(key)
}

type Cleaner = () => void;
type MemPoolSource = (memPool: MemPool, source: number) => Cleaner;

function localStorageSource(memPool: MemPool, source: number): Cleaner {
    const subscription = memPool.entry$.subscribe(
        entry => {
            if (entry.source !== source) {
                if (entry.state === TransactionState.Pending) {
                    storeLocalStorage(memPool, entry)
                } else {
                    removeLocalStorage(memPool, entry)
                }
            }
        }
    );
    const entries = loadLocalStorage(memPool);
    for (const entry of entries) {
        memPool.putFromSource(source, entry)
    }

    return () => subscription.unsubscribe()
}

function broadcastChannelName(memPool: MemPool) {
    return 'mp_' + memPool.id
}
function broadcastChannelSource(memPool: MemPool, source: number): Cleaner {
    const broadcastChannel = new BroadcastChannel(broadcastChannelName(memPool))

    const listener = (ev: MessageEvent) => {
        if (
            ev.data === 'new'
        ) {
            for (const entry of memPool.getPool()) {
                broadcastChannel.postMessage(serializeTx(entry))
            }
        } else if (
            typeof ev.data === 'string'
        ) {
            const entry = parseTx(ev.data);
            if (entry) {
                memPool.putFromSource(source, entry)
            }
        }
    }
    broadcastChannel.onmessage = listener;
    broadcastChannel.postMessage("new")

    const subscribe = memPool.entry$.subscribe(
        entry => {
            if (entry.source !== source) {
                broadcastChannel.postMessage(
                    JSON.stringify(entry)
                )
            }
        }
    )

    return () => {
        broadcastChannel.close();
        subscribe.unsubscribe();
    }
}

function providerSource(provider: Provider): MemPoolSource {
    return (memPool: MemPool, source: number): Cleaner => {
        const listener = (tx: string) => {
            console.log("received pending TX from provider", tx);
            //TODO: Implemented the logic
        };
        provider.on('pending', listener);

        return () => {
            provider.off('pending', listener);
        }
    }
}

export interface TransactionWithSource extends StoredTransaction {
    source: number
}

export const NULL_ADDRESS = '0x' + ('00'.repeat(20))

export class MemPool {
    static start(id: number, provider: Provider): MemPool {
        return new MemPool(
            id,
            provider,

            ...(
                typeof window === 'undefined' ? [] : [
                    localStorageSource,
                    broadcastChannelSource,
                ]
            ),
            providerSource(provider)
        );
    }

    private pool: StoredTransaction[] = [];
    getPool(): StoredTransaction[] {
        return this.pool.slice()
    }

    private entrySubject = new Subject<TransactionWithSource>();
    readonly entry$: Observable<TransactionWithSource> = this.entrySubject.asObservable();
    readonly pending$: Observable<Transaction> = this.entry$.pipe(
        filter(tx => tx.state === TransactionState.Pending),
        share()
    );
    readonly finalized$: Observable<Transaction> = this.entry$.pipe(
        filter(tx => tx.state === TransactionState.Mined || tx.state === TransactionState.Reverted),
        share()
    );

    getState(identifier: TransactionIdentifier): undefined | TransactionState {
        return this.pool.find(equals.bind(undefined, identifier))?.state
    }

    private listener = async (tx?: TransactionReceipt) => {
        if (tx != undefined) {
            const {chainId} = await this.network$;
            if (chainId != undefined) {
                this.putReceipt(chainId, tx)
            }
        }
    }
    private listen(identifier: TransactionIdentifier): Observable<never> {
        return concat(
            defer(
                () => this.provider.getTransactionReceipt(
                    identifier.hash
                ).then(
                    tx => this.listener(tx)
                )
            ),
            new Observable<never>(
                () => {
                    this.provider.once(identifier.hash, this.listener)
                    return () => this.provider.off(identifier.hash, this.listener)
                }
            )
        ).pipe(ignoreElements());
    }

    transactions(predicate: (tx: StoredTransaction) => boolean): Observable<StoredTransaction> {
        return merge(
            fromArray(this.pool),
            this.entry$
        ).pipe(
            filter(predicate),
            distinct(
                (tx) => tx.chainId + '/' + tx.hash
            )
        )
    }

    watch(predicate: (tx: StoredTransaction) => boolean): Observable<StoredTransaction[]> {
        return this.transactions(predicate).pipe(
            mergeMap(
                tx => this.watchByIdentifier(tx).pipe(
                    filter(state => state != undefined),
                    map(
                        state => ({
                            ...tx,
                            state: state!
                        })
                    )
                )
            ),
            scan(
                (acc, tx) => {
                    acc = acc.slice()
                    const index = acc.findIndex(equals.bind(undefined, tx))
                    if (index > -1) {
                        acc[index] = tx;
                    } else {
                        acc.push(tx);
                    }
                    return acc;
                },
                [] as StoredTransaction[]
            )
        )
    }

    watchByIdentifier(identifier: TransactionIdentifier): Observable<undefined | TransactionState> {
        return defer(
            () => {
                const state = this.getState(identifier);
                if (state == undefined) {
                    return of(undefined)
                } else if (state === TransactionState.Pending) {
                    return concat(
                        of(state),
                        merge(
                            this.entry$,
                            this.listen(identifier)
                        ).pipe(
                            filter(equals.bind(undefined, identifier)),
                            pluck('state'),
                            skipWhile(
                                currentState => currentState === state
                            ),
                            first()
                        )
                    )
                } else {
                    return of(state);
                }
            }
        )
    }

    private cleaners: Cleaner[] = [];
    private network$: Promise<Network>;
    private constructor(
        readonly id: number,
        readonly provider: Provider,
        ...sources: MemPoolSource[]
    ) {
        this.network$ = provider.getNetwork();
        let sourceId = 1;
        for (const source of sources) {
            const cleaner = source(this, sourceId);
            this.cleaners.push(cleaner)
            sourceId ++;
        }
    }
    stop() {
        for (const cleaner of this.cleaners) {
            cleaner()
        }
    }
    putResponse(tx: TransactionResponse, state: TransactionState = TransactionState.Pending): TransactionResponse {
        this.putFromSource(0, {
            hash: tx.hash,
            chainId: tx.chainId,
            data: tx.data,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            to: tx.to ?? NULL_ADDRESS,
            from: tx.from,
            nonce: tx.nonce,
            value: tx.value,
            state
        });
        return tx;
    }
    putReceipt(chainId: number, tx: TransactionReceipt): TransactionReceipt {
        const status = tx.status;

        if (status != undefined) {
            const state = status ? TransactionState.Mined : TransactionState.Reverted;

            const entry = this.pool.find(equals.bind(undefined, {
                chainId: chainId,
                hash: tx.transactionHash
            }));

            if (entry == undefined) {
                this.network$.then(
                    async ({chainId: networkChainId}) => {
                        if (chainId === networkChainId) {
                            const txResponse = await this.provider.getTransaction(tx.transactionHash)
                            this.putResponse(
                                txResponse,
                                state
                            )
                        }
                    }
                )
            } else {
                entry.state = state;
                this.entrySubject.next({
                    ...entry,
                    source: 0
                });
            }
        }

        return tx;
    }
    putFromSource(source: number, tx: StoredTransaction) {
        const index = this.pool.findIndex(equals.bind(undefined, tx))
        if (index === -1) {
            const newEntry: StoredTransaction = {
                ...tx,
            };
            this.pool.push(newEntry)
            this.entrySubject.next({
                ...newEntry,
                source
            })
        } else {
            const entry = this.pool[index];
            if (
                entry.state === TransactionState.Pending &&
                (
                    tx.state === TransactionState.Reverted ||
                    tx.state === TransactionState.Mined
                )
            ) {
                entry.state = tx.state;
                this.entrySubject.next({
                    ...entry,
                    source
                });
            }
        }
    }
}
