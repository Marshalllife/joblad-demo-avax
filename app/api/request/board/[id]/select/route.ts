import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/utils/session'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Request from '@/models/Request'
import { createEscrow } from '@/services/blockchain/EscrowService'
import { lockBalance, getLiveBalance } from '@/services/wallet/WalletService'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { applicationId } = await req.json()
  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })

  await dbConnect()

  const request = await Request.findById(params.id)
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (request.seekerId.toString() !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Already processed' }, { status: 400 })
  }

  type AppEntry = { _id?: { toString(): string }; providerId: { toString(): string }; proposedAmount?: number; status: string }
  const application = (request.boardData?.applications as AppEntry[]).find(
    (a) => a._id?.toString() === applicationId || a.providerId.toString() === applicationId
  )
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const [seekerUser, providerUser] = await Promise.all([
    User.findById(auth.user.id),
    User.findById(application.providerId),
  ])

  if (!seekerUser || !providerUser) {
    return NextResponse.json({ error: 'Users not found' }, { status: 404 })
  }

  const escrowAmount = application.proposedAmount || request.budget.amount

  // Check on-chain balance
  const liveBalance = parseFloat(await getLiveBalance(seekerUser.walletAddress))
  if (liveBalance < escrowAmount) {
    return NextResponse.json(
      { error: `Insufficient AVAX: have ${liveBalance.toFixed(4)}, need ${escrowAmount}` },
      { status: 400 }
    )
  }

  // Create on-chain escrow
  const escrowResult = await createEscrow(
    seekerUser,
    params.id,
    providerUser.walletAddress,
    escrowAmount
  )

  // Update all applications — mark selected, reject others
  for (const app of (request.boardData?.applications || []) as AppEntry[]) {
    app.status = app.providerId.toString() === application.providerId.toString() ? 'selected' : 'rejected'
  }

  const coords = request.location?.coordinates
  const seekerCoords = coords && coords.length >= 2 ? coords : [3.3792, 6.5244]
  const providerStart = [
    seekerCoords[0] + (Math.random() - 0.5) * 0.1,
    seekerCoords[1] + (Math.random() - 0.5) * 0.1,
  ]

  request.status = 'accepted'
  request.providerId = application.providerId
  request.budget.amount = escrowAmount
  request.escrow = {
    contractJobId: escrowResult.contractJobId,
    txHash: escrowResult.txHash,
    status: 'held',
  }
  request.simulation = {
    providerLat: providerStart[1],
    providerLng: providerStart[0],
    estimatedMinutes: Math.floor(Math.random() * 20) + 5,
    currentStatus: 'accepted',
  }
  if (request.boardData) {
    request.boardData.selectedApplicationId = application.providerId
  }

  await request.save()
  await lockBalance(seekerUser._id, escrowAmount)

  return NextResponse.json({
    success: true,
    txHash: escrowResult.txHash,
    snowtraceLink: escrowResult.snowtraceLink,
    requestId: params.id,
    providerName: providerUser.name,
  })
}
