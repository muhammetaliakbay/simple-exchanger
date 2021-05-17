import {ethers} from "ethers";

export function addressEquals(a: string | undefined, b: string | undefined) {
    return (a != undefined && b != undefined) && (a.toLowerCase() === b.toLowerCase())
}

export function addressNormalize(a: string) {
    return ethers.utils.getAddress(a)
}
