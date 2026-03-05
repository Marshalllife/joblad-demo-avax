'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type SimStatus = 'accepted' | 'on_the_way' | 'arrived' | 'working' | 'completed'

const STATUS_FLOW: SimStatus[] = ['accepted', 'on_the_way', 'arrived', 'working', 'completed']
const STATUS_LABELS: Record<SimStatus, string> = {
  accepted: 'Accepted',
  on_the_way: 'On The Way',
  arrived: 'Arrived',
  working: 'Working',
  completed: 'Completed',
}
const STATUS_ACTIONS: Partial<Record<SimStatus, string>> = {
  accepted: "I'm on my way",
  on_the_way: "I've arrived",
  arrived: 'Start work',
  working: 'Mark complete',
}

interface JobData {
  _id: string
  status: string
  jobDetails: { title: string; description: string; skill: string }
  budget: { amount: number; currency: string }
  location: { city: string }
  seekerId?: { name: string; walletAddress: string }
  escrow?: { txHash: string; status: string }
  simulation?: { currentStatus: SimStatus; estimatedMinutes: number }
}

export default function ProviderJobPage() {
  const params = useParams()
  const requestId = params.id as string

  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStatus, setCurrentStatus] = useState<SimStatus>('accepted')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/request/${requestId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.request) {
          setJob(d.request)
          setCurrentStatus(d.request.simulation?.currentStatus || 'accepted')
        }
      })
      .finally(() => setLoading(false))
  }, [requestId])

  async function advanceStatus() {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus)
    if (currentIndex >= STATUS_FLOW.length - 1) return

    setUpdating(true)
    setError('')
    const nextStatus = STATUS_FLOW[currentIndex + 1]

    try {
      const res = await fetch(`/api/request/${requestId}/provider-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrentStatus(nextStatus)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const snowtrace = (tx: string) => `https://testnet.snowtrace.io/tx/${tx}`

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
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

  const actionLabel = STATUS_ACTIONS[currentStatus]
  const isComplete = currentStatus === 'completed'
  const escrowTx = job.escrow?.txHash

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/provider/dashboard" className="flex items-center gap-2">
          <span className="text-gray-400">←</span>
          <span className="font-semibold text-gray-700">Dashboard</span>
        </Link>
        <div className="onchain-tag">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Escrow on Avalanche
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Status badge */}
        <div className="card text-center py-8">
          <div className="text-5xl mb-3">
            {isComplete ? '🎉' : currentStatus === 'working' ? '🔧' : currentStatus === 'on_the_way' ? '🚗' : currentStatus === 'arrived' ? '📍' : '✅'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{STATUS_LABELS[currentStatus]}</h1>
          <p className="text-gray-500 text-sm">
            {isComplete
              ? 'Seeker will release payment from escrow shortly.'
              : `Update your status as you progress with the job.`}
          </p>
        </div>

        {/* Job details */}
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900">Job Details</h2>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Task</p>
            <p className="text-gray-900 font-medium">{job.jobDetails.title}</p>
            <p className="text-gray-500 text-sm mt-1">{job.jobDetails.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Category</p>
              <p className="text-gray-900">{job.jobDetails.skill}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Location</p>
              <p className="text-gray-900">{job.location?.city || 'Lagos'}</p>
            </div>
          </div>
          {job.seekerId && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Client</p>
              <p className="text-gray-900">{job.seekerId.name}</p>
            </div>
          )}
        </div>

        {/* Escrow card */}
        <div className="card bg-primary-50 border-primary-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-primary-900">Escrow</h3>
            <span className="badge-primary">{job.escrow?.status || 'held'}</span>
          </div>
          <div className="text-3xl font-bold text-primary-600 mb-1">
            {job.budget.amount} {job.budget.currency}
          </div>
          <p className="text-xs text-primary-700 mb-3">
            {isComplete ? 'Awaiting release from client' : 'Locked on Avalanche — released when job is confirmed complete'}
          </p>
          {escrowTx && (
            <a href={snowtrace(escrowTx)} target="_blank" rel="noreferrer"
              className="text-xs text-primary-600 underline">
              🔒 View on Snowtrace →
            </a>
          )}
        </div>

        {/* Status progression */}
        {!isComplete && actionLabel && (
          <div>
            {error && <p className="text-error-500 text-sm mb-3">{error}</p>}
            <button
              onClick={advanceStatus}
              disabled={updating}
              className="btn-primary w-full py-4 text-base"
            >
              {updating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Updating…
                </span>
              ) : (
                actionLabel + ' →'
              )}
            </button>
          </div>
        )}

        {isComplete && (
          <div className="card border-success-200 bg-success-50 text-center">
            <p className="text-success-800 font-semibold">
              ✅ Waiting for {job.seekerId?.name || 'client'} to release payment from escrow.
            </p>
            <p className="text-success-700 text-sm mt-1">
              You&apos;ll receive {job.budget.amount} {job.budget.currency} directly to your wallet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
