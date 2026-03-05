'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import WalletCard from '@/components/wallet/WalletCard'

const SKILLS = ['Electrician', 'Plumber', 'Tailor', 'Mechanic', 'Cleaner', 'Tutor', 'Photographer', 'Carpenter', 'Painter', 'Graphic Designer']
const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Accra', 'Kumasi']

interface MatchResult {
  provider: {
    _id: string
    name: string
    skill: string
    professionalTitle: string
    city: string
    rateMin: number
    rateMax: number
    bio: string
    reputationScore: number
    jobCount: number
    walletAddress: string
    credentialTokenId?: string
  }
  score: number
  matchReason: string
}

export default function AutoMatchPage() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [skill, setSkill] = useState(SKILLS[0])
  const [urgency, setUrgency] = useState('today')
  const [budget, setBudget] = useState('0.1')
  const [city, setCity] = useState(CITIES[0])
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [requestId, setRequestId] = useState<string>('')
  const [booking, setBooking] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setWalletAddress(d.user?.walletAddress || ''))
  }, [])

  async function handleMatch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMatches([])

    try {
      const res = await fetch('/api/request/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, skill, urgency, budget: parseFloat(budget), city }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMatches(data.matches)
      setRequestId(data.requestId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Match failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleBook(providerId: string) {
    setBooking(providerId)
    setError('')
    try {
      const res = await fetch(`/api/request/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/seeker/job/${requestId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed')
      setBooking(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/seeker/dashboard" className="flex items-center gap-2">
          <span className="text-gray-400">←</span>
          <span className="font-semibold text-gray-700">Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="onchain-tag">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Joblad AI + Avalanche
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="md:col-span-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Auto-Match</h1>
            <p className="text-gray-500 text-sm mb-6">Describe what you need. Joblad AI finds your best match.</p>

            <form onSubmit={handleMatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">What do you need?</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. I need an experienced electrician to fix my living room wiring and install 3 new outlets"
                  rows={4}
                  required
                  className="input text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Skill Category</label>
                <select value={skill} onChange={(e) => setSkill(e.target.value)} className="input text-sm">
                  {SKILLS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Urgency</label>
                  <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="input text-sm">
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Budget (AVAX)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    step="0.01"
                    min="0.01"
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your City</label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="input text-sm">
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              {error && (
                <p className="text-error-500 text-sm bg-error-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button type="submit" disabled={loading || !description} className="btn-primary w-full py-3">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Joblad Agent is matching…
                  </span>
                ) : (
                  'Find My Match →'
                )}
              </button>
            </form>

            {walletAddress && (
              <div className="mt-6">
                <WalletCard address={walletAddress} compact />
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="md:col-span-2">
            {matches.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-gray-400">Fill in your request and Joblad Agent will match you with the best providers.</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4 animate-pulse">🔍</div>
                <p className="text-gray-500 font-medium">Joblad is analyzing {skill} providers…</p>
                <p className="text-gray-400 text-sm mt-1">Scoring expertise, rates, location, and availability</p>
              </div>
            )}

            <div className="space-y-4">
              {matches.map((match, i) => (
                <div key={match.provider._id} className={`card relative overflow-hidden ${i === 0 ? 'border-primary-300 border-2' : ''}`}>
                  {i === 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="badge-primary text-xs">Best Match</span>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-xl font-bold text-primary-600 flex-shrink-0">
                      {match.provider.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900">{match.provider.name}</h3>
                          <p className="text-sm text-gray-500">{match.provider.professionalTitle} · {match.provider.city}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary-600">{match.score}%</div>
                          <div className="text-xs text-gray-400">match</div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{match.matchReason}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="badge bg-gray-100 text-gray-600">
                          {match.provider.rateMin}–{match.provider.rateMax} AVAX
                        </span>
                        {match.provider.reputationScore > 0 && (
                          <span className="badge-success">
                            ⭐ {match.provider.reputationScore.toFixed(1)} on-chain
                          </span>
                        )}
                        {match.provider.credentialTokenId && (
                          <span className="badge-primary">🎖️ NFT Verified</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleBook(match.provider._id)}
                        disabled={booking !== null}
                        className="btn-primary text-sm py-2 px-6"
                      >
                        {booking === match.provider._id ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Creating escrow on Avalanche…
                          </span>
                        ) : (
                          `Book ${match.provider.name.split(' ')[0]}`
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
