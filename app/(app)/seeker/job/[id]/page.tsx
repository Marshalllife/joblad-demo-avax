'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import StatusTimeline from '@/components/job/StatusTimeline'
import { useJobStatus, type JobStatus } from '@/hooks/useJobStatus'

const MapView = dynamic(() => import('@/components/job/MapView'), { ssr: false })

// Seeker's city coords (Lagos default)
const SEEKER_LAT = 6.5244
const SEEKER_LNG = 3.3792

interface JobData {
  _id: string
  status: string
  jobDetails: {
    title: string
    description: string
    skill: string
  }
  budget: { amount: number; currency: string }
  escrow: {
    txHash: string
    status: string
    releaseTxHash?: string
  }
  providerId?: {
    name: string
    walletAddress: string
    professionalTitle?: string
  }
  simulation: {
    providerLat: number
    providerLng: number
    estimatedMinutes: number
    currentStatus: string
  }
  rating?: number
  reputationTxHash?: string
}

export default function SeekerJobPage() {
  const params = useParams()
  const requestId = params.id as string

  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)
  const [releasing, setReleasing] = useState(false)
  const [rating, setRating] = useState(5)
  const [showRating, setShowRating] = useState(false)
  const [released, setReleased] = useState(false)
  const [releaseTxHash, setReleaseTxHash] = useState('')
  const [reputationTxHash, setReputationTxHash] = useState('')
  const [error, setError] = useState('')
  const [timestamps, setTimestamps] = useState<Partial<Record<JobStatus, string>>>({})

  const { update } = useJobStatus(requestId)

  const [providerPos, setProviderPos] = useState({ lat: SEEKER_LAT + 0.05, lng: SEEKER_LNG + 0.05 })
  const [currentStatus, setCurrentStatus] = useState<JobStatus>('accepted')
  const animFrameRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load initial job data
  useEffect(() => {
    fetch(`/api/request/${requestId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.request) {
          setJob(d.request)
          setCurrentStatus(d.request.simulation?.currentStatus || 'accepted')
          // Don't set providerPos from DB — SSE drives position to ensure correct animation
          if (d.request.status === 'completed' && d.request.escrow?.status === 'released') {
            setReleased(true)
            setReleaseTxHash(d.request.escrow.releaseTxHash || '')
            setReputationTxHash(d.request.reputationTxHash || '')
          }
        }
      })
      .finally(() => setLoading(false))
  }, [requestId])

  // Process SSE updates
  useEffect(() => {
    if (!update) return

    setCurrentStatus(update.status)
    setTimestamps((prev) => ({ ...prev, [update.status]: update.timestamp }))

    // Update provider position directly from SSE data
    if (update.providerLat && update.providerLng) {
      // Cancel any running animation
      if (animFrameRef.current) {
        clearTimeout(animFrameRef.current)
        animFrameRef.current = null
      }
      if (update.status === 'on_the_way') {
        // Smooth interpolation toward the new server position
        animateProvider(providerPos.lat, providerPos.lng, update.providerLat, update.providerLng, 8)
      } else {
        setProviderPos({ lat: update.providerLat, lng: update.providerLng })
      }
    }

    if (update.status === 'completed') {
      setShowRating(true)
    }
  }, [update]) // eslint-disable-line react-hooks/exhaustive-deps

  function animateProvider(fromLat: number, fromLng: number, toLat: number, toLng: number, steps: number) {
    let step = 0
    const dLat = (toLat - fromLat) / steps
    const dLng = (toLng - fromLng) / steps

    function tick() {
      step++
      setProviderPos({
        lat: fromLat + dLat * step,
        lng: fromLng + dLng * step,
      })
      if (step < steps) {
        animFrameRef.current = setTimeout(tick, 800)
      }
    }
    tick()
  }

  async function handleRelease() {
    setReleasing(true)
    setError('')
    try {
      const res = await fetch(`/api/request/${requestId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReleaseTxHash(data.releaseTxHash)
      setReputationTxHash(data.reputationTxHash)
      setReleased(true)
      setShowRating(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Release failed')
    } finally {
      setReleasing(false)
    }
  }

  const snowtrace = (tx: string) => `https://testnet.snowtrace.io/tx/${tx}`

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading job tracker…</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Job not found.</p>
      </div>
    )
  }

  const providerName = job.providerId?.name || 'Provider'
  const escrowTx = job.escrow?.txHash

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/seeker/dashboard" className="flex items-center gap-2">
          <span className="text-gray-400">←</span>
          <span className="font-semibold text-gray-700">Dashboard</span>
        </Link>
        <div className="onchain-tag">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live on Avalanche
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{job.jobDetails.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {job.jobDetails.skill} · {job.budget.amount} {job.budget.currency} in escrow
          </p>
        </div>

        {/* Completed banner */}
        {released && (
          <div className="bg-success-50 border border-success-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-success-800 text-lg mb-1">🎉 Job Completed & Payment Released!</h3>
            <p className="text-success-700 text-sm mb-3">
              {job.budget.amount} {job.budget.currency} sent to {providerName}. Reputation updated on-chain.
            </p>
            <div className="flex flex-wrap gap-3">
              {releaseTxHash && (
                <a href={snowtrace(releaseTxHash)} target="_blank" rel="noreferrer"
                  className="text-xs text-success-700 underline flex items-center gap-1">
                  ✅ Payment tx →
                </a>
              )}
              {reputationTxHash && (
                <a href={snowtrace(reputationTxHash)} target="_blank" rel="noreferrer"
                  className="text-xs text-success-700 underline flex items-center gap-1">
                  ⭐ Reputation tx →
                </a>
              )}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-6">
          {/* Left: Timeline + actions */}
          <div className="md:col-span-2 space-y-6">
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-5">Job Status</h2>
              <StatusTimeline currentStatus={currentStatus} timestamps={timestamps} />
            </div>

            {/* Provider info */}
            {job.providerId && (
              <div className="card">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Provider</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-bold">
                    {providerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{providerName}</p>
                    <p className="text-sm text-gray-500">{job.providerId.professionalTitle || job.jobDetails.skill}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400 font-mono truncate">
                  {job.providerId.walletAddress}
                </div>
              </div>
            )}

            {/* Escrow info */}
            <div className="card">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Escrow</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Amount locked</span>
                <span className="font-bold text-primary-600">{job.budget.amount} AVAX</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`badge ${job.escrow?.status === 'released' ? 'badge-success' : 'badge-primary'}`}>
                  {job.escrow?.status || 'held'}
                </span>
              </div>
              {escrowTx && (
                <a href={snowtrace(escrowTx)} target="_blank" rel="noreferrer"
                  className="text-xs text-primary-600 underline">
                  🔒 View escrow on Snowtrace →
                </a>
              )}
            </div>

            {/* Rating modal */}
            {showRating && !released && (
              <div className="card border-success-200 border-2">
                <h3 className="font-bold text-gray-900 mb-3">Release Payment</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Rate your experience with {providerName} before releasing {job.budget.amount} AVAX.
                </p>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform ${star <= rating ? 'scale-110' : 'opacity-40'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                {error && <p className="text-error-500 text-sm mb-3">{error}</p>}
                <button
                  onClick={handleRelease}
                  disabled={releasing}
                  className="btn-primary w-full py-3"
                >
                  {releasing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Releasing on Avalanche…
                    </span>
                  ) : (
                    `Release ${job.budget.amount} AVAX →`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right: Map */}
          <div className="md:col-span-3">
            <div className="card p-0 overflow-hidden h-[500px]">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 text-sm">Live Tracking</h2>
                {currentStatus === 'on_the_way' && (
                  <span className="text-xs text-amber-600 font-medium animate-pulse">
                    🔶 Provider en route
                  </span>
                )}
                {currentStatus === 'arrived' && (
                  <span className="text-xs text-success-600 font-medium">✅ Provider arrived!</span>
                )}
                {currentStatus === 'working' && (
                  <span className="text-xs text-primary-600 font-medium">🔧 Working…</span>
                )}
              </div>
              <div className="h-[452px]">
                <MapView
                  seekerLat={SEEKER_LAT}
                  seekerLng={SEEKER_LNG}
                  providerLat={providerPos.lat}
                  providerLng={providerPos.lng}
                  status={currentStatus}
                />
              </div>
            </div>

            {/* On-chain activity feed */}
            <div className="mt-4 card">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">On-Chain Activity</h3>
              <div className="space-y-2 text-xs">
                {escrowTx && (
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                    <span className="text-gray-700">🔒 Escrow created — {job.budget.amount} AVAX locked</span>
                    <a href={snowtrace(escrowTx)} target="_blank" rel="noreferrer"
                      className="text-primary-600 underline">view</a>
                  </div>
                )}
                {releaseTxHash && (
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                    <span className="text-gray-700">✅ Payment released to {providerName}</span>
                    <a href={snowtrace(releaseTxHash)} target="_blank" rel="noreferrer"
                      className="text-success-600 underline">view</a>
                  </div>
                )}
                {reputationTxHash && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-gray-700">⭐ Reputation score updated on Avalanche</span>
                    <a href={snowtrace(reputationTxHash)} target="_blank" rel="noreferrer"
                      className="text-success-600 underline">view</a>
                  </div>
                )}
                {!escrowTx && !releaseTxHash && (
                  <p className="text-gray-400">No on-chain activity yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
