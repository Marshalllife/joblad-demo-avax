const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Deployer balance:', ethers.formatEther(balance), 'AVAX')

  if (balance < ethers.parseEther('0.05')) {
    throw new Error('Insufficient AVAX. Fund wallet from https://faucet.avax.network/')
  }

  // 1. JobladEscrow
  console.log('\nDeploying JobladEscrow...')
  const Escrow = await ethers.getContractFactory('JobladEscrow')
  const escrow = await Escrow.deploy()
  await escrow.waitForDeployment()
  const escrowAddress = await escrow.getAddress()
  console.log('JobladEscrow:', escrowAddress)

  // 2. JobladReputation
  console.log('\nDeploying JobladReputation...')
  const Reputation = await ethers.getContractFactory('JobladReputation')
  const reputation = await Reputation.deploy()
  await reputation.waitForDeployment()
  const reputationAddress = await reputation.getAddress()
  console.log('JobladReputation:', reputationAddress)

  // 3. JobladCredentials
  console.log('\nDeploying JobladCredentials...')
  const Credentials = await ethers.getContractFactory('JobladCredentials')
  const credentials = await Credentials.deploy()
  await credentials.waitForDeployment()
  const credentialsAddress = await credentials.getAddress()
  console.log('JobladCredentials:', credentialsAddress)

  // Write addresses to .env.local
  const envPath = path.resolve(__dirname, '../../.env.local')
  let envContent = fs.readFileSync(envPath, 'utf8')
  envContent = envContent
    .replace(/ESCROW_CONTRACT_ADDRESS=.*/, `ESCROW_CONTRACT_ADDRESS=${escrowAddress}`)
    .replace(/REPUTATION_CONTRACT_ADDRESS=.*/, `REPUTATION_CONTRACT_ADDRESS=${reputationAddress}`)
    .replace(/CREDENTIALS_CONTRACT_ADDRESS=.*/, `CREDENTIALS_CONTRACT_ADDRESS=${credentialsAddress}`)
  fs.writeFileSync(envPath, envContent)
  console.log('\n✅ Addresses written to .env.local')

  console.log('\n====== DEPLOYMENT SUMMARY ======')
  console.log('Network: Avalanche Fuji Testnet')
  console.log('JobladEscrow:       ', escrowAddress)
  console.log('JobladReputation:   ', reputationAddress)
  console.log('JobladCredentials:  ', credentialsAddress)
  console.log('\nView on Snowtrace:')
  console.log(`  https://testnet.snowtrace.io/address/${escrowAddress}`)
  console.log(`  https://testnet.snowtrace.io/address/${reputationAddress}`)
  console.log(`  https://testnet.snowtrace.io/address/${credentialsAddress}`)
  console.log('================================')
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1) })
