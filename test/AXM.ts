import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Axium Token Contract", function () {
  async function deployAxiumContract() {
    let Axium;
    let axium;
    let owner;
    let addr1;
    let addr2;
    let addrs;
    Axium = await ethers.getContractFactory("Axium");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy Axium contract with initial allocations
    const treasuryReserveVester = await addr1.getAddress();
    const teamAndAdvisorsVester = await addr2.getAddress();
    const missionVester = await addrs[0].getAddress();
    const publicSaleAndAirdrop = await addrs[1].getAddress();
    const marketingVester = await addrs[2].getAddress();

    const vesters = [
      treasuryReserveVester,
      teamAndAdvisorsVester,
      missionVester,
      publicSaleAndAirdrop,
      marketingVester,
    ];

    const amounts = [
      ethers.parseUnits("300000", 18),
      ethers.parseUnits("100000", 18),
      ethers.parseUnits("250000", 18),
      ethers.parseUnits("250000", 18),
      ethers.parseUnits("100000", 18),
    ];

    axium = await Axium.deploy(vesters, amounts);
    return {
      axium,
      owner,
      addr1,
      addr2,
      addrs,
    };
  }

  it("Should return the correct name and symbol", async function () {
    const { axium } = await loadFixture(deployAxiumContract);
    expect(await axium.name()).to.equal("Axium");
    expect(await axium.symbol()).to.equal("AXM");
  });

  it("Should return the correct initial supply and allocations", async function () {
    const { axium, addr1, addr2, addrs } = await loadFixture(
      deployAxiumContract
    );
    const totalSupply = await axium.totalSupply();
    const treasuryReserveBalance = await axium.balanceOf(
      await addr1.getAddress()
    );
    const teamAndAdvisorsBalance = await axium.balanceOf(
      await addr2.getAddress()
    );
    const missionVesterBalance = await axium.balanceOf(
      await addrs[0].getAddress()
    );
    const publicSaleAndAirdropBalance = await axium.balanceOf(
      await addrs[1].getAddress()
    );
    const marketingVesterBalance = await axium.balanceOf(addrs[2].getAddress());

    expect(totalSupply).to.equal(
      ethers.parseUnits("1000000", 18) // Total supply is the sum of all initial allocations
    );
    expect(treasuryReserveBalance).to.equal(ethers.parseUnits("300000", 18));
    expect(teamAndAdvisorsBalance).to.equal(ethers.parseUnits("100000", 18));
    expect(missionVesterBalance).to.equal(ethers.parseUnits("250000", 18));
    expect(publicSaleAndAirdropBalance).to.equal(
      ethers.parseUnits("250000", 18)
    );
    expect(marketingVesterBalance).to.equal(ethers.parseUnits("100000", 18));
  });
});
