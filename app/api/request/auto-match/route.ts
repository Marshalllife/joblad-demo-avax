import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/utils/session'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Request from '@/models/Request'
import { matchProviders } from '@/services/ai/matchService'
import { getProviderReputationScore } from '@/services/blockchain/AvalancheService'

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { description, skill, urgency, budget, city } = await req.json()
  if (!description || !skill || !urgency || !budget || !city) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  await dbConnect()

  // Fetch available providers matching skill
  const rawProviders = await User.find({
    role: 'provider',
    'skills.skillName': { $regex: skill, $options: 'i' },
    walletAddress: { $ne: '' },
  })
    .select('-encryptedPrivateKey')
    .limit(15)
    .lean()

  if (rawProviders.length === 0) {
    return NextResponse.json(
      { error: 'No providers found for this skill. Generate some in the admin panel.' },
      { status: 404 }
    )
  }

  interface LeanProvider {
    _id: { toString(): string }
    name: string
    skills?: Array<{ skillName?: string; professionalTitle?: string }>
    location?: { city?: string; country?: string; coordinates?: [number, number] }
    bio?: string
    rate?: { min?: number; max?: number }
    walletAddress: string
    credentialTokenId?: string
  }

  // Enrich with on-chain reputation scores
  const providers = await Promise.all(
    (rawProviders as LeanProvider[]).map(async (p) => {
      const rep = await getProviderReputationScore(p.walletAddress)
      return {
        _id: p._id.toString(),
        name: p.name,
        skill: p.skills?.[0]?.skillName || skill,
        professionalTitle: p.skills?.[0]?.professionalTitle || '',
        city: p.location?.city || '',
        country: p.location?.country || 'Nigeria',
        bio: p.bio || '',
        rateMin: p.rate?.min || 0.05,
        rateMax: p.rate?.max || 0.2,
        yearsExperience: 3,
        languages: ['English'],
        coordinates: p.location?.coordinates || ([3.3792, 6.5244] as [number, number]),
        walletAddress: p.walletAddress,
        reputationScore: rep.average,
        jobCount: rep.jobCount,
        credentialTokenId: p.credentialTokenId || null,
      }
    })
  )

  // AI matching
  const matches = await matchProviders({ description, skill, urgency, budget, city }, providers)

  // Create a pending request doc
  const request = await Request.create({
    requestType: 'auto_match',
    status: 'pending',
    seekerId: auth.user.id,
    jobDetails: {
      title: `${skill} Service`,
      description,
      skill,
      urgency,
    },
    budget: { amount: budget, currency: 'AVAX' },
    location: {
      city,
      coordinates: providers[0]?.coordinates || [3.3792, 6.5244],
    },
  })

  return NextResponse.json({
    requestId: request._id.toString(),
    matches,
  })
}
