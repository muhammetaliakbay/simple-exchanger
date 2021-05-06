import { Contract } from "ethers";
import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";

export async function deploySortedLibrary(ethers: HardhatEthersHelpers): Promise<Contract> {
    const Sorted = await ethers.getContractFactory("Sorted")
    const sorted = await Sorted.deploy()
    await sorted.deployed();
    return sorted;
}
