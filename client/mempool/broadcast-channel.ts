import {MemPool, MemPoolSource, parseTx, serializeTx, StoredTransaction} from "./index";
import {Observable} from "rxjs";

function broadcastChannelName(memPool: MemPool) {
    return 'mp_' + memPool.id
}

export class BroadcastChannelPool implements MemPoolSource {
    static readonly available: boolean = typeof BroadcastChannel !== "undefined";

    private channels = new Map<MemPool, BroadcastChannel>();
    init(memPool: MemPool) {
        if (this.channels.has(memPool)) {
            throw new Error("Already initialized")
        } else {
            const broadcastChannel = new BroadcastChannel(broadcastChannelName(memPool))
            this.channels.set(memPool, broadcastChannel)
        }
    }
    final(memPool: MemPool) {
        const channel = this.channels.get(memPool)
        if (channel == undefined) {
            throw new Error("Not initialized")
        } else {
            this.channels.delete(memPool)
            channel.close()
        }
    }
    listen(memPool: MemPool, source: number): Observable<StoredTransaction> {
        return new Observable<StoredTransaction>(
            subscriber => {
                const broadcastChannel = this.channels.get(memPool);
                if (broadcastChannel == undefined) {
                    subscriber.error(new Error("Not initialized"))
                    return
                }

                const listener = (ev: MessageEvent) => {
                    if (
                        ev.data === 'new'
                    ) {
                        for (const entry of memPool.getPool()) {
                            broadcastChannel.postMessage(
                                serializeTx(entry)
                            )
                        }
                    } else if (
                        typeof ev.data === 'string'
                    ) {
                        const entry = parseTx(ev.data);
                        if (entry) {
                            subscriber.next(entry)
                        }
                    }
                }
                broadcastChannel.addEventListener('message', listener);
                broadcastChannel.postMessage("new")

                return () => {
                    broadcastChannel.removeEventListener('message', listener)
                }
            }
        )
    }
    put(memPool: MemPool, tx: StoredTransaction) {
        const broadcastChannel = this.channels.get(memPool);
        if (broadcastChannel == undefined) {
            throw new Error("Not initialized")
        }
        broadcastChannel.postMessage(
            serializeTx(tx)
        )
    }
}
