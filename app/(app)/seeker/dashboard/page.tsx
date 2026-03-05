'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import WalletCard from '@/components/wallet/WalletCard'

interface UserData {
  name: string
  walletAddress: string
  avaxBalance: number
}

interface JobItem {
  _id: string
  requestType: string
  status: string
  jobDetails: { title: string; skill: string }
  budget: { amount: number; currency: string }
  escrow?: { txHash: string; status: string }
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-primary',
  accepted: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'badge-success',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function SeekerDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [jobs, setJobs] = useState<JobItem[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
    fetch('/api/request/my-jobs')
      .then((r) => r.json())
      .then((d) => setJobs(d.requests || []))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <span className="font-bold text-gray-900">Joblad</span>
          <span className="badge-primary">Seeker</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">Hi, {user?.name || '…'}</span>
          <Link href="/start" className="btn-ghost text-sm">Sign out</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Skill</h1>
        <p className="text-gray-500 mb-8">
          AI-powered matching or post a public request — all secured by Avalanche.
        </p>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link href="/seeker/auto-match" className="card hover:shadow-lg transition-all group border-primary-100">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600">Auto-Match</h2>
            <p className="text-gray-500 text-sm">
              Tell Joblad Agent what you need. Get your best 3 provider matches in seconds.
            </p>
            <div className="mt-4 text-primary-600 text-sm font-semibold">Find a match →</div>
          </Link>

          <Link href="/seeker/board" className="card hover:shadow-lg transition-all group">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600">Lad Board</h2>
            <p className="text-gray-500 text-sm">
              Post an open request. Providers bid. You pick the best offer. Escrow on Avalanche.
            </p>
            <div className="mt-4 text-primary-600 text-sm font-semibold">View board →</div>
          </Link>
        </div>

        {/* Wallet */}
        {user?.walletAddress && (
          <div className="max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Wallet</h2>
            <WalletCard address={user.walletAddress} />
          </div>
        )}

        {/* Job History */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Jobs</h2>
          {jobs.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No jobs yet. Use Auto-Match or the Lad Board to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/seeker/job/${job._id}`}
                  className="card flex items-center justify-between hover:shadow-md transition-all gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        {job.requestType === 'auto_match' ? '🤖 Auto-Match' : '📋 Board'}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{job.jobDetails.title}</p>
                    <p className="text-sm text-gray-500">{job.jobDetails.skill} · {job.budget.amount} {job.budget.currency}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`badge text-xs ${STATUS_COLORS[job.status] || 'badge-primary'}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    {job.escrow?.txHash && (
                      <a
                        href={`https://testnet.snowtrace.io/tx/${job.escrow.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-primary-500 underline"
                      >
                        🔒 Escrow →
                      </a>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* On-chain info */}
        <div className="mt-10 p-5 bg-primary-50 rounded-2xl border border-primary-100">
          <h3 className="text-sm font-bold text-primary-800 mb-3">🔗 How Avalanche Powers This Demo</h3>
          <ul className="space-y-2 text-sm text-primary-700">
            <li>🔒 When you book a provider, your AVAX is locked in <code className="bg-primary-100 px-1 rounded">JobladEscrow.sol</code></li>
            <li>⭐ When you release payment, provider&apos;s score updates in <code className="bg-primary-100 px-1 rounded">JobladReputation.sol</code></li>
            <li>🎖️ Providers with credential NFTs are verified on <code className="bg-primary-100 px-1 rounded">JobladCredentials.sol</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
