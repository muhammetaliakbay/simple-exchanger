import React, { createContext, useContext } from "react";
import {Wallet} from "../client/wallet";

const WalletContext = createContext<Wallet | undefined>(undefined);

export function WalletProvider(
    {
        wallet,
        children
    }: {
        wallet: Wallet | undefined,
        children: any
    }
): JSX.Element {
    return <WalletContext.Provider value={wallet}>
        {children}
    </WalletContext.Provider>
}

export function useWallet(): Wallet | undefined {
    return useContext(WalletContext)
}
