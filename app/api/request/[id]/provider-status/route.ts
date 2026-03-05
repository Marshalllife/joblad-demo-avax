import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/utils/session'
import dbConnect from '@/lib/mongodb'
import Request from '@/models/Request'

const VALID_STATUSES = ['on_the_way', 'arrived', 'working', 'completed']

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { status } = await req.json()
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  await dbConnect()

  const request = await Request.findById(params.id)
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (request.providerId?.toString() !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (request.simulation) {
    request.simulation.currentStatus = status
    if (status === 'completed') {
      request.simulation.completedAt = new Date()
    }
    if (status === 'working') {
      request.status = 'in_progress'
    }
  }

  await request.save()
  return NextResponse.json({ success: true, status })
}
