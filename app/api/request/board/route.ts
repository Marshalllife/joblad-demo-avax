import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/utils/session'
import dbConnect from '@/lib/mongodb'
import Request from '@/models/Request'
import User from '@/models/User'
import { getLiveBalance } from '@/services/wallet/WalletService'

// GET — list open board requests
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const skill = searchParams.get('skill')
  const mine = searchParams.get('mine')
  const auth = await requireAuth()

  await dbConnect()

  const filter: Record<string, unknown> = {
    requestType: 'board',
    status: 'pending',
    'boardData.expiresAt': { $gt: new Date() },
  }

  if (skill) filter['jobDetails.skill'] = { $regex: skill, $options: 'i' }
  if (mine === 'true' && !(auth instanceof NextResponse)) {
    filter.seekerId = auth.user.id
    delete filter.status // show all mine including non-pending
  }

  const requests = await Request.find(filter)
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('seekerId', 'name location.city')
    .lean()

  return NextResponse.json({ requests })
}

// POST — seeker creates a board request
export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const { title, description, skill, urgency, budget, city, expiresInDays = 7 } = body

  if (!title || !description || !skill || !urgency || !budget || !city) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  await dbConnect()

  const seeker = await User.findById(auth.user.id)
  if (!seeker) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (seeker.walletAddress) {
    const liveBalance = parseFloat(await getLiveBalance(seeker.walletAddress))
    if (liveBalance < budget) {
      return NextResponse.json(
        { error: `Insufficient AVAX: have ${liveBalance.toFixed(4)}, need ${budget}` },
        { status: 400 }
      )
    }
  }

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  const request = await Request.create({
    requestType: 'board',
    status: 'pending',
    seekerId: auth.user.id,
    jobDetails: { title, description, skill, urgency },
    budget: { amount: budget, currency: 'AVAX' },
    location: { city },
    boardData: {
      applications: [],
      expiresAt,
    },
    escrow: { contractJobId: '', txHash: '', status: 'held' },
    simulation: { providerLat: 0, providerLng: 0, estimatedMinutes: 0, currentStatus: 'accepted' },
  })

  // Trigger auto-bids from seed providers after 8 seconds
  simulateProviderBids(request._id.toString(), skill).catch(() => {})

  return NextResponse.json({ request }, { status: 201 })
}

// Auto-simulate 2-3 provider bids after delay
async function simulateProviderBids(requestId: string, skill: string) {
  await new Promise((r) => setTimeout(r, 8000))

  try {
    const { default: dbConnect } = await import('@/lib/mongodb')
    const { default: User } = await import('@/models/User')
    const { default: Request } = await import('@/models/Request')

    await dbConnect()

    const providers = await User.find({
      role: 'provider',
      'skills.skillName': { $regex: skill, $options: 'i' },
    })
      .limit(3)
      .lean()

    const request = await Request.findById(requestId)
    if (!request || request.status !== 'pending') return

    for (const provider of providers.slice(0, 2 + Math.floor(Math.random() * 2))) {
      const proposedAmount = request.budget.amount * (0.8 + Math.random() * 0.4)
      request.boardData?.applications.push({
        providerId: provider._id,
        proposedAmount: parseFloat(proposedAmount.toFixed(4)),
        message: `Hi! I'm experienced in ${skill} and available for your request. Let's connect!`,
        appliedAt: new Date(),
        status: 'pending',
      })
    }

    await request.save()
  } catch {
    // Silent — auto-bid is best-effort
  }
}
