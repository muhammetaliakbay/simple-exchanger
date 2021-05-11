import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {StableToken} from "../contracts/stable-token";
import {BigNumberish} from "@ethersproject/bignumber";

export async function deployStableToken(
    ethers: HardhatEthersHelpers,
    code: string, precision: BigNumberish
): Promise<StableToken> {
    const StableToken = await ethers.getContractFactory("StableToken")
    const stableToken = await StableToken.deploy(
        code, precision
    )
    await stableToken.deployed();
    return stableToken as StableToken;
}
