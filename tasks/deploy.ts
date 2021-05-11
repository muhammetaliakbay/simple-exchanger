import { ethers } from "hardhat";
import stableCurrencies from "../stable-currencies.json";
import {deployStableToken} from "../deployment/stable-token";
import {deployExchanger} from "../deployment/exchanger";
import {deployOrderBook} from "../deployment/order-book";
import {deployOrderLibrary} from "../deployment/order";
import {SYNC} from "../deployment/sync";
import {promisify} from "util";
import {writeFile} from "fs";
import {DeploymentInfo} from "../deployment/deployment-info";
import {getAddress} from "./task-utils";

export default async function() {

    const queue: Promise<any>[] = [Promise.resolve()];

    console.log("Deploying Order")
    const Order$ = deployOrderLibrary(ethers);

    console.log("Deploying Exchanger")
    const exchanger$ = deployExchanger(ethers);

    for (const currency of stableCurrencies) {

        console.log("Deploying StableToken", currency)
        const stableToken$ = deployStableToken(ethers, currency, 2);

        const orderBook$ = Promise.all([stableToken$, Order$]).then(
            ([stableToken, Order]) => {
                console.log("Deploying OrderBook", currency)
                return deployOrderBook(ethers, stableToken, 18, {Order})
            }
        )

        queue.push(
            Promise.all([stableToken$, orderBook$]).then(
                ([stableToken, orderBook]) => {
                    console.log("Registering OrderBook as manager of StableToken", orderBook.address, currency)
                    return SYNC.runTx(
                        () => stableToken.addManager(orderBook.address)
                    )
                }
            )
        )

        queue.push(
            Promise.all([exchanger$, orderBook$]).then(
                ([exchanger, orderBook]) => {
                    console.log("Registering OrderBook", orderBook.address, currency)
                    return SYNC.runTx(
                        () => exchanger.registerOrderBook(orderBook.address)
                    )
                }
            )
        )
    }

    await Promise.all(queue).then(
        async () => {
            const exchanger = await exchanger$;
            const account = await getAddress(0);
            const network = await ethers.provider.getNetwork()
            const info: DeploymentInfo = {
                network: {
                    name: network.name,
                    chainId: network.chainId
                },
                account: account,
                exchangeAddress: exchanger.address
            }
            console.log("Deployment is completed.", info)
            console.log("Saving deployment information")
            await promisify(writeFile)('deployment.json', JSON.stringify(info, undefined, 3))
        }
    );
}
