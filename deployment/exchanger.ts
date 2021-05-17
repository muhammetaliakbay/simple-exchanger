import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {TExchanger} from "../contracts/exchanger";
import {SYNC} from "./sync";

export async function deployExchanger(
    ethers: HardhatEthersHelpers
): Promise<TExchanger> {
    const Exchanger = await ethers.getContractFactory("Exchanger")
    return await SYNC.runDeploy(() => Exchanger.deploy() as Promise<TExchanger>);
}
