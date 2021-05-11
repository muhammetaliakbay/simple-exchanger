import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {Exchanger} from "../contracts/exchanger";
import {SYNC} from "./sync";

export async function deployExchanger(
    ethers: HardhatEthersHelpers
): Promise<Exchanger> {
    const Exchanger = await ethers.getContractFactory("Exchanger")
    return await SYNC.runDeploy(() => Exchanger.deploy() as Promise<Exchanger>);
}
