import { Contract } from "ethers";
import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {deploySortedLibrary} from "./sorted";

export async function deployOrderLibrary(ethers: HardhatEthersHelpers, libraries?: {
    "Sorted"?: Contract
}): Promise<Contract> {
    const Order = await ethers.getContractFactory("Order", {
        libraries: {
            "Sorted": (libraries?.Sorted ?? await deploySortedLibrary(ethers)).address
        }
    });

    const order = await Order.deploy()
    await order.deployed();
    return order;
}
