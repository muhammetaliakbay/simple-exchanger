import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {StableToken} from "../contracts/stable-token";

export async function deployStableToken(ethers: HardhatEthersHelpers): Promise<StableToken> {
    const StableToken = await ethers.getContractFactory("StableToken")
    const stableToken = await StableToken.deploy()
    await stableToken.deployed();
    return stableToken as StableToken;
}
