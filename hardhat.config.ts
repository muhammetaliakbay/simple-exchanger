import {HardhatUserConfig, task} from "hardhat/config";
import '@nomiclabs/hardhat-waffle';
import {int} from "hardhat/internal/core/params/argumentTypes";

function loadTaskMethod(name: string) {
    return (...args: any[]) => import(`./tasks/${name}`).then(
        ({default: task}) => task(...args)
    )
}

task("deploy", "Deploy contracts")
    .setAction(loadTaskMethod("deploy"));

task("addresses", "List addresses")
    .setAction(loadTaskMethod("list-addresses"));

task("mint", "Mint stable tokens")
    .addParam("account", "The account's address")
    .addParam("amount", "Amount to mint")
    .addParam("currency", "Currency")
    .setAction(loadTaskMethod("mint-stable-token"));

task("sell", "Put sell order")
    .addParam("account", "The account's address")
    .addParam("volume", "Volume")
    .addParam("currency", "Currency")
    .addParam("price", "Price")
    .setAction(loadTaskMethod("sell"));

task("buy", "Put buy order")
    .addParam("account", "The account's address")
    .addParam("balance", "Balance")
    .addParam("currency", "Currency")
    .addParam("price", "Price")
    .setAction(loadTaskMethod("buy"));

task("fund", "Fund from first signer")
    .addParam("account", "The account's address")
    .addParam("amount", "Amount to fund")
    .setAction(loadTaskMethod("fund"));

task("deploy-order-book", "Deploy separate order-book")
    .addParam("currency", "Currency Code")
    .addParam("precision", "Precision", undefined, int)
    .setAction(loadTaskMethod("deploy-order-book"));

module.exports = {
    solidity: "0.8.4",
    defaultNetwork: 'localhost',
    networks: {
        ...(
            process.env.ROPSTEN_URL ? {
                ropsten: {
                    url: process.env.ROPSTEN_URL,
                    chainId: 3,
                    accounts: [process.env.ROPSTEN_PRIVATEKEY]
                }
            }: {}
        )
    }
} as HardhatUserConfig;
