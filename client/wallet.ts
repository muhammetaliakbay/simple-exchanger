import {Signer} from "ethers";

export class Wallet {
    constructor(
        private signer: Signer,
        private address: string
    ) {
    }

    getSigner(): Signer {
        return this.signer;
    }

    getAddress(): string {
        return this.address;
    }
}