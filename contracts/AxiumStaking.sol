// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AxiumStaking
 * @dev A contract that allows users to stake AXM tokens and earn AXM rewards over time.
 */
contract AxiumStaking is Ownable, ReentrancyGuard {
    IERC20 public axmToken;
    uint256 public rewardRatePerSecond;
    uint256 public totalStaked;
    uint256 public lastUpdateTime;
    uint256 public rewardPool;

    mapping(address => uint256) public userStakes;
    mapping(address => uint256) public userRewards;
    mapping(address => uint256) public userLastUpdateTime;

    uint256 private constant PRECISION = 1e18;

    /**
     * @dev Emitted when a user stakes AXM tokens.
     * @param user The address of the user.
     * @param amount The amount of AXM tokens staked.
     */
    event Staked(address indexed user, uint256 amount);

    /**
     * @dev Emitted when a user withdraws staked AXM tokens.
     * @param user The address of the user.
     * @param amount The amount of AXM tokens withdrawn.
     */
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @dev Emitted when a user claims AXM rewards.
     * @param user The address of the user.
     * @param reward The amount of AXM tokens rewarded.
     */
    event RewardPaid(address indexed user, uint256 reward);

    /**
     * @dev Emitted when the owner deposits AXM tokens as rewards.
     * @param amount The amount of AXM tokens deposited.
     */
    event RewardDeposited(uint256 amount);

    /**
     * @dev Emitted when the owner updates the reward rate.
     * @param newRewardRate The new reward rate per second.
     */
    event RewardRateUpdated(uint256 newRewardRate);

    /**
     * @param _axmToken The address of the AXM token contract.
     * @param _rewardRatePerSecond The initial rate of rewards per second.
     */
    constructor(
        IERC20 _axmToken,
        uint256 _rewardRatePerSecond
    ) Ownable(msg.sender) {
        axmToken = _axmToken;
        rewardRatePerSecond = _rewardRatePerSecond;
    }

    /**
     * @dev Modifier to update reward for an account before state changes.
     * @param account The address of the account to update rewards for.
     */
    modifier updateReward(address account) {
        if (account != address(0)) {
            userRewards[account] = earned(account);
            userLastUpdateTime[account] = block.timestamp;
        }
        _;
    }

    /**
     * @dev Calculates the earned rewards for a user.
     * @param account The address of the user.
     * @return The earned rewards for the user.
     */
    function earned(address account) public view returns (uint256) {
        if (userStakes[account] == 0) {
            return userRewards[account];
        }

        uint256 stakedDuration = block.timestamp - userLastUpdateTime[account];
        uint256 reward = (userStakes[account] *
            rewardRatePerSecond *
            stakedDuration) / totalStaked;

        return userRewards[account] + reward;
    }

    /**
     * @dev Allows a user to stake AXM tokens.
     * @param amount The amount of AXM tokens to stake.
     */
    function stake(
        uint256 amount
    ) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        totalStaked += amount;
        userStakes[msg.sender] += amount;
        axmToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Allows a user to withdraw staked AXM tokens.
     * @param amount The amount of AXM tokens to withdraw.
     */
    function withdraw(
        uint256 amount
    ) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(
            userStakes[msg.sender] >= amount,
            "Withdraw amount exceeds balance"
        );
        totalStaked -= amount;
        userStakes[msg.sender] -= amount;
        axmToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Allows a user to claim their earned AXM rewards.
     */
    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = userRewards[msg.sender];
        require(reward > 0, "No reward available");
        require(reward <= rewardPool, "Insufficient rewards in contract");

        userRewards[msg.sender] = 0;
        rewardPool -= reward;
        axmToken.transfer(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }

    /**
     * @dev Allows the owner to deposit AXM tokens as rewards.
     * @param amount The amount of AXM tokens to deposit.
     */
    function depositRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "Cannot deposit 0");
        axmToken.transferFrom(msg.sender, address(this), amount);
        rewardPool += amount;
        emit RewardDeposited(amount);
    }

    /**
     * @dev Allows the owner to update the reward rate per second.
     * @param _rewardRatePerSecond The new reward rate per second.
     */
    function setRewardRatePerSecond(
        uint256 _rewardRatePerSecond
    ) external onlyOwner updateReward(address(0)) {
        rewardRatePerSecond = _rewardRatePerSecond;
        emit RewardRateUpdated(_rewardRatePerSecond);
    }

    /**
     * @dev Allows users to perform an emergency withdrawal of their staked tokens.
     */
    function emergencyWithdraw() external nonReentrant {
        uint256 staked = userStakes[msg.sender];
        require(staked > 0, "No staked amount");
        totalStaked -= staked;
        userStakes[msg.sender] = 0;
        userRewards[msg.sender] = 0;
        axmToken.transfer(msg.sender, staked);
        emit Withdrawn(msg.sender, staked);
    }

    /**
     * @dev Calculates the remaining time in seconds until the reward pool is exhausted.
     * @return The number of seconds until the reward pool is exhausted.
     */
    function timeUntilRewardPoolExhausted() external view returns (uint256) {
        if (totalStaked == 0 || rewardRatePerSecond == 0) {
            return type(uint256).max; // Returns the maximum value if no staking or reward rate is zero
        }

        // Calculate the total rewards distributed per second across all stakers
        uint256 totalRewardRatePerSecond = rewardRatePerSecond;

        // Calculate the time until the reward pool is exhausted
        uint256 remainingTime = rewardPool / totalRewardRatePerSecond;

        return remainingTime;
    }
}
