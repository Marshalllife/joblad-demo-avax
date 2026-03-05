import { NextRequest, NextResponse } from 'next/server'
import { getProviderReputationScore } from '@/services/blockchain/AvalancheService'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const score = await getProviderReputationScore(address)
  return NextResponse.json(score)
}
