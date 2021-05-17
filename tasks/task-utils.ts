import {Signer} from "ethers";
import {ethers} from "hardhat";
import {ReactiveProvider} from "../client/reactive-provider";
import {BaseClient} from "../client/base-client";
import {MemPool} from "../client/mempool";
import ETH from "../eth.json"
import {Account, SentTransaction, UnsignedTransaction} from "../client/providers";

export async function getSigner(addressOrIndex: string | number): Promise<Signer> {
    if (typeof addressOrIndex === 'string') {
        if (!addressOrIndex.startsWith('0x')) {
            addressOrIndex = Number(addressOrIndex)
        }
    }

    return ethers.provider.getSigner(addressOrIndex)
}

export async function getAccount(addressOrIndex: string | number): Promise<Account> {
    const signer = await getSigner(addressOrIndex)
    const address = await signer.getAddress()

    return {
        address,
        async sendTransaction(unsigned: UnsignedTransaction): Promise<SentTransaction> {
            return (await signer.sendTransaction(unsigned)) as SentTransaction
        }
    }
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

export const reactiveProvider = new ReactiveProvider(
    '?',
    ethers.provider,
    0
)

export const memPool = new MemPool(0)

export const baseClient = new BaseClient(
    memPool,
    reactiveProvider,
    ETH
)
