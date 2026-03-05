import { ethers } from 'ethers'

export const FUJI_CONFIG = {
  chainId: 43113,
  name: 'Avalanche Fuji Testnet',
  rpcUrl: process.env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
  explorerUrl: 'https://testnet.snowtrace.io',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  faucetUrl: 'https://faucet.avax.network/',
}

export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(FUJI_CONFIG.rpcUrl)
}

export function getAdminWallet(): ethers.Wallet {
  if (!process.env.ADMIN_WALLET_PRIVATE_KEY) {
    throw new Error('ADMIN_WALLET_PRIVATE_KEY not set')
  }
  return new ethers.Wallet(process.env.ADMIN_WALLET_PRIVATE_KEY, getProvider())
}

export function formatAVAX(wei: bigint | string): string {
  return parseFloat(ethers.formatEther(wei)).toFixed(4)
}

export function toWei(avax: string | number): bigint {
  return ethers.parseEther(avax.toString())
}

export function toJobId(mongoId: string): string {
  return ethers.id(mongoId)
}

export function snowtraceUrl(txHash: string): string {
  return `${FUJI_CONFIG.explorerUrl}/tx/${txHash}`
}

export function snowtraceAddressUrl(address: string): string {
  return `${FUJI_CONFIG.explorerUrl}/address/${address}`
}
