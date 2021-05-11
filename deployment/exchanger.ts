import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {Exchanger} from "../contracts/exchanger";

export async function deployExchanger(
    ethers: HardhatEthersHelpers
): Promise<Exchanger> {
    const Exchanger = await ethers.getContractFactory("Exchanger")
    const exchanger = await Exchanger.deploy()
    await exchanger.deployed();
    return exchanger as Exchanger;
}
