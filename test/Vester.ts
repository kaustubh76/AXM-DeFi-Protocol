import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deal } from "hardhat-deal";

describe("Vester Contract", () => {
  async function deployVester() {
    let vester;
    let token;
    let owner;
    // Deploy ERC20 token for testing
    const Token = await ethers.getContractFactory("ERC20MockUp");
    token = await Token.deploy();
    await token.waitForDeployment();

    const vestingAmount = ethers.parseEther("1000");
    const vestingPeriods = 6;
    // Deploy Vester contract
    const Vester = await ethers.getContractFactory("Vester");
    [owner] = await ethers.getSigners();
    vester = await Vester.deploy(
      "Test Vester",
      vestingAmount, // Total locked tokens (1000 tokens)
      vestingPeriods, // Vesting period in months
      owner.address,
      1 // Vesting start month
    );
    await vester.waitForDeployment();

    await token.mint(vester.target, vestingAmount);

    return { token, owner, vester, vestingAmount, vestingPeriods };
  }

  it("should initialize correctly", async () => {
    const { token, owner, vester, vestingAmount, vestingPeriods } =
      await loadFixture(deployVester);

    // Test initialization parameters
    expect(await vester.name()).to.equal("Test Vester");
    expect(await vester.totalLocked()).to.equal(vestingAmount);
    expect(await vester.vestingPeriod()).to.equal(vestingPeriods);
    expect(await vester.owner()).to.equal(owner.address);
    // Ensure next vesting timestamp is as expected
    const nextVesting = await vester.nextVesting();
    expect(Number(nextVesting)).to.be.above(Math.floor(Date.now() / 1000));
  });

  it("should withdraw tokens correctly", async () => {
    const { token, owner, vester, vestingAmount, vestingPeriods } =
      await loadFixture(deployVester);
    // Loop to simulate 6 vesting intervals and withdrawals
    for (let i = 0; i < vestingPeriods; i++) {
      // Advance time to simulate vesting interval
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await vester.connect(owner).withdraw(token.target);
    }
    await vester.extraWithdraw(token.target);
    expect(await token.balanceOf(await owner.getAddress())).to.equal(
      vestingAmount
    );
  });

  it("should not allow withdrawal before vesting starts", async () => {
    const { token, owner, vester } = await loadFixture(deployVester);
    await expect(
      vester.connect(owner).withdraw(token.target)
    ).to.be.revertedWith("Vester: vesting period has not started");
  });
});
