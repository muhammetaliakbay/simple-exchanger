import {mkdirSync, writeFileSync} from "fs";
import {ContractDefinition} from "../instances/loader";
import {ExtendedContract} from "../contracts/extended";

export function saveRuntimeData<T extends ExtendedContract<T>>(definition: ContractDefinition<T>, contract: T) {
    mkdirSync(`runtime/${definition.contractName}`, {recursive: true})
    writeFileSync(`runtime/${definition.contractName}/address.json`, JSON.stringify(contract.address))
    writeFileSync(`runtime/${definition.contractName}/deployer.json`, JSON.stringify(contract.deployTransaction.from))
}