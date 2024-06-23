// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20MockUp is ERC20 {
    constructor() payable ERC20("Axium", "AXM") {}

    function mint(address receiver, uint256 amount) external {
        _mint(receiver, amount);
    }
}
