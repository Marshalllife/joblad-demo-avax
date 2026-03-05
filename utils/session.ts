import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData, type SessionUser } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function requireAuth(): Promise<
  { session: Awaited<ReturnType<typeof getSession>>; user: SessionUser } | NextResponse
> {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse
  }
  return { session, user: session.user }
}
