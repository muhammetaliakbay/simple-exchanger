import {MemPool, MemPoolSource, parseTx, serializeTx, StoredTransaction, TransactionState} from "./index";
import {defer, Observable} from "rxjs";
import {fromArray} from "rxjs/internal/observable/fromArray";

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

export class LocalStoragePool implements MemPoolSource {
    static readonly available: boolean = typeof localStorage !== "undefined";

    listen(memPool: MemPool, source: number): Observable<StoredTransaction> {
        return defer(
            () => fromArray(
                loadLocalStorage(memPool)
            )
        );
    }

    put(memPool: MemPool, tx: StoredTransaction) {
        if (tx.state === TransactionState.Pending) {
            storeLocalStorage(memPool, tx)
        } else {
            removeLocalStorage(memPool, tx)
        }
    }
}
