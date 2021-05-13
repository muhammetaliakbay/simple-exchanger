import usePromise from "react-use-promise";
import {DependencyList, useEffect} from "react";
import {useObservable} from "react-use-observable";
import {observerFunction} from "react-use-observable/dist/observable";

type PendingState = [undefined, undefined, 'pending'];
type ResolvedState<Result> = [Result, undefined, 'resolved'];
type RejectedState = [undefined, Error, 'rejected'];

export function useLoggedPromise<Result = any>(
    promise: Promise<Result> | (() => Promise<Result>),
    deps?: Array<any>
): PendingState | ResolvedState<Result> | RejectedState {
    const response = usePromise(
        promise,
        deps
    )

    const [, reason, state] = response;
    useEffect(
        () => {
            if (state === "rejected") {
                console.error(reason)
            }
        },
        [reason, state]
    )

    return response;
}

export function useLoggedObservable<T>(
    observableGenerator: observerFunction<T>, deps: DependencyList, defaultValue?: T | null
): [T | null, any, boolean, undefined] {
    const response = useObservable(
        observableGenerator,
        deps,
        defaultValue
    );

    const [, error] = response;
    useEffect(
        () => {
            if (error != undefined) {
                console.error(error)
            }
        },
        [error]
    )

    return response;
}
