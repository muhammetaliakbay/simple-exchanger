pragma solidity ^0.8.0;

import "./sorted.sol";


library Order {
    enum Kind { Buy, Sell }

    struct Matching {
        bool found;
        bool more;
        address payable account;
        uint volume;
        uint cost;
        uint sellerVolumeLeft;
        uint buyerVolumeLeft;
    }

    struct Entry {
        address payable account;
        uint volume;
        uint price;
    }
    struct List {
        Sorted.List sortedList;
        mapping(uint => Entry) entryMap;
    }

    using Sorted for Sorted.List;

    function all(List storage list) public view returns (Entry[] memory entries) {
        Sorted.List storage sortedList = list.sortedList;
        entries = new Entry[](sortedList.length);
        uint id = sortedList.firstId;
        for (uint offset = 0; id != Sorted.NULL_ID; offset ++) {
            entries[offset] = getEntry(list, id);
            id = sortedList.getNextId(id);
        }
    }

    function getEntry(List storage list, uint id) private view returns (Entry storage) {
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

    function min(uint a, uint b) private pure returns (uint) {
        return a < b ? a : b;
    }

    function matchBuyOrder(List storage list, uint sellerVolume, uint sellerPrice) public returns (Matching memory matching) {
        require(sellerVolume > 0);
        uint sellerVolumeLeft = sellerVolume;

        Sorted.List storage sortedList = list.sortedList;
        uint length = sortedList.length;
        if (length > 0) {
            Entry storage buyer = getEntry(list, sortedList.firstId);
            uint buyerPrice = buyer.price;

            if (buyerPrice >= sellerPrice) {
                uint buyerVolume = buyer.volume;
                uint volume = min(buyerVolume, sellerVolume);
                uint cost = volume * buyerPrice;

                uint buyerVolumeLeft = buyerVolume - volume;
                sellerVolumeLeft -= volume;

                if (buyerVolumeLeft == 0) {
                    deleteEntry(list, sortedList.removeFirst());
                } else {
                    buyer.volume = buyerVolumeLeft;
                }

                sellerVolume -= sellerVolumeLeft;

                matching.found = true;
                matching.account = buyer.account;
                matching.more = sellerVolumeLeft > 0 && length > 1;
                matching.cost = cost;
                matching.volume = volume;
                matching.buyerVolumeLeft = buyerVolumeLeft;
                matching.sellerVolumeLeft = sellerVolumeLeft;
                return matching;
            }
        }

        matching.found = false;
        matching.sellerVolumeLeft = sellerVolumeLeft;
    }

    function matchSellOrder(List storage list, uint buyerVolume, uint buyerPrice) public returns (Matching memory matching) {
        require(buyerVolume > 0);
        uint buyerVolumeLeft = buyerVolume;

        Sorted.List storage sortedList = list.sortedList;
        uint length = sortedList.length;
        if (length > 0) {
            Entry storage seller = getEntry(list, sortedList.firstId);
            uint sellerPrice = seller.price;

            if (buyerPrice >= sellerPrice) {
                uint sellerVolume = seller.volume;
                uint volume = min(buyerVolume, sellerVolume);
                uint cost = volume * buyerPrice;

                buyerVolumeLeft -= volume;
                uint sellerVolumeLeft = sellerVolume - volume;

                if (sellerVolumeLeft == 0) {
                    deleteEntry(list, sortedList.removeFirst());
                } else {
                    seller.volume = sellerVolumeLeft;
                }

                matching.found = true;
                matching.account = seller.account;
                matching.more = buyerVolumeLeft > 0 && length > 1;
                matching.cost = cost;
                matching.volume = volume;
                matching.buyerVolumeLeft = buyerVolumeLeft;
                matching.sellerVolumeLeft = sellerVolumeLeft;
                return matching;
            }
        }

        matching.found = false;
        matching.buyerVolumeLeft = buyerVolumeLeft;
    }

    function putOrder(List storage list, address payable account, uint volume, uint price, Kind kind) public {
        uint id = list.sortedList.insert(price, kind == Kind.Buy);

        Entry memory entry;
        entry.account = account;
        entry.volume = volume;
        entry.price = price;

        setEntry(list, id, entry);
    }
}
