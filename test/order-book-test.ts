import { ethers } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "ethers";
import {expect} from "chai";
import {OrderBook} from "../contracts/order-book";
import {StableToken} from "../contracts/stable-token";
import {deployOrderBookContract} from "../deployment/order-book";
import {deployOrderLibrary} from "../deployment/order";
import {deployStableToken} from "../deployment/stable-token";

describe("OrderBook", function() {
    let addresses: string[];

    let orderBook: OrderBook;
    let stableToken: StableToken;
    let order: Contract;

    before(async function () {
        addresses = await Promise.all((await ethers.getSigners()).map(
            signer => signer.getAddress()
        ));

        order = await deployOrderLibrary(ethers);
        stableToken = await deployStableToken(ethers, "EUR", 100);
    });

    beforeEach(async function () {
        orderBook = await deployOrderBookContract(ethers, stableToken, 1000000, {
            "Order": order,
        })

        await stableToken.addManager(orderBook.address);
    });

    it("Should return correct matching", async function () {

    });
});