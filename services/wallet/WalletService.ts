import { ethers } from 'ethers'
import { getProvider } from '@/utils/avalanche'
import { encryptPrivateKey, getOnChainBalance } from '@/services/blockchain/AvalancheService'
import { fundNewWallet } from '@/services/blockchain/EscrowService'
import User from '@/models/User'
import dbConnect from '@/lib/mongodb'
import type { Types } from 'mongoose'

export interface WalletCreateResult {
  address: string
  fundTxHash: string | null
  initialBalance: string
}

/**
 * A new Avalanche custodial wallet for a user.
 * Stores encrypted private key in DB, auto-funds with gas from admin wallet.
 */
export async function createWallet(userId: Types.ObjectId): Promise<WalletCreateResult> {
  await dbConnect()

  const wallet = ethers.Wallet.createRandom()
  const encrypted = encryptPrivateKey(wallet.privateKey)

  await User.findByIdAndUpdate(userId, {
    walletAddress: wallet.address,
    encryptedPrivateKey: encrypted,
    avaxBalance: 0,
    lockedBalance: 0,
  })

  // Attempt to auto-fund with gas money (non-blocking)
  const fundTxHash = await fundNewWallet(wallet.address)

  // Get initial on-chain balance (should be 0.02 if funded)
  let initialBalance = '0'
  try {
    initialBalance = await getOnChainBalance(wallet.address)
  } catch {
    // Non-blocking
  }

  return { address: wallet.address, fundTxHash, initialBalance }
}

/**
 * Get a user's live on-chain AVAX balance.
 */
export async function getLiveBalance(walletAddress: string): Promise<string> {
  return getOnChainBalance(walletAddress)
}

/**
 * Lock AVAX in escrow — move from avaxBalance to lockedBalance in DB.
 */
export async function lockBalance(userId: Types.ObjectId, amount: number): Promise<void> {
  await dbConnect()
  await User.findByIdAndUpdate(userId, {
    $inc: { avaxBalance: -amount, lockedBalance: amount },
  })
}

/**
 * Release locked AVAX to provider — move from lockedBalance to avaxBalance.
 */
export async function releaseToProvider(
  seekerId: Types.ObjectId,
  providerId: Types.ObjectId,
  amount: number
): Promise<void> {
  await dbConnect()
  await User.findByIdAndUpdate(seekerId, {
    $inc: { lockedBalance: -amount },
  })
  await User.findByIdAndUpdate(providerId, {
    $inc: { avaxBalance: amount },
  })
}

/**
 * Refund locked AVAX back to seeker.
 */
export async function refundBalance(userId: Types.ObjectId, amount: number): Promise<void> {
  await dbConnect()
  await User.findByIdAndUpdate(userId, {
    $inc: { lockedBalance: -amount, avaxBalance: amount },
  })
}
