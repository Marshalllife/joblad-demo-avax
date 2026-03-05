import { SessionOptions, IronSession } from 'iron-session'

export interface SessionUser {
  id: string
  email: string
  role: 'seeker' | 'provider' | null
  walletAddress: string
  name: string
}

export interface SessionData {
  user?: SessionUser
}

export type AppSession = IronSession<SessionData>

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'joblad-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  },
}
