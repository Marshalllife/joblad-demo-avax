import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  await dbConnect()
  const user = await User.findById(session.user.id).select('-encryptedPrivateKey')

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      walletAddress: user.walletAddress,
      avaxBalance: user.avaxBalance,
      lockedBalance: user.lockedBalance,
      credentialTokenId: user.credentialTokenId,
      credentialTxHash: user.credentialTxHash,
      skills: user.skills,
      location: user.location,
      bio: user.bio,
      rate: user.rate,
    },
  })
}

export async function PATCH(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['name', 'role', 'skills', 'rate', 'location', 'bio', 'preferredSkills']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  await dbConnect()
  const user = await User.findByIdAndUpdate(session.user.id, update, { new: true }).select(
    '-encryptedPrivateKey'
  )

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Update session
  session.user = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    walletAddress: user.walletAddress,
    name: user.name,
  }
  await session.save()

  return NextResponse.json({ user })
}
