import { ethers } from 'ethers'
import { getAdminWallet, toWei, toJobId, snowtraceUrl } from '@/utils/avalanche'
import { getUserSigner, getEscrowContract, getReputationContract, getCredentialsContract } from './AvalancheService'
import type { IUser } from '@/models/User'

export interface EscrowCreateResult {
  txHash: string
  contractJobId: string
  snowtraceLink: string
}

export interface EscrowReleaseResult {
  txHash: string
  snowtraceLink: string
}

export interface ReputationResult {
  txHash: string
  snowtraceLink: string
}

export interface MintCredentialResult {
  txHash: string
  tokenId: string
  snowtraceLink: string
}

/**
 * Seeker creates on-chain escrow when booking a provider.
 * AVAX amount is locked in the JobladEscrow contract.
 */
export async function createEscrow(
  seekerUser: IUser,
  mongoRequestId: string,
  providerWalletAddress: string,
  avaxAmount: number
): Promise<EscrowCreateResult> {
  const seeker = getUserSigner(seekerUser)
  const contract = getEscrowContract(seeker)
  const contractJobId = toJobId(mongoRequestId)

  const tx = await contract.createEscrow(contractJobId, providerWalletAddress, {
    value: toWei(avaxAmount),
  })
  const receipt = await tx.wait()

  return {
    txHash: receipt.hash,
    contractJobId,
    snowtraceLink: snowtraceUrl(receipt.hash),
  }
}

/**
 * Seeker releases payment to provider after job completion.
 */
export async function releaseEscrow(
  seekerUser: IUser,
  mongoRequestId: string
): Promise<EscrowReleaseResult> {
  const seeker = getUserSigner(seekerUser)
  const contract = getEscrowContract(seeker)
  const contractJobId = toJobId(mongoRequestId)

  const tx = await contract.release(contractJobId)
  const receipt = await tx.wait()

  return {
    txHash: receipt.hash,
    snowtraceLink: snowtraceUrl(receipt.hash),
  }
}

/**
 * Platform wallet updates provider reputation on-chain after job.
 * Only the admin (platform) wallet can call this.
 */
export async function updateReputation(
  providerWalletAddress: string,
  rating: number
): Promise<ReputationResult> {
  const admin = getAdminWallet()
  const contract = getReputationContract(admin)

  const tx = await contract.updateScore(providerWalletAddress, rating)
  const receipt = await tx.wait()

  return {
    txHash: receipt.hash,
    snowtraceLink: snowtraceUrl(receipt.hash),
  }
}

/**
 * Platform mints a skill credential NFT to a provider.
 * Admin wallet pays gas and calls onlyOwner function.
 */
export async function mintCredential(
  providerWalletAddress: string,
  skillName: string,
  skillId: number
): Promise<MintCredentialResult> {
  const admin = getAdminWallet()
  const contract = getCredentialsContract(admin)

  const tx = await contract.mintCredential(providerWalletAddress, skillName, BigInt(skillId))
  const receipt = await tx.wait()

  // Parse token ID from event logs
  const event = receipt.logs
    .map((log: ethers.Log) => {
      try {
        return contract.interface.parseLog(log)
      } catch {
        return null
      }
    })
    .find((e: ethers.LogDescription | null) => e?.name === 'CredentialMinted')

  const tokenId = event?.args?.tokenId?.toString() || '0'

  return {
    txHash: receipt.hash,
    tokenId,
    snowtraceLink: snowtraceUrl(receipt.hash),
  }
}

/**
 * Auto-fund a new user's wallet with gas money from admin wallet.
 * Returns txHash on success, null on failure (non-blocking).
 */
export async function fundNewWallet(recipientAddress: string): Promise<string | null> {
  try {
    const admin = getAdminWallet()
    const tx = await admin.sendTransaction({
      to: recipientAddress,
      value: toWei(0.02),
    })
    const receipt = await tx.wait()
    return receipt?.hash || null
  } catch (err) {
    console.error('[EscrowService] Auto-fund failed:', err)
    return null
  }
}
