pragma solidity ^0.8.0;

import "./sorted.sol";


library Order {
    enum Kind { Buy, Sell }

    struct Matching {
        bool found;
        bool more;
        bool removed;
        uint id;
        address payable account;
        uint price;
        uint volume;
        uint cost;
        uint volumeLeft;
        uint balanceLeft;
    }

    struct Entry {
        address payable account;
        uint amount;
        uint price;
    }
    struct EntryWithId {
        uint id;
        Entry entry;
    }
    struct List {
        Sorted.List sortedList;
        mapping(uint => Entry) entryMap;
    }

    using Sorted for Sorted.List;

    function all(List storage list) public view returns (EntryWithId[] memory entries) {
        Sorted.List storage sortedList = list.sortedList;
        entries = new EntryWithId[](sortedList.length);
        uint id = sortedList.firstId;
        for (uint offset = 0; id != Sorted.NULL_ID; offset ++) {
            entries[offset].id = id;
            entries[offset].entry = getEntry(list, id);
            id = sortedList.getNextId(id);
        }
    }

    function getEntry(List storage list, uint id) public view returns (Entry storage) {
        return list.entryMap[id];
    }
    function setEntry(List storage list, uint id, Entry memory entry) private {
        list.entryMap[id] = entry;
    }
    function deleteEntry(List storage list, uint id) private {
        delete list.entryMap[id];
    }

    function getFirst(List storage list) private view returns (Entry storage) {
        uint firstId = list.sortedList.firstId;
        return getEntry(list, firstId);
    }

    function removeFirst(List storage list) private {
        uint id = list.sortedList.removeFirst();
        deleteEntry(list, id);
    }

    function removeExtraBalance(uint balance, uint price, uint divider) internal pure returns(uint availableVolume, uint availableCost) {
        availableVolume = (balance * divider) / price;
        availableCost = (availableVolume * price) / divider;
    }

    function removeExtraVolume(uint volume, uint price, uint divider) internal pure returns(uint availableVolume, uint availableCost) {
        availableCost = (volume * price) / divider;
        availableVolume = (availableCost * divider) / price;
    }

    function minAvailable(uint buyerBalance, uint sellerVolume, uint price, uint divider) internal pure returns(uint volume, uint cost) {
        uint buyerCost;
        uint sellerCost;
        uint buyerVolume;
        (buyerVolume, buyerCost) = removeExtraBalance(buyerBalance, price, divider);
        (sellerVolume, sellerCost) = removeExtraVolume(sellerVolume, price, divider);
        if (buyerVolume <= sellerVolume) {
            volume = buyerVolume;
            cost = buyerCost;
        } else {
            volume = sellerVolume;
            cost = sellerCost;
        }
    }

    function bestOption(uint buyerBalance, uint sellerVolume, uint buyerPrice, uint sellerPrice, uint divider) internal pure returns(uint volume, uint cost, uint price) {
        uint volumeA;
        uint volumeB;
        uint costA;
        uint costB;
        (volumeA, costA) = minAvailable(buyerBalance, sellerVolume, buyerPrice, divider);
        (volumeB, costB) = minAvailable(buyerBalance, sellerVolume, sellerPrice, divider);
        if (volumeA >= volumeB) {
            volume = volumeA;
            cost = costA;
            price = buyerPrice;
        } else {
            volume = volumeB;
            cost = costB;
            price = sellerPrice;
        }

        require(cost <= buyerBalance, "cost > buyer's balance");
        require(volume <= sellerVolume, "volume > seller's volume");
        require(price <= buyerPrice, "price > buyer's price");
        require(price >= sellerPrice, "price < seller's price");
    }

    function matchBuyOrder(List storage list, uint sellerVolume, uint sellerPrice, uint divider) public returns (Matching memory matching) {
        require(sellerVolume > 0, "seller volume must be > 0");

        Sorted.List storage sortedList = list.sortedList;
        uint length = sortedList.length;
        if (length > 0) {
            uint firstId = sortedList.firstId;
            Entry storage buyer = getEntry(list, firstId);
            uint buyerPrice = buyer.price;

            if (buyerPrice >= sellerPrice) {
                uint buyerBalance = buyer.amount;
                uint volume;
                uint cost;
                uint price;
                (volume, cost, price) = bestOption(buyerBalance, sellerVolume, buyerPrice, sellerPrice, divider);

                buyerBalance -= cost;
                sellerVolume -= volume;

                matching.account = buyer.account;
                if (buyerBalance * price <= sellerVolume) {
                    deleteEntry(list, sortedList.removeFirst());
                    matching.removed = true;
                } else {
                    buyer.amount = buyerBalance;
                }

                matching.id = firstId;
                matching.found = true;
                matching.price = price;
                matching.more = matching.removed && sellerVolume > 0 && length > 1;
                matching.cost = cost;
                matching.volume = volume;
                matching.balanceLeft = buyerBalance;
                matching.volumeLeft = sellerVolume;
                return matching;
            }
        }

        matching.found = false;
        matching.volumeLeft = sellerVolume;
    }

    function matchSellOrder(List storage list, uint buyerBalance, uint buyerPrice, uint divider) public returns (Matching memory matching) {
        require(buyerBalance > 0, "buyer balance must be > 0");

        Sorted.List storage sortedList = list.sortedList;
        uint length = sortedList.length;
        if (length > 0) {
            uint firstId = sortedList.firstId;
            Entry storage seller = getEntry(list, firstId);
            uint sellerPrice = seller.price;

            if (buyerPrice >= sellerPrice) {
                uint sellerVolume = seller.amount;
                uint volume;
                uint cost;
                uint price;
                (volume, cost, price) = bestOption(buyerBalance, sellerVolume, buyerPrice, sellerPrice, divider);

                sellerVolume -= volume;
                buyerBalance -= cost;

                matching.account = seller.account;
                if (buyerBalance * price >= sellerVolume) {
                    deleteEntry(list, sortedList.removeFirst());
                    matching.removed = true;
                } else {
                    seller.amount = sellerVolume;
                }

                matching.id = firstId;
                matching.found = true;
                matching.price = price;
                matching.more = matching.removed && buyerBalance > 0 && length > 1;
                matching.cost = cost;
                matching.volume = volume;
                matching.balanceLeft = buyerBalance;
                matching.volumeLeft = sellerVolume;
                return matching;
            }
        }

        matching.found = false;
        matching.balanceLeft = buyerBalance;
    }

    function putOrder(List storage list, address payable account, uint amount, uint price, Kind kind) public returns (uint id, uint index) {
        (id, index) = list.sortedList.insert(price, kind == Kind.Buy);

        Entry memory entry;
        entry.account = account;
        entry.amount = amount;
        entry.price = price;

        setEntry(list, id, entry);
    }

    function removeOrder(List storage list, uint id, address account) public returns (uint amount, uint price) {
        Entry memory order = getEntry(list, id);
        require(order.account == account, "not owned order");

        amount = order.amount;
        price = order.price;

        list.sortedList.remove(id);
        deleteEntry(list, id);
    }
}
