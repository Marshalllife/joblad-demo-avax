import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Request from '@/models/Request'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect()
  const request = await Request.findById(params.id)
    .populate('seekerId', 'name location.city')
    .populate('providerId', 'name skills walletAddress')
    .populate('boardData.applications.providerId', 'name bio skills rate location credentialTokenId walletAddress')
    .lean()

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ request })
}
