import { ethers } from "hardhat";
import { Contract } from "ethers";
import {OrderBook} from "../contracts/order-book";
import {StableToken} from "../contracts/stable-token";
import {deployOrderBook} from "../deployment/order-book";
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
        orderBook = await deployOrderBook(ethers, stableToken, 18, {
            "Order": order,
        })

        await stableToken.addManager(orderBook.address);
    });

    it("Should return correct matching", async function () {

    });
});