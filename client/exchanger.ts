import {BaseClient} from "./base-client";
import {ExchangerDefinition} from "../instances/definitions";
import {TExchanger} from "../contracts/exchanger";
import {StableTokenClient} from "./stable-token";
import {collectArray} from "./array-util";
import {OrderBookClient} from "./order-book";

export class ExchangerClient {
    readonly contract: TExchanger;
    constructor(
        private baseClient: BaseClient,
        contract: TExchanger | string
    ) {
        if (typeof contract == "string") {
            contract = ExchangerDefinition.loadContract(contract).connect(baseClient.provider.provider)
        }
        this.contract = contract;
    }

    private stableTokens$: Promise<string[]> | null = null;
    async getStableTokenAddresses(): Promise<string[]> {
        return await (this.stableTokens$ ??= collectArray(
            this.contract.totalStableTokens(),
            index => this.contract.stableTokens(index)
        ))
    }

    async getStableTokens(): Promise<StableTokenClient[]> {
        return (await this.getStableTokenAddresses()).map(
            address => this.baseClient.getStableTokenClient(address)
        )
    }

    async getStableToken(currencyCode: string): Promise<StableTokenClient | null> {
        const tokens = await this.getStableTokens();
        const tokensAndCurrencies = await Promise.all(
            tokens.map(
                token => token.getCurrency().then(
                    currency => [currency, token] as const
                )
            )
        )
        return tokensAndCurrencies.find(
            ([c]) => c.code === currencyCode
        )?.[1] ?? null
    }

    async getOrderBook(stableToken: StableTokenClient): Promise<OrderBookClient | null> {
        const orderBooks = await this.getOrderBooks();
        const orderBooksAndTokens = await Promise.all(
            orderBooks.map(
                orderBook => orderBook.getStableToken().then(
                    token => [token, orderBook] as const
                )
            )
        )
        return orderBooksAndTokens.find(
            ([t]) => t.getContractAddress() === stableToken.getContractAddress()
        )?.[1] ?? null
    }

    private orderBooks$: Promise<string[]> | null = null;
    async getOrderBookAddresses(): Promise<string[]> {
        return await (this.orderBooks$ ??= collectArray(
            this.contract.totalOrderBooks(),
            index => this.contract.orderBooks(index)
        ))
    }

    async getOrderBooks(): Promise<OrderBookClient[]> {
        return (await this.getOrderBookAddresses()).map(
            address => this.baseClient.getOrderBookClient(address)
        )
    }
}
