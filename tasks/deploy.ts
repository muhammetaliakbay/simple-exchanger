import { ethers } from "hardhat";
import stableCurrencies from "../stable-currencies.json";
import {deployStableToken} from "../deployment/stable-token";
import {saveRuntimeData} from "../deployment/runtime";
import {ExchangerDefinition} from "../instances/definitions";
import {deployExchanger} from "../deployment/exchanger";
import {deployOrderBook} from "../deployment/order-book";
import {deployOrderLibrary} from "../deployment/order";

export default async function() {

    console.log("Deploying Order")
    const Order = await deployOrderLibrary(ethers);

    console.log("Deploying Exchanger")
    const exchanger = await deployExchanger(ethers);
    saveRuntimeData(ExchangerDefinition, exchanger)

    for (const currency of stableCurrencies) {

        console.log("Deploying StableToken", currency)
        const stableToken = await deployStableToken(ethers, currency, 2);
        console.log("Deploying OrderBook")
        const orderBook = await deployOrderBook(ethers, stableToken, 18, {Order});
        console.log("Registering OrderBook as manager of StableToken")
        await (await stableToken.addManager(orderBook.address)).wait()

        console.log("Registering OrderBook", orderBook.address)
        await (await (exchanger.registerOrderBook(orderBook.address))).wait();
    }

}
