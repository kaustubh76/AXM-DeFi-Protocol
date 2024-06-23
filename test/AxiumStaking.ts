import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("StakingContract", function () {
  const rewardRatePerSecond = ethers.parseUnits("1", 18);

  async function deployContractsFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const AXMToken = await ethers.getContractFactory("ERC20MockUp");
    const axmToken = await AXMToken.deploy();
    await axmToken.waitForDeployment();

    const StakingContract = await ethers.getContractFactory("AxiumStaking");

    const stakingContract = await StakingContract.deploy(
      axmToken.target,
      rewardRatePerSecond
    );
    await stakingContract.waitForDeployment();

    await axmToken.mint(
      await owner.getAddress(),
      ethers.parseUnits("1000", 18)
    );
    await axmToken.mint(
      await user1.getAddress(),
      ethers.parseUnits("1000", 18)
    );
    await axmToken.mint(
      await user2.getAddress(),
      ethers.parseUnits("1000", 18)
    );

    return { owner, user1, user2, axmToken, stakingContract };
  }

  describe("Stake", function () {
    it("should allow users to stake AXM tokens", async function () {
      const { user1, axmToken, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await axmToken
        .connect(user1)
        .approve(stakingContract.target, ethers.parseUnits("100", 18));
      await stakingContract.connect(user1).stake(ethers.parseUnits("100", 18));

      expect(await stakingContract.totalStaked()).to.equal(
        ethers.parseUnits("100", 18)
      );
      expect(
        await stakingContract.userStakes(await user1.getAddress())
      ).to.equal(ethers.parseUnits("100", 18));
    });

    it("should not allow users to stake zero AXM tokens", async function () {
      const { user1, stakingContract } = await loadFixture(
        deployContractsFixture
      );
      await expect(stakingContract.connect(user1).stake(0)).to.be.revertedWith(
        "Cannot stake 0"
      );
    });
  });

  describe("Withdraw", function () {
    it("should allow users to withdraw staked AXM tokens", async function () {
      const { user1, axmToken, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await axmToken
        .connect(user1)
        .approve(stakingContract.target, ethers.parseUnits("100", 18));
      await stakingContract.connect(user1).stake(ethers.parseUnits("100", 18));

      await stakingContract
        .connect(user1)
        .withdraw(ethers.parseUnits("50", 18));

      expect(await stakingContract.totalStaked()).to.equal(
        ethers.parseUnits("50", 18)
      );
      expect(
        await stakingContract.userStakes(await user1.getAddress())
      ).to.equal(ethers.parseUnits("50", 18));
    });

    it("should not allow users to withdraw more than their staked amount", async function () {
      const { user1, axmToken, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await axmToken
        .connect(user1)
        .approve(stakingContract.target, ethers.parseUnits("100", 18));
      await stakingContract.connect(user1).stake(ethers.parseUnits("100", 18));

      await expect(
        stakingContract.connect(user1).withdraw(ethers.parseUnits("200", 18))
      ).to.be.revertedWith("Withdraw amount exceeds balance");
    });
  });

  describe("Claim Reward", function () {
    it("should allow users to claim rewards", async function () {
      const { owner, user1, axmToken, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await axmToken
        .connect(owner)
        .approve(stakingContract.target, ethers.parseUnits("1000", 18));
      await stakingContract
        .connect(owner)
        .depositRewards(ethers.parseUnits("1000", 18));

      await axmToken
        .connect(user1)
        .approve(stakingContract.target, ethers.parseUnits("100", 18));
      await stakingContract.connect(user1).stake(ethers.parseUnits("100", 18));

      // Fast-forward time by 100 seconds
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine");
      const balanceBeforeClaimingReward =
        Number(await axmToken.balanceOf(await user1.getAddress())) / 10 ** 18;
      await stakingContract.connect(user1).claimReward();
      const balanceAfterClaimingReward =
        Number(await axmToken.balanceOf(await user1.getAddress())) / 10 ** 18;
      const reward = balanceAfterClaimingReward - balanceBeforeClaimingReward;

      expect(reward).to.be.closeTo(100, 1);
    });

    it("should not allow users to claim more rewards than available in the pool", async function () {
      const { owner, user1, axmToken, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await axmToken
        .connect(owner)
        .approve(stakingContract.target, ethers.parseUnits("1000", 18));
      await stakingContract
        .connect(owner)
        .depositRewards(ethers.parseUnits("1000", 18));

      await axmToken
        .connect(user1)
        .approve(stakingContract.target, ethers.parseUnits("100", 18));
      await stakingContract.connect(user1).stake(ethers.parseUnits("100", 18));

      // Fast-forward time by 2000 seconds (2000 AXM rewards)
      await ethers.provider.send("evm_increaseTime", [2000]);
      await ethers.provider.send("evm_mine");

      await expect(
        stakingContract.connect(user1).claimReward()
      ).to.be.revertedWith("Insufficient rewards in contract");
    });

    it("should correctly calculate rewards for multiple users staking over time", async function () {
      const { owner, user1, user2, axmToken, stakingContract } =
        await loadFixture(deployContractsFixture);

      // Owner deposits initial rewards
      await axmToken
        .connect(owner)
        .approve(stakingContract.target, ethers.parseUnits("1000", 18));
      await stakingContract
        .connect(owner)
        .depositRewards(ethers.parseUnits("1000", 18));

      // Users stake AXM tokens
      const amountDepositUser1 = ethers.parseUnits("100", 18);
      await axmToken
        .connect(user1)
        .approve(stakingContract.target, amountDepositUser1);
      await stakingContract.connect(user1).stake(amountDepositUser1);

      const amountDepositUser2 = ethers.parseUnits("200", 18);
      await axmToken
        .connect(user2)
        .approve(stakingContract.target, amountDepositUser2);
      await stakingContract.connect(user2).stake(amountDepositUser2);

      // Fast-forward time by 100 seconds
      const seconds = 100;
      await ethers.provider.send("evm_increaseTime", [seconds]);
      await ethers.provider.send("evm_mine");

      // User1 claims rewards
      const user1BalanceBefore = await axmToken.balanceOf(user1.address);
      await stakingContract.connect(user1).claimReward();
      const user1BalanceAfter = await axmToken.balanceOf(user1.address);
      const user1Reward =
        Number(user1BalanceAfter) - Number(user1BalanceBefore);

      // User2 claims rewards
      const user2BalanceBefore = await axmToken.balanceOf(user2.address);
      await stakingContract.connect(user2).claimReward();
      const user2BalanceAfter = await axmToken.balanceOf(user2.address);
      const user2Reward =
        Number(user2BalanceAfter) - Number(user2BalanceBefore);

      // Calculate expected rewards based on proportional stake and time
      const rewardRatePerSecond =
        Number(await stakingContract.rewardRatePerSecond()) / 10 ** 18;
      const totalStaked =
        Number(await stakingContract.totalStaked()) / 10 ** 18;
      const rate = rewardRatePerSecond / totalStaked;

      // Assert that rewards are roughly proportional to stake and time
      expect(user1Reward / 10 ** 18).to.be.closeTo(
        100 * rate * seconds,
        100 * rate * (seconds + 1)
      ); // Adjust margin of error as needed
      expect(user2Reward / 10 ** 18).to.be.closeTo(
        200 * rate * seconds,
        100 * rate * (seconds + 1)
      ); // Adjust margin of error as needed
    });
  });

  describe("Deposit Rewards", function () {
    it("should allow the owner to deposit AXM tokens as rewards", async function () {
      const { owner, axmToken, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await axmToken
        .connect(owner)
        .approve(stakingContract.target, ethers.parseUnits("1000", 18));
      await stakingContract
        .connect(owner)
        .depositRewards(ethers.parseUnits("1000", 18));

      expect(await stakingContract.rewardPool()).to.equal(
        ethers.parseUnits("1000", 18)
      );
    });

    it("should not allow non-owner to deposit AXM tokens as rewards", async function () {
      const { user1, axmToken, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await axmToken
        .connect(user1)
        .approve(stakingContract.target, ethers.parseUnits("1000", 18));
      await expect(
        stakingContract
          .connect(user1)
          .depositRewards(ethers.parseUnits("1000", 18))
      ).to.be.reverted;
    });
  });

  describe("Update Reward Rate", function () {
    it("should allow the owner to update the reward rate per second", async function () {
      const { owner, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await stakingContract
        .connect(owner)
        .setRewardRatePerSecond(ethers.parseUnits("2", 18));
      expect(await stakingContract.rewardRatePerSecond()).to.equal(
        ethers.parseUnits("2", 18)
      );
    });

    it("should not allow non-owner to update the reward rate per second", async function () {
      const { user1, stakingContract } = await loadFixture(
        deployContractsFixture
      );
      await expect(
        stakingContract
          .connect(user1)
          .setRewardRatePerSecond(ethers.parseUnits("2", 18))
      ).to.be.reverted;
    });
  });

  describe("Emergency Withdraw", function () {
    it("should allow users to perform an emergency withdrawal of their staked tokens", async function () {
      const { user1, axmToken, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await axmToken
        .connect(user1)
        .approve(stakingContract.target, ethers.parseUnits("100", 18));
      await stakingContract.connect(user1).stake(ethers.parseUnits("100", 18));

      await stakingContract.connect(user1).emergencyWithdraw();
      expect(await stakingContract.totalStaked()).to.equal(0);
      expect(
        await stakingContract.userStakes(await user1.getAddress())
      ).to.equal(0);
    });
  });

  describe("Time Until Reward Pool Exhausted", function () {
    it("should correctly calculate the time until the reward pool is exhausted", async function () {
      const { owner, user1, axmToken, stakingContract } = await loadFixture(
        deployContractsFixture
      );

      await axmToken
        .connect(owner)
        .approve(stakingContract.target, ethers.parseUnits("1000", 18));
      await stakingContract
        .connect(owner)
        .depositRewards(ethers.parseUnits("1000", 18));

      await axmToken
        .connect(user1)
        .approve(stakingContract.target, ethers.parseUnits("100", 18));
      await stakingContract.connect(user1).stake(ethers.parseUnits("100", 18));

      const remainingTime =
        await stakingContract.timeUntilRewardPoolExhausted();
      expect(remainingTime).to.be.closeTo(1000, 10); // Allowing for some margin of error
    });
  });
});
