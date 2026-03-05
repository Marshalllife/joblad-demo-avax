'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const SKILLS = ['Electrician', 'Plumber', 'Tailor', 'Mechanic', 'Cleaner', 'Tutor', 'Photographer', 'Carpenter', 'Painter', 'Graphic Designer']
const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Accra', 'Kumasi']

interface BoardRequest {
  _id: string
  jobDetails: { title: string; description: string; skill: string; urgency: string }
  budget: { amount: number; currency: string }
  location: { city: string }
  status: string
  boardData?: { applications: unknown[]; expiresAt: string }
  createdAt: string
}

export default function SeekerBoardPage() {
  const [requests, setRequests] = useState<BoardRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skill, setSkill] = useState(SKILLS[0])
  const [urgency, setUrgency] = useState('this_week')
  const [budget, setBudget] = useState('0.2')
  const [city, setCity] = useState(CITIES[0])

  async function loadRequests() {
    const res = await fetch('/api/request/board?mine=true')
    const data = await res.json()
    if (data.requests) setRequests(data.requests)
    setLoading(false)
  }

  useEffect(() => { loadRequests() }, [])

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    setPosting(true)
    setError('')
    try {
      const res = await fetch('/api/request/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, skill, urgency, budget: parseFloat(budget), city }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowForm(false)
      setTitle('')
      setDescription('')
      loadRequests()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setPosting(false)
    }
  }

  const urgencyLabel = (u: string) => ({ today: 'Today', this_week: 'This Week', flexible: 'Flexible' }[u] || u)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/seeker/dashboard" className="flex items-center gap-2">
          <span className="text-gray-400">←</span>
          <span className="font-semibold text-gray-700">Dashboard</span>
        </Link>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">
          + Post Request
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Lad Board</h1>
        <p className="text-gray-500 text-sm mb-8">
          Post a job. Providers bid. Pick the best. Escrow on Avalanche.
        </p>

        {/* Post form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Post a Request</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <form onSubmit={handlePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Job Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fix kitchen plumbing leak"
                    required
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you need in detail…"
                    rows={3}
                    required
                    className="input text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Skill</label>
                    <select value={skill} onChange={(e) => setSkill(e.target.value)} className="input text-sm">
                      {SKILLS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Urgency</label>
                    <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="input text-sm">
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="input text-sm">
                      {CITIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {error && <p className="text-error-500 text-sm bg-error-50 px-3 py-2 rounded-lg">{error}</p>}

                <button type="submit" disabled={posting} className="btn-primary w-full py-3">
                  {posting ? 'Posting…' : 'Post to Lad Board →'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Requests list */}
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading your requests…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="font-bold text-gray-900 mb-2">No requests yet</h3>
            <p className="text-gray-500 text-sm mb-6">Post your first request and providers will bid on it.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-3">
              + Post Your First Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const appCount = req.boardData?.applications?.length || 0
              const isActive = req.status === 'pending'

              return (
                <Link key={req._id} href={`/seeker/board/${req._id}`}>
                  <div className="card hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{req.jobDetails.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{req.jobDetails.skill} · {req.location.city}</p>
                      </div>
                      <span className={`badge ${isActive ? 'badge-primary' : 'bg-gray-100 text-gray-600'}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{req.jobDetails.description}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="badge bg-gray-100 text-gray-600">
                        {req.budget.amount} {req.budget.currency}
                      </span>
                      <span className="badge bg-gray-100 text-gray-600">
                        {urgencyLabel(req.jobDetails.urgency)}
                      </span>
                      {appCount > 0 && (
                        <span className="badge-primary">
                          {appCount} bid{appCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Posted {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
