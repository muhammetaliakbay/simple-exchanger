import {AddressAccess, Wallet, ConnectionSource, WalletInfo} from "./index";
import {defer, Observable, of} from "rxjs";
import {ethers} from "ethers";
import {ReactiveProvider} from "../reactive-provider";

export class InfuraSource implements ConnectionSource{
    constructor(
        readonly id: string,
        readonly infuraId: string,
        readonly defaultChainId: number
    ) {
    }

    readonly walletInfo: WalletInfo = {
        title: 'Infura',
        name: 'infura'
    }

    lookupProvider(preferredChainId: number = this.defaultChainId): Observable<ReactiveProvider | undefined> {
        return defer(
            async () => new ReactiveProvider(
                this.id,
                new ethers.providers.InfuraWebSocketProvider(
                    preferredChainId, this.infuraId
                ),
                preferredChainId
            )
        )
    }

    lookupWallet(): Observable<Wallet> {
        return of({
            access: AddressAccess.NotAvailable
        })
    }
}
