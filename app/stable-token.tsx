import {StableTokenClient} from "../client/stable-token";
import React from "react";
import {useLoggedPromise} from "./logger-hooks";

export function StableTokenName(
    {
        token
    }: {
        token: StableTokenClient
    }
) {
    const [currency] = useLoggedPromise(() => token.getCurrency(), [token])
    return <>{currency?.code}</>
}