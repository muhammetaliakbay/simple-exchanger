import {BigNumber, BigNumberish} from "ethers";

export function convertApproximately(
    input: {
        price?: BigNumberish,
        volume?: BigNumberish,
        balance?: BigNumberish
    },
    scale: BigNumberish
): {
    price: BigNumber,
    volume: BigNumber,
    balance: BigNumber
} {
    let {price, volume, balance} = input as {
        price?: BigNumberish,
        volume?: BigNumberish,
        balance?: BigNumberish
    };
    price = price == undefined ? undefined : BigNumber.from(price)
    volume = volume == undefined ? undefined : BigNumber.from(volume)
    balance = balance == undefined ? undefined : BigNumber.from(balance)
    scale = BigNumber.from(scale)

    if (price) {
        if (volume) {
            if (!balance) {
                balance = price.mul(volume).div(scale)
            }
        } else if (balance) {
            if (!volume) {
                volume = balance.mul(scale).div(price)
            }
        } else {
            throw new Error("Insufficient input")
        }
    } else {
        if (volume && balance) {
            price = balance.mul(scale).div(volume)
        } else {
            throw new Error("Insufficient input")
        }
    }

    return {
        price,
        volume,
        balance
    }
}
