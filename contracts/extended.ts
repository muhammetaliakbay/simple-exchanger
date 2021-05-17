import {Contract, EventFilter, BigNumberish, BigNumber} from "ethers";
import {Artifact} from "hardhat/types";
import { Interface } from "ethers/lib/utils";
import {EventFragment, FunctionFragment, Fragment, ParamType} from "@ethersproject/abi";
import {Provider, TransactionResponse} from "@ethersproject/abstract-provider";
import {Signer} from "@ethersproject/abstract-signer";
import {PopulatedTransaction} from "@ethersproject/contracts";

export interface TOverrides {
    from?: string
    blockTag?: number
    value?: BigNumberish
}

export type TParamType<T, NAME extends string = ""> = {
    readonly name: NAME
} & ParamType
export type ExtractType<PARAM> =
    PARAM extends TParamType<infer T, any> ?
        T : never;
export type ExtractTypes<PARAMS extends Tuple<TParamType<any, any>>> =
    {
        [key in keyof PARAMS]: ExtractType<PARAMS[key]>
    } & Tuple<ExtractType<PARAMS[keyof PARAMS]>>;

export type TFragment<NAME extends string, INPUTS extends Tuple<TParamType<any, any>>> = {
    readonly name: NAME
    readonly inputs: INPUTS
} & Fragment

export type TEventFragment<NAME extends string, INPUTS extends Tuple<TParamType<any, any>>> =
    TFragment<NAME, INPUTS> & EventFragment
export type TFunctionFragment<NAME extends string, INPUTS extends Tuple<TParamType<any, any>>, OUTPUTS extends Tuple<TParamType<any, any>> | undefined> = {
    readonly outputs: OUTPUTS
} & TFragment<NAME, INPUTS> & FunctionFragment

export type Tuple<T = any> = readonly [...T[]]

export type TAutoParams<P extends Tuple> = [...{
    [key in keyof P]: TParamType<P[key]>
}];

export type TFunctions = {
    [name: string]: (...args: Tuple) => any
}
export type TEvents = {
    [name: string]: (...args: Tuple) => any
}

export type TDefinition = {
    functions?: TFunctions
    events?: TEvents
}

export type ExtractFunctions<D extends TDefinition> =
    D["functions"] & {};
export type ExtractEvents<D extends TDefinition> =
    D["events"] & {};


export type InterfaceFunctions<F extends TFunctions> =
    {
        [ name in (keyof F) & string ]:
        TFunctionFragment<name, TAutoParams<Parameters<F[name]>>, TAutoParams<ReturnType<F[name]>>>
    }

export type InterfaceEvents<E extends TEvents> =
    {
        [ name in (keyof E) & string ]:
        TEventFragment<name, TAutoParams<Parameters<E[name]>>>
    }

export type TInterface<D extends TDefinition> = {
    readonly functions: InterfaceFunctions<ExtractFunctions<D>>;
    readonly events: InterfaceEvents<ExtractEvents<D>>;
} & Interface;

export type ExecutedType<T> = T extends void ? TransactionResponse : T;
export type ResultType<T> = T extends Tuple ? T : [T];

export type Lazy<T> = T extends BigNumber ? BigNumberish : T;
export type Lazies<T extends Tuple> = [...{
    [key in keyof T]: Lazy<T[key]>
}]
export type Nulls<T extends Tuple> = [...{
    [key in keyof T]: T[key] | null
}]

type AppendOverrides<T extends Tuple> = [...T, TOverrides?];

export type ContractFunctions<F extends TFunctions> =
    {
        [ name in keyof F ]:
        (...args: AppendOverrides<Lazies<Parameters<F[name]>>>) => Promise<ResultType<ReturnType<F[name]>>>
    };
export type ContractProxyFunctions<F extends TFunctions> =
    {
        [ name in keyof F ]:
        (...args: AppendOverrides<Lazies<Parameters<F[name]>>>) => Promise<ExecutedType<ReturnType<F[name]>>>
    };
export type ContractPopulateFunctions<F extends TFunctions> =
    {
        [ name in keyof F ]:
        (...args: AppendOverrides<Lazies<Parameters<F[name]>>>) => Promise<PopulatedTransaction & {to: string}>
    };
export type ContractGasFunctions<F extends TFunctions> =
    {
        [ name in keyof F ]:
        (...args: AppendOverrides<Lazies<Parameters<F[name]>>>) => Promise<BigNumber>
    };
export type ContractFilters<E extends TEvents> =
    {
        [ name in keyof E ]:
        (...args: Nulls<Lazies<Parameters<E[name]>>>) => EventFilter
    };

export interface ChainableContract {
    connect(signerOrProvider: Signer | Provider | string): this;
}

export type TContract<D extends TDefinition> = {
    readonly interface: TInterface<D>
    readonly functions: ContractFunctions<ExtractFunctions<D>>;
} & ContractProxyFunctions<ExtractFunctions<D>> & {
    filters: ContractFilters<ExtractEvents<D>>
} & {
    populateTransaction: ContractPopulateFunctions<ExtractFunctions<D>>
} & {
    estimateGas: ContractGasFunctions<ExtractFunctions<D>>
} & ChainableContract & Contract;

export type TArtifact<D extends TDefinition> =
    Artifact

export type TEventFilter<F extends TEventFragment<any, any>> =
    EventFilter
