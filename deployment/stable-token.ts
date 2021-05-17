import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {TStableToken} from "../contracts/stable-token";
import {BigNumberish} from "@ethersproject/bignumber";
import {SYNC} from "./sync";

export async function deployStableToken(
    ethers: HardhatEthersHelpers,
    code: string, precision: BigNumberish
): Promise<TStableToken> {
    const StableToken = await ethers.getContractFactory("StableToken")
    return await SYNC.runDeploy(() => StableToken.deploy(
        code,
        precision
    ) as Promise<TStableToken>);
}
