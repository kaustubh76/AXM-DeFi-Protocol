import { ethers } from "hardhat";
import verify from "../utils/verify";

const vesters = async (
  vestingNames: string[],
  vestingAddresses: string[],
  vestingAmounts: bigint[],
  vestingStartMont: string[],
  vestingPeriod: string
) => {
  console.log("Deploying vesters...");
  const deployedVesterContracts = [];
  for (let i = 0; i < vestingAmounts.length; i++) {
    const Vester = await ethers.getContractFactory("Vester");
    const vester = await Vester.deploy(
      vestingNames[i],
      vestingAmounts[i],
      vestingPeriod,
      vestingAddresses[i],
      vestingStartMont[i]
    );
    await vester.waitForDeployment();
    console.log(i);
    await verify(vester.target.toString(), [
      vestingNames[i],
      vestingAmounts[i].toString(),
      vestingPeriod,
      vestingAddresses[i],
      vestingStartMont[i],
    ]);

    deployedVesterContracts.push(vester.target.toString());
  }
  console.log(`Deployed vester contracts: ${deployedVesterContracts}`);

  return { deployedVesterContracts };
};

const AXM = async (receiverAddresses: string[], amounts: bigint[]) => {
  console.log("Deploying AXM Token...");
  const AXM = await ethers.getContractFactory("Axium");
  const axm = await AXM.deploy(receiverAddresses, amounts);
  await axm.waitForDeployment();

  await verify(axm.target.toString(), [receiverAddresses, amounts]);
  console.log(`Axium token deployed to: ${axm.target}`);

  return axm;
};

const staking = async (
  rewardTokenAddress: string,
  rewardPerSecond: bigint,
  superOwnerAddress: string
) => {
  console.log("Deploying Staking Contract...");
  const Staking = await ethers.getContractFactory("AxiumStaking");
  const staking = await Staking.deploy(rewardTokenAddress, rewardPerSecond);
  await staking.waitForDeployment();

  await verify(staking.target.toString(), [
    rewardTokenAddress,
    rewardPerSecond.toString(),
  ]);
  console.log(`- Staking Contract deployed to: ${staking.target}`);

  const tx = await staking.transferOwnership(superOwnerAddress);
  await tx.wait();
  console.log("   *Staking Owner transferred to Super Owner");
  return staking;
};

const singleDeployments = { AXM, staking, vesters };
export default singleDeployments;
