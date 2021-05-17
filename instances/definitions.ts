import {ContractDefinition} from "./loader";
import {TStableToken} from "../contracts/stable-token";
import {TExchanger} from "../contracts/exchanger";
import {TOrderBook} from "../contracts/order-book";

export const StableTokenDefinition = new ContractDefinition<TStableToken>(
    "stable-token.sol", "StableToken"
);

export const ExchangerDefinition = new ContractDefinition<TExchanger>(
    "exchanger.sol", "Exchanger"
);

export const OrderBookDefinition = new ContractDefinition<TOrderBook>(
    "order-book.sol", "OrderBook"
)
