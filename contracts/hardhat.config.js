require('@nomicfoundation/hardhat-ethers')
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })

const ADMIN_PRIVATE_KEY =
  process.env.ADMIN_WALLET_PRIVATE_KEY ||
  '0x0000000000000000000000000000000000000000000000000000000000000001'

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'cancun',
    },
  },
  networks: {
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      chainId: 43113,
      accounts: [ADMIN_PRIVATE_KEY],
      gasPrice: 'auto',
    },
    hardhat: {
      chainId: 31337,
    },
  },
}
