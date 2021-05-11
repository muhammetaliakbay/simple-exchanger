import {ExtendedArtifact, ExtendedContract} from "../contracts/extended";
import {ContractFactory} from "ethers";

export class ContractDefinition<T extends ExtendedContract<T>> {
    constructor(
        readonly fileName: `${string}.sol`,
        readonly contractName: string
    ) {
    }

    private artifact?: ExtendedArtifact<T>
    private defaultAddress?: string
    private deployer?: string

    loadArtifact(): ExtendedArtifact<T> {
        return this.artifact ??= require(`../artifacts/contracts/${this.fileName}/${this.contractName}`)
    }

    loadDefaultAddress(): string {
        return this.defaultAddress ??= require(`../runtime/${this.contractName}/address.json`)
    }

    loadDeployer(): string {
        return this.deployer ??= require(`../runtime/${this.contractName}/deployer.json`)
    }

    loadContract(address?: string): T {
        return ContractFactory.getContract(
            address ?? this.loadDefaultAddress(),
            this.loadArtifact().abi
        ) as T
    }
}
