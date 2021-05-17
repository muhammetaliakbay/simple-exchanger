import {TransactionReceipt, TransactionResponse} from "@ethersproject/abstract-provider";
import {
    MemPool,
    MemPoolSource,
    NULL_ADDRESS,
    StoredTransaction,
    TransactionIdentifier,
    TransactionState
} from "./index";
import {concat, defer, EMPTY, Observable} from "rxjs";
import {ReactiveProvider} from "../reactive-provider";
import {filter} from "rxjs/operators";

export class ProviderPool implements MemPoolSource {
    constructor(readonly provider: ReactiveProvider) {
    }

    listen(memPool: MemPool, source: number): Observable<StoredTransaction> {
        return new Observable<StoredTransaction>(
            subscriber => {
                const listener = (txHash: string) => {
                    //TODO: Implemented the logic
                };
                this.provider.provider.on('pending', listener);

                return () => {
                    this.provider.provider.off('pending', listener);
                }
            }
        )
    }

    fromResponse(tx: TransactionResponse, state: TransactionState = TransactionState.Pending): StoredTransaction {
        return {
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
        }
    }

    async fromReceipt(tx: TransactionReceipt): Promise<StoredTransaction> {
        const status = tx.status;
        const txResponse = await this.provider.provider.getTransaction(tx.transactionHash)

        return this.fromResponse(
            txResponse, (
                status == undefined ?
                    TransactionState.Pending :
                    (
                        status ?
                            TransactionState.Mined :
                            TransactionState.Reverted
                    )
            )
        )
    }

    pull(memPool: MemPool, source: number, identifier: TransactionIdentifier): Observable<StoredTransaction> {
        if (identifier.chainId !== this.provider.chainId) {
            return EMPTY;
        } else {
            return concat(
                defer(
                    () => this.provider.provider.getTransactionReceipt(
                        identifier.hash
                    ).then(
                        tx => tx == null ? null : this.fromReceipt(tx)
                    )
                ).pipe(
                    filter(
                        (tx => tx != null) as ((tx: any) => tx is StoredTransaction)
                    )
                ),
                new Observable<StoredTransaction>(
                    subscriber => {
                        const listener = (tx: TransactionReceipt) =>
                            this.fromReceipt(tx).then(
                                tx => subscriber.next(tx)
                            )
                        this.provider.provider.once(identifier.hash, listener)
                        return () => this.provider.provider.off(identifier.hash, listener)
                    }
                )
            )
        }
    }
}
