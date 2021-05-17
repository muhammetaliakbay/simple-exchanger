import {TArtifact, TContract} from "../contracts/extended";
import {ContractFactory} from "ethers";

export class ContractDefinition<T extends TContract<any>> {
    constructor(
        readonly fileName: `${string}.sol`,
        readonly contractName: string
    ) {
    }

    private artifact?: TArtifact<T>

    loadArtifact(): TArtifact<T> {
        return this.artifact ??= require(`../artifacts/contracts/${this.fileName}/${this.contractName}`)
    }

    loadContract(address: string): T {
        return ContractFactory.getContract(
            address,
            this.loadArtifact().abi
        ) as T
    }
}
