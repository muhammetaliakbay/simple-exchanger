import {concat, defer, EMPTY, merge, Observable, of, ReplaySubject, Subject} from "rxjs";
import {BigNumber, ethers} from "ethers";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import {
    distinct,
    filter,
    first,
    ignoreElements,
    map,
    mergeMap,
    pluck,
    scan,
    share,
    skipWhile,
    takeUntil, tap
} from "rxjs/operators";
import {fromArray} from "rxjs/internal/observable/fromArray";
import {SentTransaction} from "../providers";
import {addressNormalize} from "../address-util";

export enum TransactionState {
    Pending = 'pending',
    Reverted = 'reverted',
    Mined = 'mined'
}

export interface StoredTransaction {
    hash: string;

    to: string;
    from: string;
    nonce?: number;

    data: string;
    chainId: number;

    value: BigNumber;
    gasPrice?: BigNumber,
    gasLimit?: BigNumber,

    state: TransactionState
}

export interface TransactionIdentifier {
    chainId: number,
    hash: string
}

function equals(a: TransactionIdentifier, b: StoredTransaction): boolean {
    return a.chainId === b.chainId && a.hash.toLowerCase() === b.hash.toLowerCase();
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
        (tx.nonce === undefined || (typeof tx.nonce === 'number' && tx.nonce >= 0)) &&
        typeof tx.chainId === 'number' && tx.chainId > 0 &&
        typeof tx.data === 'string' && ethers.utils.isHexString(tx.data) &&
        typeof tx.state === 'string' && isValidState(tx.state) &&
        tx.value instanceof BigNumber &&
        (tx.gasPrice === undefined || tx.gasPrice instanceof BigNumber) &&
        (tx.gasLimit === undefined || tx.gasLimit instanceof BigNumber)
    )
}

export function parseTx(serialized: string): StoredTransaction | false {
    try {
        const tx = JSON.parse(serialized);
        tx.to = addressNormalize(tx.to);
        tx.from = addressNormalize(tx.from);
        tx.value = BigNumber.from(tx.value);
        tx.gasPrice = tx.gasPrice != undefined ? BigNumber.from(tx.gasPrice) : undefined;
        tx.gasLimit = tx.gasLimit != undefined ? BigNumber.from(tx.gasLimit) : undefined;
        return isValidTx(tx) && tx;
    } catch (e) {
        return false;
    }
}

export function serializeTx(tx: StoredTransaction) {
    return JSON.stringify({
        ...tx,
        to: addressNormalize(tx.to),
        from: addressNormalize(tx.from),
        value: tx.value.toHexString(),
        gasPrice: tx.gasPrice?.toHexString(),
        gasLimit: tx.gasLimit?.toHexString(),
    })
}

export interface TransactionWithSource extends StoredTransaction {
    source: number
}

export const NULL_ADDRESS = '0x' + ('00'.repeat(20))

export interface MemPoolSource {
    init?(memPool: MemPool): void
    final?(memPool: MemPool): void
    put?(memPool: MemPool, tx: StoredTransaction): void
    listen?(memPool: MemPool, source: number): Observable<StoredTransaction>
    pull?(memPool: MemPool, source: number, identifier: TransactionIdentifier): Observable<StoredTransaction>
}

interface RegisteredSource {
    source: MemPoolSource,
    id: number,
    endSubject: Subject<void>
    listen$: Observable<StoredTransaction>
}

export class MemPool {

    private nextSourceId = 1;
    private sources = new Map<MemPoolSource, RegisteredSource>();
    private registerSubject = new Subject<RegisteredSource>()
    private listenAll$ = this.registerSubject.pipe(
        mergeMap(
            register => register.listen$.pipe(
                map(
                    tx => ({
                        ...tx,
                        source: register.id
                    }) as TransactionWithSource
                )
            )
        ),
        share()
    )

