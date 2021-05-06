pragma solidity ^0.8.0;

library Sorted {
    uint constant public NULL_ID = 0;

    struct Entry {
        bool valid;
        uint rank;
        uint nextId;
    }

    struct List {
        uint firstId;
        uint length;
        uint idCounter;
        mapping(uint => Entry) entryMap;
    }

    function getEntry(List storage list, uint id) private view returns (Entry storage entry) {
        entry = list.entryMap[id];
        require(entry.valid);
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
        require(id != NULL_ID);

        list.firstId = getNextId(list, id);
        deleteEntry(list, id);

        list.length --;

        return id;
    }

    function remove(List storage list, uint id, uint prevId) public {
        if (prevId == NULL_ID) {
            require(list.firstId == id);
        } else {
            require(getNextId(list, prevId) == id);
        }

        uint nextId = getNextId(list, id);

        if (prevId != NULL_ID) {
            Entry storage prev = getEntry(list, prevId);
            prev.nextId = nextId;
        } else {
            list.firstId = nextId;
        }

        deleteEntry(list, id);

        list.length --;
    }

    function at(List storage list, uint atOffset) public view returns (uint id, uint prevId) {
        require(list.length > atOffset);

        prevId = 0;
        id = list.firstId;
        for (uint offset = 0; offset < atOffset; offset ++) {
            prevId = id;
            id = getNextId(list, id);
        }
    }

    function removeAt(List storage list, uint offset) public returns (uint id) {
        uint prevId;
        (id, prevId) = at(list, offset);
        remove(list, id, prevId);
        return id;
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
            entry.nextId = prev.nextId;
            prev.nextId = id;
        }

        setEntry(list, id, entry);

        list.length ++;
    }

    function locate(List storage list, uint rank, bool asc) private view returns (uint prevId) {
        prevId = NULL_ID;
        uint anchorId = list.firstId;

        while(anchorId != NULL_ID) {
            Entry storage anchor = getEntry(list, anchorId);
            if ((asc && rank < anchor.rank) || (!asc && rank > anchor.rank)) {
                break;
            }
            prevId = anchorId;
            anchorId = anchor.nextId;
        }
    }

    function insert(List storage list, uint rank, bool asc) public returns (uint id) {
        uint prevId = locate(list, rank, asc);
        return insertAfter(list, rank, prevId);
    }
}
