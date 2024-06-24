// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Axiom (AXM) ERC-20 Token
 * @dev This contract extends the OpenZeppelin ERC20 implementation to customize token deployment.
 * @author Axiom
 */
contract Axiom is ERC20 {
    /**
     * @dev Initializes the Axiom ERC-20 contract with the initial token allocations.
     * @param receiver Array of receivers contract addresses.
     * @param amounts Array of corresponding amounts to mint to each receiver.
     */
    constructor(
        address[] memory receiver,
        uint256[] memory amounts
    ) payable ERC20("Axiom", "AXM") {
        require(
            receiver.length == amounts.length,
            "Axiom: Arrays length mismatch"
        );

        for (uint256 i = 0; i < receiver.length; i++) {
            require(
                receiver[i] != address(0),
                "Axiom: Receiver cannot be zero"
            );
            _mint(receiver[i], amounts[i]);
        }
    }
}
