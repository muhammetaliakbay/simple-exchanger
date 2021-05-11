pragma solidity ^0.8.0;

contract StableToken {

    address public admin;
    address[] public managers;

    mapping(address => uint256) balances;
    mapping(address => uint256) lockedBalances;

    string public code;
    uint8 public precision;

    constructor(string memory _code, uint8 _precision) {
        admin = msg.sender;
        code = _code;
        precision = _precision;
    }

    function getCurrency() public view returns (Currency memory currency) {
        currency.code = code;
        currency.precision = precision;
    }

    function getManager() private view returns (address manager) {
        return msg.sender;
    }

    modifier isAdmin() {
        require(msg.sender == admin, "not an admin");
        _;
    }
    modifier isManager() {
        if (msg.sender != admin) {
            bool found = false;
            for (uint i = 0; i < managers.length; i ++) {
                if (managers[i] == msg.sender) {
                    found = true;
                    break;
                }
            }
            require(found, "not a manager");
        }
        _;
    }

    function addManager(address newManager) isAdmin external {
        managers.push(newManager);
    }

    function mint(address to, uint256 amount) isManager external {
        balances[to] += amount;
    }

    function burn(address from, uint256 amount) isManager external {
        balances[from] -= amount;
    }

    function transfer(address from, address to, uint256 amount) isManager external {
        balances[from] -= amount;
        balances[to] += amount;
    }

    function transferLocked(address from, address to, uint256 amount) isManager external {
        lockedBalances[from] -= amount;
        balances[to] += amount;
    }

    function lock(address from, uint256 amount) isManager external {
        balances[from] -= amount;
        lockedBalances[from] += amount;
    }

    function unlock(address to, uint256 amount) isManager external {
        lockedBalances[to] -= amount;
        balances[to] += amount;
    }
}
