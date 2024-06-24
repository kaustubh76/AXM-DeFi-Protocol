import { ethers } from "hardhat";
import deploy from "./deployments/index";

const superOwnerAddress = "0x9dD27489C6F64Eb82C130aE20F674CCa7bd8D136";

async function deployProtocol() {
  const vestingNames = [
    "Advisor Vester", // Advisor address
    "Founder Vester 1", // Founder address
    "Founder Vester 2", // Founder address
    "COO Vester 1", // COO address
    "COO Vester 2", // COO address
    "CTO Vester", // CTO address
    "Treasury Address", // Treasury address
  ];

  const vestingAddresses = [
    "0xa972cd5B78Dcd1f3671Ac6F1d1f98058a4d04387", // Advisor address
    "0x611767cBa1CC3e4bb9E402e86311cbFEAE3b572f", // Founder address
    "0x1B82bDB0a25557eF3Ace357147666cF810924c74", // Founder address
    "0xB9928A0dAE22d26CF9c616F0d530c758C788A05B", // COO address
    "0xd3E892030369c09e0E363d86255160300C8298FB", // COO address
    "0x9dD27489C6F64Eb82C130aE20F674CCa7bd8D136", // CTO address
    "0x9e97027DF8560875a76895FdE1Df50eF763d0853", // Treasury address
  ];
  // * Vesting amounts
  const vestingAmounts = [
    ethers.parseUnits("40000", 18),
    ethers.parseUnits("25000", 18),
    ethers.parseUnits("25000", 18),
    ethers.parseUnits("3333", 18),
    ethers.parseUnits("3333", 18),
    ethers.parseUnits("3334", 18),
    ethers.parseUnits("300000", 18),
  ];

  // * In how many months the vesting will start from deployment
  const vestingStartMont = ["1", "1", "1", "1", "1", "1", "3"];
  const vestingPeriod = "6"; // 6 months

  const { deployedVesterContracts } = await deploy.vesters(
    vestingNames,
    vestingAddresses,
    vestingAmounts,
    vestingStartMont,
    vestingPeriod
  );

  const initialEmission = "0x7108A73C299710B2E4c8bb20ba450Bd8f359EB69";
  const initialEmissionAmount = ethers.parseUnits("250000", 18);
  const initialDistribution = "0x7108A73C299710B2E4c8bb20ba450Bd8f359EB69";
  const initialDistributionAmount = ethers.parseUnits("250000", 18);
  const marketing = "0x7108A73C299710B2E4c8bb20ba450Bd8f359EB69";
  const marketingAmount = ethers.parseUnits("100000", 18);

  const AXM = await deploy.AXM(
    [
      ...deployedVesterContracts,
      initialEmission,
      initialDistribution,
      marketing,
    ],
    [
      ...vestingAmounts,
      initialEmissionAmount,
      initialDistributionAmount,
      marketingAmount,
    ]
  );

  const rewardRatePerSecond = ethers.parseUnits("228", 18);
  const stakingContract = await deploy.staking(
    AXM.target.toString(),
    rewardRatePerSecond,
    superOwnerAddress
  );
}

deployProtocol();
