import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("AXM", () => {
  async function config() {
    const amountToMint: number = 20000000; // 20 millions
    const amountToMintWei = ethers.parseUnits(amountToMint.toString(), "ether");
    const name = "AXIUM";
    const symbol = "AXM";
    const decimals = 18;

    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const managerAddress = process.env.MANAGER_PUBLIC_KEY!;

    const VestingContract = await ethers.getContractFactory("Vester");
    const vestingContract = await VestingContract.connect(deployer).deploy();
    const vestingAddress = await vestingContract.getAddress();

    const expectedManagerBalance = 19000000 * 10 ** 18; // 95%
    const expectedVestingBalance = 1000000 * 10 ** 18; // 5%

    const Axium = await ethers.getContractFactory("AXIUM");
    const axium = await Axium.connect(deployer).deploy(
      managerAddress,
      vestingAddress
    );

    return {
      axium,
      amountToMint,
      amountToMintWei,
      managerAddress,
      name,
      symbol,
      decimals,
      deployer,
      vestingAddress,
      vestingContract,
      expectedManagerBalance,
      expectedVestingBalance,
    };
  }

  describe("Deployment", async () => {
    it("Name", async () => {
      const { name, axium } = await loadFixture(config);
      expect(await axium.name()).to.equal(name);
    });

    it("Symbol", async () => {
      const { symbol, axium } = await loadFixture(config);
      expect(await axium.symbol()).to.equal(symbol);
    });

    it("Decimals", async () => {
      const { decimals, axium } = await loadFixture(config);
      expect(await axium.decimals()).to.equal(decimals);
    });

    it("Amount Minted", async () => {
      const { amountToMintWei, axium } = await loadFixture(config);
      expect(await axium.totalSupply()).to.equal(amountToMintWei);
    });

    it("95% Total supply should be owned by Manager & 5% by dev vesting", async () => {
      const {
        managerAddress,
        axium,
        vestingAddress,
        expectedManagerBalance,
        expectedVestingBalance,
      } = await loadFixture(config);
      const managerBalance = await axium.balanceOf(managerAddress);
      const vestingBalance = await axium.balanceOf(vestingAddress);
      const totalSupply = await axium.totalSupply();

      console.log(
        "Manager Balance:",
        ethers.formatEther(managerBalance.toString())
      );
      console.log(
        "Vesting Balance:",
        ethers.formatEther(vestingBalance.toString())
      );
      console.log("Total Supply:", ethers.formatEther(totalSupply.toString()));

      expect(Number(managerBalance)).to.equal(expectedManagerBalance);
      expect(Number(vestingBalance)).to.equal(expectedVestingBalance);
    });

    it("withdraw first vesting", async () => {
      const { deployer, axium, expectedVestingBalance, vestingContract } =
        await loadFixture(config);
      const vestingAmount = expectedVestingBalance / 5;

      await vestingContract.withdraw(await axium.getAddress());

      const vestingBalance = await axium.balanceOf(deployer);

      expect(Number(vestingBalance)).to.equal(vestingAmount);
      console.log(
        "Developer after first Vesting: ",
        ethers.formatEther(vestingBalance.toString())
      );
    });

    it("should withdraw the next vesting after 30 days", async () => {
      const { deployer, axium, expectedVestingBalance, vestingContract } =
        await loadFixture(config);
      const vestingAmount = expectedVestingBalance / 5;

      await vestingContract.withdraw(await axium.getAddress()); // First vesting
      // Increase time by 30 days
      for (let i = 0; i < 4; i++) {
        await time.increase(32 * 24 * 60 * 60);
        await vestingContract.withdraw(await axium.getAddress());
      }

      const vestingBalance = await axium.balanceOf(deployer);

      console.log(
        "Developer after total vesting (5 months): ",
        ethers.formatEther(vestingBalance.toString())
      );
      expect(Number(vestingBalance)).to.equal(5 * vestingAmount);

      // If the contract is empty of HVR then revert
      await expect(vestingContract.withdraw(await axium.getAddress())).to.be
        .reverted;
    });

    it("should revert if withdraw before 30 days", async () => {
      const { axium, vestingContract } = await loadFixture(config);

      await vestingContract.withdraw(await axium.getAddress()); // First vesting

      // * It may not fail as the times are hardcoded in the contract, so maybe it get´s tested after the vesting period.
      // * If so, it should not be reverted.
      await expect(vestingContract.withdraw(await axium.getAddress())).to.be
        .reverted;
    });
  });
});
