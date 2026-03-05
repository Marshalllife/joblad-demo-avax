import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { createWallet } from '@/services/wallet/WalletService'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    await dbConnect()

    const normalizedEmail = email.toLowerCase().trim()
    let user = await User.findOne({ email: normalizedEmail })
    let isNew = false

    if (!user) {
      user = await User.create({ email: normalizedEmail })
      isNew = true
    }

    // Create wallet if user doesn't have one yet
    let walletResult = null
    if (!user.walletAddress) {
      walletResult = await createWallet(user._id)
      user = await User.findById(user._id)
    }

    // Set session
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    session.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
      name: user.name,
    }
    await session.save()

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        walletAddress: user.walletAddress,
        avaxBalance: user.avaxBalance,
      },
      isNew,
      wallet: walletResult,
    })
  } catch (err) {
    console.error('[auth/start]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
