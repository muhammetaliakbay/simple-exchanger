## Current Deployment

Single page app is deployed at GithubPages:

* https://simple-exchanger.muhammetaliakbay.com/
* https://muhammetaliakbay.github.io/simple-exchanger/

You may test it in **Ropsten** chain. Official Exchanger is deployed at: **official.simple-exchanger.eth**

## Structure Overview

![structure.drawio](./docs/structure.drawio.svg)

## Components

There are 3 main contracts and 2 libraries implemented in solidity.

### Sorted (Library)

It is a simple linked list implementation with pre sorted insert feature. Every entries in it holds a value named "rank" to make them possible to be sorted at the insert time.

### Order (Library)

This library is the backbone of the project. The logic behind matching buy/sell orders is implemented in Order library. It can insert, remove, match and list orders. And, it uses Sorted library for storing buy/sell orders in correct order. Rank value of Sorted.List entries is going to be the price of the order.

### StableToken (Contract)

This contract is very similar with **ERC20** tokens (but they are not compliant), so it is also possible to modify the logic to support ERC20 tokens future. This tokens are used by exchanger's order book to lock/unlock and transfer the balance between buyers and sellers. Also, these tokens are controlled by the managers that registered addresses in the contract. Managers can be wallet addresses and other contracts as well. In the main idea, there will be a manager which checks the real bank accounts to mint/burn these tokens to/from accounts of exchanger's customers.

### OrderBook (Contract)

The contract which takes the put buy/sell order and cancel order requests is OrderBook contract. It uses Order library internally to add, match and remove orders. It also takes the payments, locks/unlocks and transfers them after matched, partially matched or cancelled orders.

### Exchanger (Contract)

This contract is only for providing a safe way to list trusted stable token and order-book instances. Exchanger app also takes **ENS** names as Exchanger contract addresses and resolved them if provided one. Using ENS is the preferred way to support updating/redeploying Exchanger contracts without using **proxy contracts**.