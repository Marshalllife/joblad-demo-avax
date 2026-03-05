import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const skill = searchParams.get('skill')

  await dbConnect()

  const filter: Record<string, unknown> = { role: 'provider', walletAddress: { $ne: '' } }
  if (skill) {
    filter['skills.skillName'] = { $regex: skill, $options: 'i' }
  }

  const providers = await User.find(filter)
    .select('-encryptedPrivateKey')
    .limit(20)
    .lean()

  return NextResponse.json({ providers })
}
