import {TransactionReceipt, TransactionResponse} from "@ethersproject/abstract-provider";
import {Contract} from "ethers";

export class Sync {
    private last: Promise<any> = Promise.resolve(void 0);
    run<T>(task: () => T | Promise<T>): Promise<T> {
        let body = async () => await task();
        let promise: Promise<T> = this.last.then(body);
        this.last = promise.catch(() => void 0)
        return promise;
    }
    runTx<T>(task: () => TransactionResponse | Promise<TransactionResponse>): Promise<TransactionReceipt> {
        return this.run(task).then(
            tx => tx.wait()
        )
    }
    runDeploy<C extends Contract>(task: () => C | Promise<C>): Promise<C> {
        return this.run(task).then(
            contract => contract.deployed() as Promise<C>
        )
    }
}

export const SYNC = new Sync();
