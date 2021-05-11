import {ExtendedArtifact, ExtendedContract} from "../contracts/extended";
import {ContractFactory} from "ethers";

export class ContractDefinition<T extends ExtendedContract<T>> {
    constructor(
        readonly fileName: `${string}.sol`,
        readonly contractName: string
    ) {
    }

    private artifact?: ExtendedArtifact<T>

    loadArtifact(): ExtendedArtifact<T> {
        return this.artifact ??= require(`../artifacts/contracts/${this.fileName}/${this.contractName}`)
    }

    loadContract(address: string): T {
        return ContractFactory.getContract(
            address,
            this.loadArtifact().abi
        ) as T
    }
}
