import {Contract} from "ethers";

export interface SortedTest extends Contract {
    length(): Promise<number>
    all(): Promise<string[]>
    insert(rank: number, value: string, asc: boolean): Promise<void>
    removeFirst(): Promise<void>
    removeAt(offset: number): Promise<void>
}