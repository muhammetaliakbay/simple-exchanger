import React, { createContext, useContext } from "react";
import {Account} from "../client/providers";

const AccountContext = createContext<Account | undefined>(undefined);

export function AccountProvider(
    {
        account,
        children
    }: {
        account: Account | undefined,
        children: any
    }
): JSX.Element {
    return <AccountContext.Provider value={account}>
        {children}
    </AccountContext.Provider>
}

export function useAccount(): Account | undefined {
    return useContext(AccountContext)
}
