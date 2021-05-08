pragma solidity ^0.8.0;

import "./order.sol";
import "./stable-token.sol";

contract OrderBook {
    using Order for Order.List;

    Order.List buyers;
    Order.List sellers;
    StableToken stableToken;

    uint public multiplier;

    constructor(StableToken _stableToken, uint _multiplier) {
        stableToken = _stableToken;
        multiplier = _multiplier;
    }

    function putSellOrder(uint price) public payable {
        require(msg.value > 0);
        require(msg.value % multiplier == 0);
        uint volume = msg.value / multiplier;

        address payable sender = payable(msg.sender);

        while (true) {
            Order.Matching memory matching = sellers.matchBuyOrder(volume, price);
            if (matching.found) {
                stableToken.transferLocked(matching.account, sender, matching.cost);
                matching.account.transfer(matching.volume * multiplier);

                volume = matching.sellerVolumeLeft;

                if (matching.more) {
                    continue;
                }
            }
            break;
        }

        if (volume > 0) {
            sellers.putOrder(sender, volume, price, Order.Kind.Buy);
        }
    }

    function putBuyOrder(uint volume, uint price) public {
        address payable sender = payable(msg.sender);
        stableToken.lock(sender, volume * price);

        while (true) {
            Order.Matching memory matching = sellers.matchSellOrder(volume, price);
            if (matching.found) {
                stableToken.transferLocked(sender, matching.account, matching.cost);
                sender.transfer(matching.volume * multiplier);

                volume = matching.buyerVolumeLeft;

                if (matching.more) {
                    continue;
                }
            }
            break;
        }

        if (volume > 0) {
            sellers.putOrder(sender, volume, price, Order.Kind.Sell);
        }
    }

    function cancelSellOrder(uint id) public {
        uint volume;
        (volume, ) = sellers.removeOrder(id, msg.sender);

        payable(msg.sender).transfer(volume * multiplier);
    }

    function cancelBuyOrder(uint id) public {
        uint volume;
        uint price;
        (volume, price) = buyers.removeOrder(id, msg.sender);

        stableToken.unlock(msg.sender, volume * price);
    }
}
