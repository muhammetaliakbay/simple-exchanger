import {Contract, EventFilter, BigNumberish, Signer} from "ethers";
import {Provider} from "@ethersproject/abstract-provider";
import {Artifact} from "hardhat/types";

export interface Overrides {
    blockTag?: number,
    value?: BigNumberish
}

export interface PayableOverrides extends Overrides {
    value: BigNumberish
}

export interface ExtendedContract<T extends ExtendedContract<T>> extends Contract {
    connect(signerOrProvider: Signer | Provider | string): T;
    attach(addressOrName: string): T;
}

export interface ExtendedArtifact<T extends ExtendedContract<T>> extends Artifact {
}

export interface ExtendedEventFilter<E> extends EventFilter {
}
