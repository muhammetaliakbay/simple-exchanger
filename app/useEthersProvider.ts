import {useLoggedPromise} from "./logger-hooks";
import detectEthereumProvider from "@metamask/detect-provider";
import {useEffect, useMemo, useState} from "react";
import {ethers} from "ethers";
import {Provider} from "@ethersproject/abstract-provider";
import {retry} from "rxjs/operators";

export enum EthersProviderStatus {
    Detecting = "detecting",
    NotDetected = "not-detected",
    RequestingAccess = "requesting-access",
    AccessRejected = "access-rejected",
    Connecting = "connecting",
    Ready = "ready",
    Disconnected = "disconnected"
}

export function useEthersProvider(): (
    {ethersProvider: ethers.providers.Web3Provider, status: EthersProviderStatus.Ready, retry: () => void} |
    {ethersProvider: undefined, status: Exclude<EthersProviderStatus, EthersProviderStatus.Ready>, retry: () => void}
) {
    const [ethersProvider, setEthersProvider] = useState<ethers.providers.Web3Provider | EthersProviderStatus.Disconnected>()

    const [retryCounter, setRetryCounter] = useState(1)
    const retry = () => {
        setRetryCounter(retryCounter + 1);
        setEthersProvider(undefined)
    }

    let status: EthersProviderStatus;

    const [provider, , providerState] = useLoggedPromise<any>(
        () => detectEthereumProvider(),
        [retryCounter]
    );
    if (providerState === "pending") {
        status = EthersProviderStatus.Detecting;
    } else if (providerState === "resolved") {
        if (provider) {
            status = EthersProviderStatus.RequestingAccess;
        } else {
            status = EthersProviderStatus.NotDetected
        }
    } else if (providerState === "rejected") {
        status = EthersProviderStatus.NotDetected;
    } else {
        throw new Error("Bug.")
    }

    const access$ = useMemo<Promise<undefined | boolean>>(
        () => (provider?.request({ method: 'eth_requestAccounts' })?.then(() => true)) ?? Promise.resolve(undefined),
        [provider]
    )
    const [access, , accessState] = useLoggedPromise(access$, [provider])
    if (status === EthersProviderStatus.RequestingAccess) {
        if (access === true) {
            status = EthersProviderStatus.Connecting
        } else if(access === false || accessState === "rejected") {
            status = EthersProviderStatus.AccessRejected
        }
    }

    useEffect(
        () => {
            if (access) {
                setEthersProvider(
                    new ethers.providers.Web3Provider(provider as any)
                )

                const changeListener = () => {
                    setEthersProvider(
                        new ethers.providers.Web3Provider(provider as any)
                    )
                };
                const disconnectListener = () => {
                    setEthersProvider(EthersProviderStatus.Disconnected)
                }

                provider.on('accountsChanged', changeListener);
                provider.on('chainChanged', changeListener);
                provider.on('disconnect', disconnectListener);

                return () => {
                    provider.removeListener('accountsChanged', changeListener);
                    provider.removeListener('chainChanged', changeListener);
                    provider.removeListener('disconnect', disconnectListener);
                }
            }

        }, [provider, access]
    )

    if (status === EthersProviderStatus.Connecting) {
        if (ethersProvider === EthersProviderStatus.Disconnected) {
            return {ethersProvider: undefined, status: EthersProviderStatus.Disconnected, retry};
        } else {
            if (ethersProvider) {
                return {ethersProvider, status: EthersProviderStatus.Ready, retry}
            } else {
                return {ethersProvider: undefined, status, retry}
            }
        }
    } else {
        return {ethersProvider: undefined, status, retry}
    }
}
