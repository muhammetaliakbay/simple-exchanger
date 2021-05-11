pragma solidity ^0.8.0;

import "./order.sol";
import "./stable-token.sol";

contract OrderBook {
    using Order for Order.List;

    StableToken public stableToken;
    uint8 public precision;
    uint public divider;

    Order.List buyers;
    Order.List sellers;
    uint private buyersBalance;
    uint private sellersVolume;

    struct Stats {
        uint buyersBalance;
        uint sellersVolume;
    }

    enum OrderType {
        Buy, Sell
    }
    enum UpdateType {
        Match, PartialMatch, Cancel
    }

    event OrderUpdate(
        uint indexed orderId,
        OrderType indexed orderType,
        UpdateType updateType
    );
    event OrderAdd(
        uint indexed orderId,
        OrderType indexed orderType,
        uint index
    );

    constructor(StableToken _stableToken, uint8 _precision) {
        stableToken = _stableToken;
        precision = _precision;
        divider = 10 ** _precision;
    }

    function getStats() external view returns(Stats memory stats) {
        stats.sellersVolume = sellersVolume;
        stats.buyersBalance = buyersBalance;
    }

    function getOrder(uint id, OrderType orderType) external view returns(Order.Entry memory entry) {
        if (orderType == OrderType.Sell) {
            entry = sellers.getEntry(id);
        } else {
            entry = buyers.getEntry(id);
        }
    }

    function getAllOrders(OrderType orderType) external view returns(Order.EntryWithId[] memory entries) {
        if (orderType == OrderType.Sell) {
            entries = sellers.all();
        } else {
            entries = buyers.all();
        }
    }

    function putSellOrder(uint price) public payable {
        require(msg.value != 0);
        require(price != 0);

        uint volume = msg.value;

        address payable sender = payable(msg.sender);

        while (true) {
            Order.Matching memory matching = buyers.matchBuyOrder(volume, price, divider);
            if (matching.found) {
                stableToken.transferLocked(matching.account, sender, matching.cost);
                matching.account.transfer(matching.volume);
                buyersBalance -= matching.cost;

                if (matching.removed && matching.balanceLeft > 0) {
                    stableToken.unlock(matching.account, matching.balanceLeft);
                    buyersBalance -= matching.balanceLeft;
                }

                emit OrderUpdate(
                    matching.id,
                    OrderType.Buy,
                    matching.removed ? UpdateType.Match : UpdateType.PartialMatch
                );

                volume = matching.volumeLeft;

                if (matching.more) {
                    continue;
                }
            }
            break;
        }

        if (volume > 0) {
            uint id;
            uint index;
            (id, index) = sellers.putOrder(sender, volume, price, Order.Kind.Buy);
            sellersVolume += volume;

            emit OrderAdd(
                id,
                OrderType.Sell,
                index
            );
        }
    }

    function putBuyOrder(uint balance, uint price) public {
        require(balance != 0, "balance must not be zero");
        require(price != 0, "price must not be zero");

        address payable sender = payable(msg.sender);
        stableToken.lock(sender, balance);

        while (true) {
            Order.Matching memory matching = sellers.matchSellOrder(balance, price, divider);
            if (matching.found) {
                stableToken.transferLocked(sender, matching.account, matching.cost);
                sender.transfer(matching.volume);
                sellersVolume -= matching.volume;

                if (matching.removed && matching.volumeLeft > 0) {
                    matching.account.transfer(matching.volumeLeft);
                    sellersVolume -= matching.volumeLeft;
                }

                emit OrderUpdate(
                    matching.id,
                    OrderType.Sell,
                    matching.removed ? UpdateType.Match : UpdateType.PartialMatch
                );

                balance = matching.balanceLeft;

                if (matching.more) {
                    continue;
                }
            }
            break;
        }

        if (balance > 0) {
            uint id;
            uint index;
            (id, index) = buyers.putOrder(sender, balance, price, Order.Kind.Sell);
            buyersBalance += balance;

            emit OrderAdd(
                id,
                OrderType.Buy,
                index
            );
        }
    }

    function cancelSellOrder(uint id) public {
        uint volume;
        uint price;
        (volume, price) = sellers.removeOrder(id, msg.sender);

        payable(msg.sender).transfer(volume);
        sellersVolume -= volume;

        emit OrderUpdate(
            id,
            OrderType.Sell,
            UpdateType.Cancel
        );
    }

    function cancelBuyOrder(uint id) public {
        uint balance;
        uint price;
        (balance, price) = buyers.removeOrder(id, msg.sender);

        stableToken.unlock(msg.sender, balance);
        buyersBalance -= balance;

        emit OrderUpdate(
            id,
            OrderType.Buy,
            UpdateType.Cancel
        );
    }
}
