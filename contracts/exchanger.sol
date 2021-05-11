pragma solidity ^0.8.0;

import "./order-book.sol";
import "./stable-token.sol";

contract Exchanger {

    OrderBook[] public orderBooks;
    StableToken[] public stableTokens;

    address public admin;
    address[] public managers;

    constructor() {
        admin = msg.sender;
    }

    modifier isAdmin() {
        require(msg.sender == admin, "sender is not the admin");
        _;
    }
    modifier isManager() {
        if (msg.sender != admin) {
            bool found = false;
            for (uint i = 0; i < managers.length; i ++) {
                if (managers[i] == msg.sender) {
                    found = true;
                    break;
                }
            }
            require(found, "sender is not a manager");
        }
        _;
    }

    function addManager(address newManager) isAdmin external {
        managers.push(newManager);
    }

    function registerStableToken(StableToken stableToken) isManager external {
        stableTokens.push(stableToken);
    }
    function registerOrderBook(OrderBook orderBook) isManager external {
        orderBooks.push(orderBook);
        stableTokens.push(orderBook.stableToken());
    }

    function totalStableTokens() view external returns (uint) {
        return stableTokens.length;
    }

    function totalOrderBooks() view external returns (uint) {
        return orderBooks.length;
    }
}
