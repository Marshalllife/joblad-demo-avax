import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { fundNewWallet } from '@/services/blockchain/EscrowService'
import { snowtraceUrl, FUJI_CONFIG } from '@/utils/avalanche'

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  const body = await req.json().catch(() => ({}))

  // Admin mode — fund an arbitrary address
  if (adminSecret) {
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { address } = body as { address?: string }
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

    const txHash = await fundNewWallet(address)
    if (txHash) {
      return NextResponse.json({ success: true, txHash, snowtraceLink: snowtraceUrl(txHash) })
    }
    return NextResponse.json({ success: false, faucetUrl: FUJI_CONFIG.faucetUrl, message: 'Fund failed' })
  }

  // User mode — fund the logged-in user's own wallet
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await dbConnect()
  const user = await User.findById(session.user.id)
  if (!user?.walletAddress) return NextResponse.json({ error: 'No wallet found' }, { status: 400 })

  const txHash = await fundNewWallet(user.walletAddress)

  if (txHash) {
    return NextResponse.json({
      success: true,
      txHash,
      snowtraceLink: snowtraceUrl(txHash),
      message: '0.02 AVAX sent to your wallet',
    })
  }

  return NextResponse.json({
    success: false,
    faucetUrl: FUJI_CONFIG.faucetUrl,
    walletAddress: user.walletAddress,
    message: 'Auto-fund failed. Please use the faucet.',
  })
}
