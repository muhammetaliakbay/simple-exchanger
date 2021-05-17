import {Provider} from "@ethersproject/abstract-provider";

export class ReactiveProvider {
    constructor(
        readonly id: string,
        readonly provider: Provider,
        readonly chainId: number
    ) {
    }
}