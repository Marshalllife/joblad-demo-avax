import { NextResponse } from 'next/server'
import { requireAuth } from '@/utils/session'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { mintCredential } from '@/services/blockchain/EscrowService'

export async function POST() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  await dbConnect()
  const user = await User.findById(auth.user.id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.role !== 'provider') return NextResponse.json({ error: 'Providers only' }, { status: 403 })
  if (user.credentialTokenId) {
    return NextResponse.json({ error: 'Already minted' }, { status: 400 })
  }

  const skill = user.skills?.[0]
  if (!skill) return NextResponse.json({ error: 'Add a skill first' }, { status: 400 })

  const result = await mintCredential(
    user.walletAddress,
    skill.skillName,
    skill.skillId
  )

  await User.findByIdAndUpdate(user._id, {
    credentialTokenId: result.tokenId,
    credentialTxHash: result.txHash,
  })

  return NextResponse.json({
    tokenId: result.tokenId,
    txHash: result.txHash,
    snowtraceLink: result.snowtraceLink,
    skillName: skill.skillName,
  })
}
