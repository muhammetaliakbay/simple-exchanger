import {StableTokenClient} from "../client/stable-token";
import usePromise from "react-use-promise";
import React from "react";

export function StableTokenName(
    {
        token
    }: {
        token: StableTokenClient
    }
) {
    const [currency] = usePromise(() => token.getCurrency(), [token])
    return <>{currency?.code}</>
}