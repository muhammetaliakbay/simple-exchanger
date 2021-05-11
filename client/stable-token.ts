import {StableToken} from "../contracts/stable-token";
import {BigNumber} from "ethers";
import {Observable} from "rxjs";
import {pluck, shareReplay} from "rxjs/operators";
import {BaseClient} from "./base-client";
import {StableTokenDefinition} from "../instances/definitions";
import {Currency} from "./currency";

export interface Balance {
    available: BigNumber,
    locked: BigNumber,
    blockNumber: number
}

export class StableTokenClient {
    readonly contract: StableToken;
    constructor(
        readonly baseClient: BaseClient,
        contract: StableToken | string
    ) {
        if (typeof contract == "string") {
            contract = StableTokenDefinition.loadContract(contract).connect(baseClient.provider)
        }
        this.contract = contract;
    }

    getContractAddress(): string {
        return this.contract.address
    }

    private currency$: Promise<Currency> | null = null;
    async getCurrency(): Promise<Currency> {
        return await (this.currency$ ??= this.contract.getCurrency())
    }

    getBalance(address: string): Observable<Balance> {
        const contract = this.contract;
        const filters = contract.filters;
        return this.baseClient.onEvents(
            contract,
            [
                filters.Burn(null, address),
                filters.Lock(null, address),
                filters.Mint(null, address),
                filters.Unlock(null, address),
                filters.Transfer(null, address, null),
                filters.Transfer(null, null, address)
            ],
            blockNumber => contract.balance(address).then(
                ([available, locked]) => ({
                    available,
                    locked,
                    blockNumber
                })
            )
        )
    }

    getAvailableBalance(address: string): Observable<BigNumber> {
        return this.getBalance(address).pipe(pluck('available'))
    }

    getLockedBalance(address: string): Observable<BigNumber> {
        return this.getBalance(address).pipe(pluck('locked'))
    }

    private accountCache: {[address: string]: StableTokenAccount} = {}
    getAccount(address: string): StableTokenAccount {
        return this.accountCache[address] ??= new StableTokenAccount(this, address)
    }
}

export class StableTokenAccount {
    constructor(
        readonly client: StableTokenClient,
        readonly address: string
    ) {
    }

    balance$: Observable<Balance> = this.client.getBalance(this.address).pipe(shareReplay(1))
    availableBalance$: Observable<BigNumber> = this.balance$.pipe(pluck('available'))
    lockedBalance$: Observable<BigNumber> = this.balance$.pipe(pluck('locked'))
}
