// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Vester - Vesting Contract
 * @dev A contract for distributing vested tokens over a period of time.
 * @author 0xCR6 - Harvest Haven
 */
contract Vester {
    uint256 public constant totalLocked = 1000000 ether; // Total amount of tokens to be vested
    uint256 public constant vestingPeriod = 5; // 5 months vesting period
    uint256 public constant vestingInterval = 30 days; // 30 days per interval
    uint256 public vestingsClaimed = 0; // Amount of vestings claimed
    address public immutable owner; // Owner of the contract
    uint256[] public vestingSchedule = [
        0,
        1710284400, // Example: March 13, 2024, 00:00:00 GMT+2
        1712959200,
        1715551200,
        1718229600
    ]; // Vesting schedule: Every 13th of each month at 00:00:00 GMT+2

    event Withdrawn(address indexed beneficiary, uint256 amount);

    /**
     * @dev Contract constructor
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Withdraw vested tokens
     * @param _token The address of the ERC-20 token to be withdrawn
     */
    function withdraw(address _token) external {
        require(_token != address(0), "not_valid_address");
        require(msg.sender == owner, "not_owner");
        uint256 withdrawableAmount = totalLocked / vestingPeriod;
        IERC20 token = IERC20(_token);

        require(
            block.timestamp >= vestingSchedule[vestingsClaimed],
            "Vesting period has not started"
        );
        require(
            vestingsClaimed <= vestingSchedule.length,
            "All tokens already withdrawn"
        );

        uint256 currentInterval = vestingSchedule[vestingsClaimed];
        require(
            currentInterval <= block.timestamp,
            "Not enough time has passed"
        );

        require(
            token.balanceOf(address(this)) >= withdrawableAmount,
            "Insufficient balance in the contract"
        );

        vestingsClaimed++;
        token.transfer(owner, withdrawableAmount);
        emit Withdrawn(owner, withdrawableAmount);
    }

    /**
     * @dev Get the remaining locked tokens in the contract
     * @param _token The address of the ERC-20 token
     * @return uint256 The remaining locked tokens
     */
    function remainingLockedTokens(
        address _token
    ) external view returns (uint256) {
        require(_token != address(0), "not_valid_address");
        IERC20 token = IERC20(_token);
        return token.balanceOf(address(this));
    }

    /**
     * @dev Get the timestamp of the next vesting schedule
     * @return uint256 The timestamp of the next vesting schedule
     */
    function nextVesting() external view returns (uint256) {
        return vestingSchedule[vestingsClaimed];
    }
}
