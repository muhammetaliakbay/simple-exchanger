import { Contract } from "ethers";
import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {TOrderBook} from "../contracts/order-book";
import {deployOrderLibrary} from "./order";
import {TStableToken} from "../contracts/stable-token";
import {SYNC} from "./sync";

export async function deployOrderBook(
    ethers: HardhatEthersHelpers,
    stableToken: TStableToken,
    precision: number,
    libraries?: {
        "Order"?: Contract
    }
): Promise<TOrderBook> {
    const OrderBook = await ethers.getContractFactory("OrderBook", {
        libraries: {
            "Order": (libraries?.Order ?? await deployOrderLibrary(ethers)).address
        }
    });

    return await SYNC.runDeploy(() => OrderBook.deploy(
        stableToken.address,
        precision
    ) as Promise<TOrderBook>);
}
