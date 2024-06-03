// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Axium (HVR) ERC-20 Token
 * @author 0xCR6 - Axium Haven
 */
contract Axium is ERC20 {
    /**
     * @dev Initializes the Axium ERC-20 contract with the total supply.
     * @param manager The address of the manager.
     * @param vester The address of the vester contract.
     * @notice The maximum token supply is set to 20 million tokens.
     */
    constructor(address manager, address vester) payable ERC20("Axium", "AXM") {
        _mint(manager, 19000000 * 10 ** decimals());
        _mint(vester, 1000000 * 10 ** decimals());
    }
}
