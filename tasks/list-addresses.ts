import {ethers} from "hardhat";

export default async function() {

    const accounts = await ethers.getSigners();
    for (const account of accounts) {
        console.log(account.address)
    }

}