import {BigNumber} from "ethers";
import React from "react";
import {Currency} from "../client/currency";
import {toFixedPointString} from "./amount-utils";

export function AmountView(
    {
        amount,
        currency,
        reduceZeros = false
    }: {
        amount: BigNumber,
        currency: Currency,
        reduceZeros?: boolean
    }
) {
    return <>{toFixedPointString(amount, currency.precision, reduceZeros)} {currency.code}</>
}
