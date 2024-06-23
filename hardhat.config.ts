import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("hardhat-tracer");
require("hardhat-deal");
require("dotenv").config();

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    ArbitrumMainnet: {
      url: process.env.RPC_PROVIDER_MAINNET!,
      accounts: [process.env.PRIVATE_KEY!],
      // gasPrice: 35000000000,
    },
    ArbitrumSepolia: {
      url: process.env.RPC_PROVIDER_TESTNET!,
      accounts: [process.env.PRIVATE_KEY!],
      // gasPrice: 35000000000,
    },
    BuildBear: {
      url: process.env.RPC_PROVIDER_BUILDBEAR!,
      accounts: [process.env.PRIVATE_KEY!],
      // gasPrice: 35000000000,
    },
  },
  etherscan: {
    apiKey: {
      ArbitrumMainnet: process.env.ARBITRUM_SCAN_API_KEY!,
      ArbitrumSepolia: process.env.ARBITRUM_SCAN_API_KEY!,
      BuildBear: "verifyContrats",
    },
    customChains: [
      {
        network: "ArbitrumMainnet",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/",
        },
      },
      {
        network: "ArbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
      {
        network: "BuildBear",
        chainId: 18328,
        urls: {
          apiURL:
            "https://rpc.buildbear.io/verify/sourcify/server/direct-boomboom-b1e336bb",
          browserURL: "https://rpc.buildbear.io/direct-boomboom-b1e336bb",
        },
      },
    ],
  },
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        // runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;
