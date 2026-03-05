import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { requireAuth } from '@/utils/session'
import dbConnect from '@/lib/mongodb'
import Request from '@/models/Request'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { proposedAmount, message } = await req.json()
  if (!proposedAmount) return NextResponse.json({ error: 'proposedAmount required' }, { status: 400 })

  await dbConnect()

  const request = await Request.findById(params.id)
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (request.requestType !== 'board') return NextResponse.json({ error: 'Not a board request' }, { status: 400 })
  if (request.status !== 'pending') return NextResponse.json({ error: 'Board request is closed' }, { status: 400 })
  if (request.boardData?.expiresAt && request.boardData.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Board request has expired' }, { status: 400 })
  }

  // Check already applied
  const alreadyApplied = request.boardData?.applications.some(
    (a: { providerId: { toString(): string } }) => a.providerId.toString() === auth.user.id
  )
  if (alreadyApplied) return NextResponse.json({ error: 'Already applied' }, { status: 400 })

  request.boardData?.applications.push({
    providerId: new mongoose.Types.ObjectId(auth.user.id),
    proposedAmount,
    message: message || '',
    appliedAt: new Date(),
    status: 'pending',
  })
  await request.save()

  return NextResponse.json({ success: true })
}
