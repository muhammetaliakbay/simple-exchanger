pragma solidity ^0.8.0;

import "./order.sol";

contract OrderTest {
    using Order for Order.List;

    uint8 public precision;
    uint public divider;
    constructor(uint8 _precision) {
        precision = _precision;
        divider = 10 ** _precision;
    }

    Order.List buyers;
    Order.List sellers;

    function allBuyers() public view returns (Order.EntryWithId[] memory) {
        return buyers.all();
    }

    function allSellers() public view returns (Order.EntryWithId[] memory) {
        return sellers.all();
    }

    function putBuyOrder(address payable account, uint balance, uint price) public {
        buyers.putOrder(account, balance, price, Order.Kind.Buy);
    }

    function putSellOrder(address payable account, uint volume, uint price) public {
        sellers.putOrder(account, volume, price, Order.Kind.Sell);
    }

    function removeBuyOrder(address payable account, uint id) public {
        buyers.removeOrder(id, account);
    }

    function removeSellOrder(address payable account, uint id) public {
        sellers.removeOrder(id, account);
    }

    Order.Matching public matching;
    function matchBuyOrder(uint balance, uint price) public {
        matching = buyers.matchBuyOrder(balance, price, divider);
    }
    function matchSellOrder(uint volume, uint price) public {
        matching = buyers.matchSellOrder(volume, price, divider);
    }
}
