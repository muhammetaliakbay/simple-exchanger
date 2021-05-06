pragma solidity ^0.8.0;

import "./sorted.sol";

contract SortedTest {
    using Sorted for Sorted.List;

    Sorted.List list;
    mapping(uint => string) valueMapping;

    function length() public view returns (uint) {
        return list.length;
    }

    function getValue(uint id) private view returns (string memory) {
        return valueMapping[id];
    }
    function setValue(uint id, string memory value) private {
        valueMapping[id] = value;
    }
    function deleteValue(uint id) private {
        delete valueMapping[id];
    }

    function all() public view returns (string[] memory values) {
        values = new string[](list.length);
        uint id = list.firstId;
        for (uint offset = 0; id != Sorted.NULL_ID; offset ++) {
            values[offset] = getValue(id);
            id = list.getNextId(id);
        }
    }

    function insert(uint rank, string memory value, bool asc) public {
        uint id = list.insert(rank, asc);
        setValue(id, value);
    }

    function removeFirst() public {
        uint id = list.removeFirst();
        deleteValue(id);
    }

    function removeAt(uint offset) public {
        uint id = list.removeAt(offset);
        deleteValue(id);
    }

    function at(uint offset) public view returns (string memory) {
        uint id;
        (id, ) = list.at(offset);
        return getValue(id);
    }
}
