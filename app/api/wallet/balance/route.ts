import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getLiveBalance } from '@/services/wallet/WalletService'
import { getAdminWallet } from '@/utils/avalanche'
import { ethers } from 'ethers'

export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')

  // Admin mode — return platform wallet balance without session
  if (adminSecret) {
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    try {
      const admin = getAdminWallet()
      const balance = await admin.provider!.getBalance(admin.address)
      return NextResponse.json({ address: admin.address, balance: ethers.formatEther(balance) })
    } catch {
      return NextResponse.json({ error: 'Admin wallet not configured' }, { status: 500 })
    }
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await dbConnect()
  const user = await User.findById(session.user.id)
  if (!user?.walletAddress) return NextResponse.json({ balance: '0', locked: 0 })

  const liveBalance = await getLiveBalance(user.walletAddress)

  return NextResponse.json({
    balance: liveBalance,
    locked: user.lockedBalance,
    address: user.walletAddress,
  })
}
