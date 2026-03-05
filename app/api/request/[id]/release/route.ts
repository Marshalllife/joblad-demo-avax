import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/utils/session'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Request from '@/models/Request'
import { releaseEscrow, updateReputation } from '@/services/blockchain/EscrowService'
import { releaseToProvider } from '@/services/wallet/WalletService'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { rating } = await req.json()
  const finalRating = Math.min(5, Math.max(1, rating || 5))

  await dbConnect()

  const request = await Request.findById(params.id)
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (request.seekerId.toString() !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (request.escrow?.status === 'released') {
    return NextResponse.json({ error: 'Already released' }, { status: 400 })
  }

  if (!request.providerId) {
    return NextResponse.json({ error: 'No provider assigned to this job' }, { status: 400 })
  }

  const [seekerUser, providerUser] = await Promise.all([
    User.findById(auth.user.id),
    User.findById(request.providerId),
  ])

  if (!seekerUser) {
    return NextResponse.json({ error: 'Seeker account not found' }, { status: 404 })
  }
  if (!providerUser) {
    return NextResponse.json({ error: `Provider account not found (id: ${request.providerId})` }, { status: 404 })
  }

  //  Release escrow on-chain
  const releaseResult = await releaseEscrow(seekerUser, params.id)

  //  Update provider reputation on-chain (admin wallet)
  const repResult = await updateReputation(providerUser.walletAddress, finalRating)

  // Update DB balances
  await releaseToProvider(seekerUser._id, providerUser._id, request.budget.amount)

  // Update request
  await Request.findByIdAndUpdate(params.id, {
    status: 'completed',
    rating: finalRating,
    'escrow.status': 'released',
    'escrow.releaseTxHash': releaseResult.txHash,
    'simulation.currentStatus': 'completed',
    'simulation.completedAt': new Date(),
    reputationTxHash: repResult.txHash,
  })

  return NextResponse.json({
    success: true,
    releaseTxHash: releaseResult.txHash,
    releaseSnowtrace: releaseResult.snowtraceLink,
    reputationTxHash: repResult.txHash,
    reputationSnowtrace: repResult.snowtraceLink,
    providerName: providerUser.name,
    rating: finalRating,
  })
}
