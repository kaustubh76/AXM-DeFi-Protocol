import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    // hardhat: {
    //   chainId: 84531,
    //   forking: {
    //     url: process.env.RPC_PROVIDER_TESTNET!,
    //   },
    //   accounts: [
    //     {
    //       privateKey: process.env.PRIVATE_KEY!,
    //       balance: "10000000000000000000000",
    //     },
    //     {
    //       privateKey: process.env.PRIVATE_KEY2!,
    //       balance: "10000000000000000000000",
    //     },
    //   ],
    // },
    ArbitrumTestnet: {
      url: process.env.RPC_PROVIDER_TESTNET!,
      // accounts: [process.env.PRIVATE_KEY!],
      // gasPrice: 35000000000,
    },
    ArbitrumMainnet: {
      url: process.env.RPC_PROVIDER_MAINNET!,
      // accounts: [process.env.PRIVATE_KEY!],
      // gasPrice: 35000000000,
    },
  },
  etherscan: {
    apiKey: {
      ArbitrumMainnet: process.env.ARBITRUM_SCAN_API_KEY!,
      ArbitrumTestnet: process.env.ARBITRUM_SCAN_API_KEY!,
    },
    customChains: [
      {
        network: "arbitrum_testnet",
        chainId: 42161,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
      {
        network: "arbitrum_mainnet",
        chainId: 421614,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/",
        },
      },
    ],
  },
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
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
