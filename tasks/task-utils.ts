import {Signer} from "ethers";
import {ethers} from "hardhat";

export async function getSigner(addressOrIndex: string | number): Promise<Signer> {
    if (typeof addressOrIndex === 'string') {
        if (!addressOrIndex.startsWith('0x')) {
            addressOrIndex = Number(addressOrIndex)
        }
    }

    return ethers.provider.getSigner(addressOrIndex)
}

export async function getAddress(addressOrIndex: string | number): Promise<string> {
    if (typeof addressOrIndex === 'string') {
        if (!addressOrIndex.startsWith('0x')) {
            addressOrIndex = Number(addressOrIndex)
        }
    }

    if (typeof addressOrIndex === 'number') {
        addressOrIndex = await ethers.provider.getSigner(addressOrIndex).getAddress()
    }

    return addressOrIndex;
}