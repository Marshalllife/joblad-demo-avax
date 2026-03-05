'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const SKILLS = ['All', 'Electrician', 'Plumber', 'Tailor', 'Mechanic', 'Cleaner', 'Tutor', 'Photographer', 'Carpenter', 'Painter', 'Graphic Designer']

interface BoardRequest {
  _id: string
  jobDetails: { title: string; description: string; skill: string; urgency: string }
  budget: { amount: number; currency: string }
  location: { city: string }
  status: string
  boardData?: { applications: unknown[]; expiresAt: string }
  createdAt: string
}

export default function ProviderBoardPage() {
  const [requests, setRequests] = useState<BoardRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [skillFilter, setSkillFilter] = useState('All')
  const [applying, setApplying] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [proposedAmounts, setProposedAmounts] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [showApplyForm, setShowApplyForm] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const url = skillFilter === 'All' ? '/api/request/board' : `/api/request/board?skill=${skillFilter}`
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (d.requests) setRequests(d.requests) })
      .finally(() => setLoading(false))
  }, [skillFilter])

  async function handleApply(requestId: string, budget: number) {
    setApplying(requestId)
    setError('')
    const proposedAmount = parseFloat(proposedAmounts[requestId] || String(budget))
    const message = messages[requestId] || ''

    try {
      const res = await fetch(`/api/request/board/${requestId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedAmount, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAppliedIds((prev) => { const next = new Set(prev); next.add(requestId); return next })
      setShowApplyForm(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Application failed')
    } finally {
      setApplying(null)
    }
  }

  const urgencyLabel = (u: string) => ({ today: '🔴 Today', this_week: '🟡 This Week', flexible: '🟢 Flexible' }[u] || u)
  const urgencyBadge = (u: string) => ({
    today: 'bg-red-100 text-red-700',
    this_week: 'bg-amber-100 text-amber-700',
    flexible: 'bg-green-100 text-green-700',
  }[u] || 'bg-gray-100 text-gray-600')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/provider/dashboard" className="flex items-center gap-2">
          <span className="text-gray-400">←</span>
          <span className="font-semibold text-gray-700">Dashboard</span>
        </Link>
        <div className="onchain-tag">
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
          Lad Board
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Open Requests</h1>
        <p className="text-gray-500 text-sm mb-6">
          Browse jobs posted by seekers. Bid with your rate. Seeker picks the best.
        </p>

        {/* Skill filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => { setSkillFilter(s); setLoading(true) }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                skillFilter === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <p className="text-error-500 text-sm bg-error-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading requests…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-500">No open requests right now. Check back later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const applied = appliedIds.has(req._id)
              const isOpen = showApplyForm === req._id

              return (
                <div key={req._id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{req.jobDetails.title}</h3>
                      <p className="text-sm text-gray-500">{req.jobDetails.skill} · {req.location.city}</p>
                    </div>
                    <span className={`badge text-xs ${urgencyBadge(req.jobDetails.urgency)}`}>
                      {urgencyLabel(req.jobDetails.urgency)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{req.jobDetails.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="badge bg-gray-100 text-gray-600 font-semibold">
                      Budget: {req.budget.amount} {req.budget.currency}
                    </span>
                    {req.boardData?.applications && (req.boardData.applications as unknown[]).length > 0 && (
                      <span className="badge bg-primary-50 text-primary-700">
                        {(req.boardData.applications as unknown[]).length} bid(s)
                      </span>
                    )}
                  </div>

                  {applied ? (
                    <div className="text-success-600 text-sm font-medium flex items-center gap-1.5">
                      ✅ Application submitted
                    </div>
                  ) : isOpen ? (
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Your Rate (AVAX)</label>
                          <input
                            type="number"
                            value={proposedAmounts[req._id] || req.budget.amount}
                            onChange={(e) => setProposedAmounts((p) => ({ ...p, [req._id]: e.target.value }))}
                            step="0.01"
                            min="0.01"
                            className="input text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Message (optional)</label>
                        <textarea
                          value={messages[req._id] || ''}
                          onChange={(e) => setMessages((p) => ({ ...p, [req._id]: e.target.value }))}
                          placeholder="Tell the seeker why you're the best fit…"
                          rows={2}
                          className="input text-sm resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApply(req._id, req.budget.amount)}
                          disabled={applying === req._id}
                          className="btn-primary text-sm py-2 px-5 flex-1"
                        >
                          {applying === req._id ? 'Submitting…' : 'Submit Bid →'}
                        </button>
                        <button onClick={() => setShowApplyForm(null)} className="btn-ghost text-sm py-2 px-3">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowApplyForm(req._id)}
                      className="btn-primary text-sm py-2 px-5"
                    >
                      Apply →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
