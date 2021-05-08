pragma solidity ^0.8.0;

import "./order.sol";
import "./stable-token.sol";

contract OrderBook {
    using Order for Order.List;

    Order.List buyers;
    Order.List sellers;
    StableToken stableToken;

    constructor(StableToken _stableToken) {
        stableToken = _stableToken;
    }

    function putSellOrder(uint price) public payable {
        address payable sender = payable(msg.sender);
        uint volume = msg.value;

        while (true) {
            Order.Matching memory matching = sellers.matchBuyOrder(volume, price);
            if (matching.found) {
                stableToken.transferLocked(matching.account, sender, matching.cost);
                matching.account.transfer(matching.volume);

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
                sender.transfer(matching.volume);

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
}
