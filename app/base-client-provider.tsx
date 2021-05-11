import React, { createContext, useContext } from "react";
import {BaseClient} from "../client/base-client";

const BaseClientContext = createContext<BaseClient>(undefined as never as BaseClient);

export function BaseClientProvider(
    {
        client,
        children
    }: {
        client: BaseClient,
        children: any
    }
): JSX.Element {
    return <BaseClientContext.Provider value={client}>
        {children}
    </BaseClientContext.Provider>
}

export function useBaseClient(): BaseClient {
    return useContext(BaseClientContext)
}