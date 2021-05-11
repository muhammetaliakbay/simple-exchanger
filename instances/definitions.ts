import {ContractDefinition} from "./loader";
import {StableToken} from "../contracts/stable-token";
import {Exchanger} from "../contracts/exchanger";
import {OrderBook} from "../contracts/order-book";

export const StableTokenDefinition = new ContractDefinition<StableToken>(
    "stable-token.sol", "StableToken"
);

export const ExchangerDefinition = new ContractDefinition<Exchanger>(
    "exchanger.sol", "Exchanger"
);

export const OrderBookDefinition = new ContractDefinition<OrderBook>(
    "order-book.sol", "OrderBook"
)
