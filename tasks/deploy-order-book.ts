import { ethers } from "hardhat";
import {deployStableToken} from "../deployment/stable-token";
import {deployOrderBook} from "../deployment/order-book";
import {deployment} from "../deployment/deployment-info";
import {ExchangerDefinition} from "../instances/definitions";
import {deployOrderLibrary} from "../deployment/order";
import ETH from "../eth.json"
import {getSigner} from "./task-utils";

export default async function(
    {
        currency,
        precision
    }: {
        currency: string,
        precision: number
    }
) {
    const signer = await getSigner(0)

    const exchangerAddress = deployment().exchangeAddress;
    console.log("Loading Exchanger contract", exchangerAddress)
    const exchanger = ExchangerDefinition.loadContract(exchangerAddress).connect(signer)

    //TODO: Retrieve address of already deployer Order library
    console.log("Deploying Order library")
    const Order = await deployOrderLibrary(ethers);

    console.log("Deploying StableToken contract", currency)
    const stableToken = await deployStableToken(ethers, currency, precision);

    console.log("Deploying OrderBook contract", currency, stableToken.address)
    const orderBook = await deployOrderBook(ethers, stableToken, ETH.precision, {Order});

    console.log("Registering OrderBook as manager of StableToken", orderBook.address, currency)
    await stableToken.addManager(orderBook.address);

    console.log("Registering OrderBook", orderBook.address, currency)
    await exchanger.registerOrderBook(orderBook.address);
}
