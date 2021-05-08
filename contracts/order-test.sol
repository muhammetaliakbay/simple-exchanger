pragma solidity ^0.8.0;

import "./order.sol";

contract OrderTest {
    using Order for Order.List;

    Order.List buyers;
    Order.List sellers;

    function allBuyers() public view returns (Order.Entry[] memory) {
        return buyers.all();
    }

    function allSellers() public view returns (Order.Entry[] memory) {
        return sellers.all();
    }

    function putBuyOrder(address payable account, uint volume, uint price) public {
        buyers.putOrder(account, volume, price, Order.Kind.Buy);
    }

    function putSellOrder(address payable account, uint volume, uint price) public {
        sellers.putOrder(account, volume, price, Order.Kind.Sell);
    }

    Order.Matching public matching;
    function matchBuyOrder(uint volume, uint price) public {
        matching = buyers.matchBuyOrder(volume, price);
    }
    function matchSellOrder(uint volume, uint price) public {
        matching = buyers.matchSellOrder(volume, price);
    }
}
