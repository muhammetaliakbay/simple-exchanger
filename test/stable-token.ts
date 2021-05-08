import { ethers } from "hardhat";
import {StableToken} from "../contracts/stable-token";
import {deployStableToken} from "../deployment/stable-token";

describe("StableToken", function() {
    let addresses: string[];
    let stableToken: StableToken;

    before(async function () {
        addresses = await Promise.all((await ethers.getSigners()).map(
            signer => signer.getAddress()
        ));
    });

    beforeEach(async function () {
        stableToken = await deployStableToken(ethers);
    });

    it("Should mint successfully", async function () {
        await stableToken.mint(addresses[0], 10000)
    });

    it("Should burn successfully", async function () {
        await stableToken.mint(addresses[0], 10000)
        await stableToken.burn(addresses[0], 5000)
        await stableToken.burn(addresses[0], 5000)
    });

    it("Should lock successfully", async function () {
        await stableToken.mint(addresses[0], 10000)
        await stableToken.lock(addresses[0], 5000)
        await stableToken.lock(addresses[0], 5000)
    });

    it("Should unlock successfully", async function () {
        await stableToken.mint(addresses[0], 10000)
        await stableToken.lock(addresses[0], 10000)
        await stableToken.unlock(addresses[0], 5000)
        await stableToken.unlock(addresses[0], 5000)
    });

    it("Should transfer successfully", async function () {
        await stableToken.mint(addresses[0], 10000)
        await stableToken.transfer(addresses[0], addresses[1], 5000)
        await stableToken.transfer(addresses[1], addresses[2], 5000)
    });

    it("Should transfer locked successfully", async function () {
        await stableToken.mint(addresses[0], 10000)
        await stableToken.lock(addresses[0], 10000)
        await stableToken.transferLocked(addresses[0], addresses[1], 5000)
        await stableToken.lock(addresses[1], 5000)
        await stableToken.transferLocked(addresses[1], addresses[2], 5000)
    });
});