import { Contract } from "ethers";
import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {deploySortedLibrary} from "./sorted";
import {OrderBook} from "../contracts/order-book";
import {deployOrderLibrary} from "./order";
import {StableToken} from "../contracts/stable-token";
import {deployStableToken} from "./stable-token";
import {BigNumberish} from "@ethersproject/bignumber";

export async function deployOrderBookContract(
    ethers: HardhatEthersHelpers,
    stableToken: StableToken, multiplier: BigNumberish,
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
        stableToken.address, multiplier
    )
    await orderBook.deployed();
    return orderBook as OrderBook;
}
