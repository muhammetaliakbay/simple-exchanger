// COPY FROM https://github.com/bjoerge/rxjs-exhaustmap-with-trailing#readme

import {defer, from, Observable, ObservableInput, OperatorFunction, Subject} from "rxjs";
import {exhaustMap, finalize, throttle} from "rxjs/operators";

export function exhaustMapWithTrailing<T, R>(
    project: (value: T, index: number) => ObservableInput<R>
): OperatorFunction<T, R> {
    return (source): Observable<R> =>
        defer(() => {
            const release = new Subject<void>()
            return source.pipe(
                throttle(() => release, {
                    leading: true,
                    trailing: true,
                }),
                exhaustMap((value, index) =>
                    from(project(value, index)).pipe(
                        finalize(() => {
                            release.next()
                        })
                    )
                )
            )
        })
}
