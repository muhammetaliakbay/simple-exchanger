import {BigNumber, BigNumberish} from "ethers";
import PromisePool from "@supercharge/promise-pool";

export async function collectArray<T>(
    length: BigNumberish | Promise<BigNumberish>,
    getter: (index: BigNumberish) => T | Promise<T>,
    batch: number = 10
): Promise<T[]> {
    const arrayLength = BigNumber.from(await length).toNumber();
    const items = new Array<T>(arrayLength);
    const indices = new Array<number>(arrayLength);
    for (let index = 0; index < arrayLength; index ++) {
        indices[index] = index;
    }
    const {errors} = await PromisePool
        .withConcurrency(batch)
        .for(indices)
        .process(
            async index => {
                items[index] = await getter(index)
            }
        )

    if (errors.length > 0) {
        throw new Error("Couldn't fetch all elements")
    }

    return items
}