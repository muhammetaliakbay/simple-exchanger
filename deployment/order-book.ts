import { Contract } from "ethers";
import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {OrderBook} from "../contracts/order-book";
import {deployOrderLibrary} from "./order";
import {StableToken} from "../contracts/stable-token";

export async function deployOrderBook(
    ethers: HardhatEthersHelpers,
    stableToken: StableToken,
    precision: number,
    libraries?: {
        "Order"?: Contract
    }
): Promise<OrderBook> {
    const OrderBook = await ethers.getContractFactory("OrderBook", {
        libraries: {
            "Order": (libraries?.Order ?? await deployOrderLibrary(ethers)).address
        }
    });

    const orderBook = await OrderBook.deploy(
        stableToken.address,
        precision
    )
    await orderBook.deployed();
    return orderBook as OrderBook;
}
