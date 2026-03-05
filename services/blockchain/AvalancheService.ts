import { ethers } from 'ethers'
import { FUJI_CONFIG, getProvider, getAdminWallet } from '@/utils/avalanche'
import { CONTRACT_ADDRESSES, ESCROW_ABI, REPUTATION_ABI, CREDENTIALS_ABI } from '@/lib/contracts'
import type { IUser } from '@/models/User'
import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY!

export function encryptPrivateKey(privateKey: string): string {
  return CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY).toString()
}

export function decryptPrivateKey(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function getUserSigner(user: IUser): ethers.Wallet {
  if (!user.encryptedPrivateKey) throw new Error('User has no wallet')
  const privateKey = decryptPrivateKey(user.encryptedPrivateKey)
  return new ethers.Wallet(privateKey, getProvider())
}

export function getEscrowContract(signer?: ethers.Signer): ethers.Contract {
  if (!CONTRACT_ADDRESSES.escrow) throw new Error('ESCROW_CONTRACT_ADDRESS not set')
  return new ethers.Contract(
    CONTRACT_ADDRESSES.escrow,
    ESCROW_ABI,
    signer || getProvider()
  )
}

export function getReputationContract(signer?: ethers.Signer): ethers.Contract {
  if (!CONTRACT_ADDRESSES.reputation) throw new Error('REPUTATION_CONTRACT_ADDRESS not set')
  return new ethers.Contract(
    CONTRACT_ADDRESSES.reputation,
    REPUTATION_ABI,
    signer || getProvider()
  )
}

export function getCredentialsContract(signer?: ethers.Signer): ethers.Contract {
  if (!CONTRACT_ADDRESSES.credentials) throw new Error('CREDENTIALS_CONTRACT_ADDRESS not set')
  return new ethers.Contract(
    CONTRACT_ADDRESSES.credentials,
    CREDENTIALS_ABI,
    signer || getProvider()
  )
}

export async function getOnChainBalance(address: string): Promise<string> {
  const provider = getProvider()
  const balance = await provider.getBalance(address)
  return ethers.formatEther(balance)
}

export async function getProviderReputationScore(
  address: string
): Promise<{ average: number; jobCount: number }> {
  try {
    const contract = getReputationContract()
    const [avg, count] = await contract.getScore(address)
    return {
      average: Number(avg) / 100, // Scaled by 100 in contract
      jobCount: Number(count),
    }
  } catch {
    return { average: 0, jobCount: 0 }
  }
}
