pragma solidity ^0.8.0;

library Sorted {
    uint constant public NULL_ID = 0;

    struct Entry {
        bool valid;
        uint rank;
        uint nextId;
        uint prevId;
    }

    struct List {
        uint firstId;
        uint length;
        uint idCounter;
        mapping(uint => Entry) entryMap;
    }

    function getEntry(List storage list, uint id) private view returns (Entry storage entry) {
        entry = list.entryMap[id];
        require(entry.valid, "invalid entry");
    }

    function setEntry(List storage list, uint id, Entry memory entry) private{
        list.entryMap[id] = entry;
    }

    function deleteEntry(List storage list, uint id) private {
        delete list.entryMap[id];
    }

    function getNextId(List storage list, uint id) public view returns (uint nextId) {
        return getEntry(list, id).nextId;
    }

    function removeFirst(List storage list) public returns (uint id) {
        id = list.firstId;
        require(id != NULL_ID, "empty list");

        uint nextId = getNextId(list, id);
        if (nextId != NULL_ID) {
            Entry storage next = getEntry(list, nextId);
            next.prevId = NULL_ID;
        }

        list.firstId = nextId;
        deleteEntry(list, id);

        list.length --;

        return id;
    }

    function remove(List storage list, uint id) public {
        Entry storage entry = getEntry(list, id);
        require(entry.valid, "not valid entry to remove");

        uint nextId = entry.nextId;

        uint prevId = entry.prevId;
        if (prevId != NULL_ID) {
            Entry storage prev = getEntry(list, prevId);
            prev.nextId = nextId;
        } else {
            require(list.firstId == id, "broken entry");
            list.firstId = nextId;
        }

        if (nextId != NULL_ID) {
            Entry storage next = getEntry(list, nextId);
            next.prevId = prevId;
        }

        deleteEntry(list, id);

        list.length --;
    }

    function at(List storage list, uint atOffset) public view returns (uint id) {
        require(list.length > atOffset, "index out of bounds");

        id = list.firstId;
        for (uint offset = 0; offset < atOffset; offset ++) {
            id = getNextId(list, id);
        }
    }

    function removeAt(List storage list, uint offset) public returns (uint id) {
        id = at(list, offset);
        remove(list, id);
    }

    function insertAfter(List storage list, uint rank, uint prevId) private returns (uint id) {
        id = ++ list.idCounter;

        Entry memory entry;
        entry.rank = rank;
        entry.valid = true;

        if (prevId == NULL_ID) {
            entry.nextId = list.firstId;
            list.firstId = id;
        } else {
            Entry storage prev = getEntry(list, prevId);
            uint nextId = prev.nextId;

            if (nextId != NULL_ID) {
                Entry storage next = getEntry(list, nextId);
                next.prevId = id;
            }

            entry.nextId = nextId;
            entry.prevId = prevId;
            prev.nextId = id;
        }

        setEntry(list, id, entry);

        list.length ++;
    }

    function locate(List storage list, uint rank, bool asc) private view returns (uint prevId, uint index) {
        prevId = NULL_ID;
        uint anchorId = list.firstId;
        index = 0;

        while(anchorId != NULL_ID) {
            Entry storage anchor = getEntry(list, anchorId);
            if ((asc && rank < anchor.rank) || (!asc && rank > anchor.rank)) {
                break;
            }
            index ++;
            prevId = anchorId;
            anchorId = anchor.nextId;
        }
    }

    function insert(List storage list, uint rank, bool asc) public returns (uint id, uint index) {
        uint prevId;
        (prevId, index) = locate(list, rank, asc);
        id = insertAfter(list, rank, prevId);
    }
}
