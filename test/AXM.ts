import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Axiom Token Contract", function () {
  async function deployAxiomContract() {
    let Axiom;
    let axiom;
    let owner;
    let addr1;
    let addr2;
    let addrs;
    Axiom = await ethers.getContractFactory("Axiom");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy Axiom contract with initial allocations
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

    axiom = await Axiom.deploy(vesters, amounts);
    return {
      axiom,
      owner,
      addr1,
      addr2,
      addrs,
    };
  }

  it("Should return the correct name and symbol", async function () {
    const { axiom } = await loadFixture(deployAxiomContract);
    expect(await axiom.name()).to.equal("Axiom");
    expect(await axiom.symbol()).to.equal("AXM");
  });

  it("Should return the correct initial supply and allocations", async function () {
    const { axiom, addr1, addr2, addrs } = await loadFixture(
      deployAxiomContract
    );
    const totalSupply = await axiom.totalSupply();
    const treasuryReserveBalance = await axiom.balanceOf(
      await addr1.getAddress()
    );
    const teamAndAdvisorsBalance = await axiom.balanceOf(
      await addr2.getAddress()
    );
    const missionVesterBalance = await axiom.balanceOf(
      await addrs[0].getAddress()
    );
    const publicSaleAndAirdropBalance = await axiom.balanceOf(
      await addrs[1].getAddress()
    );
    const marketingVesterBalance = await axiom.balanceOf(addrs[2].getAddress());

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