    private registered$ = concat(
        defer( () => this.sources.values() ),
        this.registerSubject
    )
    private withRegistered<T>(
        registered: RegisteredSource,
        task: (registered: RegisteredSource) => Observable<T>
    ) {
        return task(registered).pipe(
            takeUntil(
                registered.endSubject
            )
        )
    }
    private withAllRegistered<T>(
        task: (registered: RegisteredSource) => Observable<T>
    ) {
        return this.registered$.pipe(
            mergeMap(
                registered => this.withRegistered(
                    registered,
                    task
                )
            )
        )
    }

    registerSource(source: MemPoolSource) {
        if (this.sources.has(source)) {
            return;
        }

        const id = this.nextSourceId ++;
        const endSubject = new ReplaySubject<void>(1);

        const listen$ = (source.listen?.(this, id) ?? EMPTY).pipe(
            takeUntil(
                endSubject
            )
        );

        const register: RegisteredSource = {
            source,
            id,
            endSubject,
            listen$
        }

        source.init?.(this)
        this.sources.set(source, register);

        this.registerSubject.next(register)
    }
    unregisterSource(source: MemPoolSource) {
        const register = this.sources.get(source)
        if (register == undefined) {
            return;
        }
        this.sources.delete(source);
        register.endSubject.next(void 0)
        register.source.final?.(this)
    }

    private pool: StoredTransaction[] = [];
    getPool(): StoredTransaction[] {
        return this.pool.slice()
    }

    private entrySubject = new Subject<TransactionWithSource>();
    readonly entry$: Observable<TransactionWithSource> = this.entrySubject.asObservable();
    readonly pending$: Observable<StoredTransaction> = this.entry$.pipe(
        filter(tx => tx.state === TransactionState.Pending),
        share()
    );
    readonly finalized$: Observable<StoredTransaction> = this.entry$.pipe(
        filter(tx => tx.state === TransactionState.Mined || tx.state === TransactionState.Reverted),
        share()
    );

    getState(identifier: TransactionIdentifier): undefined | TransactionState {
        return this.pool.find(equals.bind(undefined, identifier))?.state
    }

    transactions(predicate: (tx: StoredTransaction) => boolean): Observable<StoredTransaction> {
        return merge(
            fromArray(this.pool),
            this.entry$
        ).pipe(
            distinct(
                (tx) => tx.chainId + '/' + tx.hash
            ),
            filter(predicate),
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
                            this.withAllRegistered<[StoredTransaction, number]>(
                                registered => (
                                    registered.source.pull?.(
                                        this, registered.id, identifier
                                    ) ?? EMPTY
                                ).pipe(
                                    map(
                                        tx => [tx, registered.id]
                                    )
                                )
                            ).pipe(
                                tap(
                                    ([tx, sourceId]) =>
                                        this.putFromSource(
                                            sourceId, tx
                                        )
                                ),
                                ignoreElements()
                            )
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

    wait(identifier: TransactionIdentifier): Promise<void> {
        return this.watchByIdentifier(identifier).pipe(
            filter(
                state =>
                    state === TransactionState.Mined ||
                    state === TransactionState.Reverted
            ),
            first(),
            ignoreElements()
        ).toPromise()
    }

    constructor(
        readonly id: number
    ) {
        this.listenAll$.subscribe(
            tx => {
                this.putFromSource(
                    tx.source, tx
                )
            }
        )
        this.withAllRegistered(
            (registered) => (
                'put' in registered.source ?
                    this.entry$.pipe(
                        filter(entry => entry.source !== registered.id),
                        map(
                            entry => [entry, registered.source] as const
                        )
                    ) :
                    EMPTY
            )
        ).subscribe(
            ([entry, source]) => {
                source.put!(this, entry)
            }
        )
    }

    putResponse(tx: TransactionResponse): TransactionResponse {
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
            state: TransactionState.Pending
        })
        return tx
    }
    putSent(tx: SentTransaction): SentTransaction {
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
            state: TransactionState.Pending
        })
        return tx
    }

    private putFromSource(source: number, tx: StoredTransaction) {
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
