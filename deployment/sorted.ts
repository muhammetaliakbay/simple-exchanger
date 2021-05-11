import { Contract } from "ethers";
import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {SYNC} from "./sync";

export async function deploySortedLibrary(ethers: HardhatEthersHelpers): Promise<Contract> {
    const Sorted = await ethers.getContractFactory("Sorted")
    return await SYNC.runDeploy(() => Sorted.deploy());
}
