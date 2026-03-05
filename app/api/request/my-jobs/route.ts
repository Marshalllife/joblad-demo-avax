import { NextResponse } from 'next/server'
import { requireAuth } from '@/utils/session'
import dbConnect from '@/lib/mongodb'
import Request from '@/models/Request'

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  await dbConnect()

  const isProvider = auth.user.role === 'provider'

  const filter = isProvider
    ? { providerId: auth.user.id }
    : { seekerId: auth.user.id }

  const requests = await Request.find(filter)
    .sort({ createdAt: -1 })
    .limit(20)
    .populate(isProvider ? 'seekerId' : 'providerId', 'name skills location.city')
    .select('requestType status jobDetails budget escrow simulation createdAt reputationTxHash')
    .lean()

  return NextResponse.json({ requests })
}
