import {HardhatUserConfig, task, types} from "hardhat/config";
import '@nomiclabs/hardhat-waffle';

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

module.exports = {
    solidity: "0.8.4",
    defaultNetwork: 'localhost'
} as HardhatUserConfig;
