import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { generateProviders } from '@/services/ai/matchService'
import { createWallet } from '@/services/wallet/WalletService'

export async function POST(req: NextRequest) {
  // Admin auth
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { skill, count = 3 } = await req.json()
  if (!skill) return NextResponse.json({ error: 'skill required' }, { status: 400 })

  await dbConnect()

  const profiles = await generateProviders(skill, Math.min(count, 5))
  const created = []

  for (const profile of profiles) {
    const email = `${profile.name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@joblad.demo`

    const user = await User.create({
      email,
      name: profile.name,
      role: 'provider',
      skills: [
        {
          skillId: Math.floor(Math.random() * 100),
          skillName: profile.skill,
          professionalTitle: profile.professionalTitle,
        },
      ],
      rate: { min: profile.rateMin, max: profile.rateMax, currency: 'AVAX' },
      location: {
        city: profile.city,
        country: profile.country,
        coordinates: profile.coordinates,
      },
      bio: profile.bio,
    })

    // Create wallet for provider
    await createWallet(user._id)
    const updated = await User.findById(user._id).select('-encryptedPrivateKey')
    created.push(updated)
  }

  return NextResponse.json({ providers: created, count: created.length })
}
