'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Application {
  _id: string
  providerId: {
    _id: string
    name: string
    professionalTitle?: string
    city?: string
    reputationScore?: number
    credentialTokenId?: string
  }
  proposedAmount: number
  message: string
  status: string
  appliedAt: string
}

interface BoardRequest {
  _id: string
  jobDetails: { title: string; description: string; skill: string; urgency: string }
  budget: { amount: number; currency: string }
  location: { city: string }
  status: string
  boardData?: {
    applications: Application[]
    expiresAt: string
    selectedApplicationId?: string
  }
  escrow?: { txHash: string }
  createdAt: string
}

export default function BoardRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  const [request, setRequest] = useState<BoardRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/request/board/${requestId}`)
      .then((r) => r.json())
      .then((d) => { if (d.request) setRequest(d.request) })
      .finally(() => setLoading(false))
  }, [requestId])

  async function handleSelect(applicationId: string) {
    setSelecting(applicationId)
    setError('')
    try {
      const res = await fetch(`/api/request/board/${requestId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/seeker/job/${requestId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Selection failed')
      setSelecting(null)
    }
  }

  const snowtrace = (tx: string) => `https://testnet.snowtrace.io/tx/${tx}`
  const urgencyLabel = (u: string) => ({ today: 'Today', this_week: 'This Week', flexible: 'Flexible' }[u] || u)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Request not found.</p>
      </div>
    )
  }

  const applications = request.boardData?.applications || []
  const isPending = request.status === 'pending'
  const isAccepted = request.status === 'accepted'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/seeker/board" className="flex items-center gap-2">
          <span className="text-gray-400">←</span>
          <span className="font-semibold text-gray-700">Lad Board</span>
        </Link>
        <div className="onchain-tag">
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
          Avalanche Escrow
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Request details */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">{request.jobDetails.title}</h1>
            <span className={`badge ${isPending ? 'badge-primary' : 'bg-gray-100 text-gray-600'}`}>
              {request.status}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-4">{request.jobDetails.description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-gray-100 text-gray-600">{request.jobDetails.skill}</span>
            <span className="badge bg-gray-100 text-gray-600">{request.location.city}</span>
            <span className="badge bg-gray-100 text-gray-600">{urgencyLabel(request.jobDetails.urgency)}</span>
            <span className="badge bg-gray-100 text-gray-600">
              Budget: {request.budget.amount} {request.budget.currency}
            </span>
          </div>
        </div>

        {/* Accepted — show job tracker link */}
        {isAccepted && (
          <div className="bg-success-50 border border-success-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-success-800 mb-1">✅ Provider Selected — Job Active!</h3>
            {request.escrow?.txHash && (
              <p className="text-success-700 text-sm mb-3">
                Escrow created on Avalanche.{' '}
                <a href={snowtrace(request.escrow.txHash)} target="_blank" rel="noreferrer"
                  className="underline">View on Snowtrace →</a>
              </p>
            )}
            <Link href={`/seeker/job/${requestId}`} className="btn-primary text-sm px-4 py-2">
              Track Job →
            </Link>
          </div>
        )}

        {/* Applications */}
        <div>
          <h2 className="font-bold text-gray-900 mb-4">
            {applications.length === 0 ? 'No bids yet' : `${applications.length} Bid${applications.length !== 1 ? 's' : ''}`}
          </h2>

          {error && <p className="text-error-500 text-sm bg-error-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

          {applications.length === 0 && isPending && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">⏳</div>
              <p>Providers are being notified. Bids will appear here shortly.</p>
            </div>
          )}

          <div className="space-y-4">
            {applications.map((app) => {
              const isSelected = request.boardData?.selectedApplicationId?.toString() === app.providerId._id?.toString()
              const isRejected = app.status === 'rejected'

              return (
                <div
                  key={app._id}
                  className={`card ${isSelected ? 'border-success-300 border-2 bg-success-50' : ''} ${isRejected ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-bold flex-shrink-0">
                      {app.providerId.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{app.providerId.name}</h3>
                          <p className="text-sm text-gray-500">
                            {app.providerId.professionalTitle || 'Provider'}
                            {app.providerId.city && ` · ${app.providerId.city}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary-600">{app.proposedAmount} AVAX</div>
                          {app.proposedAmount < request.budget.amount && (
                            <div className="text-xs text-success-600">Under budget</div>
                          )}
                        </div>
                      </div>

                      {app.message && (
                        <p className="text-sm text-gray-600 mb-3">{app.message}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {app.providerId.reputationScore && app.providerId.reputationScore > 0 && (
                          <span className="badge-success text-xs">
                            ⭐ {app.providerId.reputationScore.toFixed(1)} on-chain
                          </span>
                        )}
                        {app.providerId.credentialTokenId && (
                          <span className="badge-primary text-xs">🎖️ NFT Verified</span>
                        )}
                        {isSelected && <span className="badge-success text-xs">✓ Selected</span>}
                      </div>

                      {isPending && !isRejected && (
                        <button
                          onClick={() => handleSelect(app._id || app.providerId._id)}
                          disabled={selecting !== null}
                          className="btn-primary text-sm py-2 px-5"
                        >
                          {selecting === (app._id || app.providerId._id) ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              Creating escrow…
                            </span>
                          ) : (
                            `Select ${app.providerId.name.split(' ')[0]} →`
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
