import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/utils/session'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Request from '@/models/Request'
import { createEscrow } from '@/services/blockchain/EscrowService'
import { lockBalance } from '@/services/wallet/WalletService'
import { getLiveBalance } from '@/services/wallet/WalletService'
import { toJobId } from '@/utils/avalanche'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { providerId } = await req.json()
  if (!providerId) return NextResponse.json({ error: 'providerId required' }, { status: 400 })

  await dbConnect()

  const [request, seekerUser, providerUser] = await Promise.all([
    Request.findById(params.id),
    User.findById(auth.user.id),
    User.findById(providerId),
  ])

  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (request.seekerId.toString() !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
  }
  if (!seekerUser || !providerUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check on-chain balance
  const liveBalance = parseFloat(await getLiveBalance(seekerUser.walletAddress))
  if (liveBalance < request.budget.amount) {
    return NextResponse.json(
      { error: `Insufficient AVAX. You have ${liveBalance.toFixed(4)} but need ${request.budget.amount}` },
      { status: 400 }
    )
  }

  // Create on-chain escrow — this deducts AVAX from seeker's actual wallet
  const escrowResult = await createEscrow(
    seekerUser,
    params.id,
    providerUser.walletAddress,
    request.budget.amount
  )

  // Generate job simulation starting coordinates (provider starts ~5km away)
  const seekerCoords = request.location?.coordinates || [3.3792, 6.5244]
  const providerStart = [
    seekerCoords[0] + (Math.random() - 0.5) * 0.1,
    seekerCoords[1] + (Math.random() - 0.5) * 0.1,
  ]

  // Update request
  await Request.findByIdAndUpdate(params.id, {
    status: 'accepted',
    providerId,
    escrow: {
      contractJobId: escrowResult.contractJobId,
      txHash: escrowResult.txHash,
      status: 'held',
    },
    simulation: {
      providerLat: providerStart[1],
      providerLng: providerStart[0],
      estimatedMinutes: Math.floor(Math.random() * 20) + 5,
      currentStatus: 'accepted',
    },
  })

  // Track in DB
  await lockBalance(seekerUser._id, request.budget.amount)

  return NextResponse.json({
    success: true,
    txHash: escrowResult.txHash,
    snowtraceLink: escrowResult.snowtraceLink,
    requestId: params.id,
  })
}
