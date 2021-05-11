import { ethers } from "hardhat";
import { Contract } from "ethers";
import {expect} from "chai";
import {deployOrderLibrary} from "../deployment/order";
import {OrderTest} from "../contracts/order-test";

describe("OrderTest", function() {
    let addresses: string[];

    let order: Contract;
    let orderTest: OrderTest;

    before(async function () {
        addresses = await Promise.all((await ethers.getSigners()).map(
            signer => signer.getAddress()
        ));
        order = await deployOrderLibrary(ethers);
    });

    beforeEach(async function () {
        const OrderTest = await ethers.getContractFactory(
            "OrderTest", {
                libraries: {
                    "Order": order.address
                }
            }
        )
        orderTest = await OrderTest.deploy(18) as any
        await orderTest.deployed();
    });

    it("Should return empty buyers list", async function () {
        expect(await orderTest.allBuyers()).deep.eq([]);
    });

    it("Should return empty sellers list", async function () {
        expect(await orderTest.allSellers()).deep.eq([]);
    });

    /*it("Should return correct buyers", async function () {
        const buyOrder: OrderEntry = [
            addresses[0],
            BigNumber.from(10000),
            BigNumber.from(5000),
        ];
        await orderTest.putBuyOrder(buyOrder[0], buyOrder[1], buyOrder[2]);
        expect(await orderTest.allBuyers()).deep.eq([buyOrder]);
    });

    it("Should return correct sellers", async function () {
        const sellOrder: OrderEntry = [
            addresses[0],
            BigNumber.from(10),
            BigNumber.from(5000),
        ];
        await orderTest.putSellOrder(sellOrder[0], sellOrder[1], sellOrder[2]);
        expect(await orderTest.allSellers()).deep.eq([sellOrder]);
    });

    it("Should return correct matching", async function () {
        const sellOrder: OrderEntry = [
            addresses[0],
            BigNumber.from(10000),
            BigNumber.from(5000),
        ];
        const buyOrder1: OrderEntry = [
            addresses[0],
            BigNumber.from(5000),
            BigNumber.from(5000),
        ];
        const buyOrder2: OrderEntry = [
            addresses[0],
            BigNumber.from(5000),
            BigNumber.from(5000),
        ];
        await orderTest.putBuyOrder(buyOrder1[0], buyOrder1[1], buyOrder1[2]);
        await orderTest.putBuyOrder(buyOrder2[0], buyOrder2[1], buyOrder2[2]);
        expect(await orderTest.allBuyers()).deep.eq([buyOrder1, buyOrder2]);
        await orderTest.matchBuyOrder(sellOrder[1], sellOrder[2]);
    });*/
});