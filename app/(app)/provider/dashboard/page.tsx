'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import WalletCard from '@/components/wallet/WalletCard'

interface UserData {
  name: string
  walletAddress: string
  skills: Array<{ skillName: string; professionalTitle: string }>
  credentialTokenId: string | null
  credentialTxHash: string | null
  location: { city: string }
}

interface ReputationData {
  average: number
  jobCount: number
}

interface JobItem {
  _id: string
  status: string
  jobDetails: { title: string; skill: string }
  budget: { amount: number; currency: string }
  escrow?: { txHash: string; releaseTxHash?: string; status: string }
  reputationTxHash?: string
  seekerId?: { name: string }
}

export default function ProviderDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [rep, setRep] = useState<ReputationData | null>(null)
  const [jobs, setJobs] = useState<JobItem[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(async (d) => {
        setUser(d.user)
        if (d.user?.walletAddress) {
          try {
            const repRes = await fetch(`/api/provider/reputation?address=${d.user.walletAddress}`)
            if (repRes.ok) setRep(await repRes.json())
          } catch { /* no rep yet */ }
        }
      })
    fetch('/api/request/my-jobs')
      .then((r) => r.json())
      .then((d) => setJobs(d.requests || []))
  }, [])

  const skill = user?.skills?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <span className="font-bold text-gray-900">Joblad</span>
          <span className="badge bg-success-50 text-success-600">Provider</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">Hi, {user?.name || '…'}</span>
          <Link href="/start" className="btn-ghost text-sm">Sign out</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Dashboard</h1>
        <p className="text-gray-500 mb-8">
          {skill?.professionalTitle || 'Skill provider'} · {user?.location?.city || 'Africa'}
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Credential */}
          <Link href="/provider/credentials" className="card hover:shadow-lg transition-all group border-primary-100">
            <div className="text-4xl mb-3">{user?.credentialTokenId ? '🎖️' : '➕'}</div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-primary-600">
              {user?.credentialTokenId ? 'Credential Minted' : 'Mint Credential NFT'}
            </h3>
            <p className="text-sm text-gray-500">
              {user?.credentialTokenId
                ? `Token #${user.credentialTokenId} on Avalanche`
                : 'Verify your skill on-chain'}
            </p>
          </Link>

          {/* Board */}
          <Link href="/provider/board" className="card hover:shadow-lg transition-all group">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-primary-600">Lad Board</h3>
            <p className="text-sm text-gray-500">Browse open requests and bid on jobs</p>
          </Link>

          {/* Reputation */}
          <div className="card border-success-500 border">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="font-bold text-gray-900 mb-1">On-Chain Score</h3>
            {rep ? (
              <div>
                <div className="text-2xl font-bold text-success-600">
                  {rep.average.toFixed(1)}<span className="text-sm text-gray-400">/5</span>
                </div>
                <p className="text-xs text-gray-500">{rep.jobCount} jobs completed</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Complete jobs to build your score</p>
            )}
          </div>
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
              <p className="text-sm">No jobs assigned yet. Browse the Lad Board or wait to be matched.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/provider/job/${job._id}`}
                  className="card flex items-center justify-between hover:shadow-md transition-all gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{job.jobDetails.title}</p>
                    <p className="text-sm text-gray-500">
                      {job.jobDetails.skill} · {job.budget.amount} {job.budget.currency}
                      {job.seekerId?.name ? ` · ${job.seekerId.name}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`badge text-xs ${job.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    {job.escrow?.releaseTxHash && (
                      <a
                        href={`https://testnet.snowtrace.io/tx/${job.escrow.releaseTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-success-600 underline"
                      >
                        ✅ Payment tx →
                      </a>
                    )}
                    {job.reputationTxHash && (
                      <a
                        href={`https://testnet.snowtrace.io/tx/${job.reputationTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-amber-500 underline"
                      >
                        ⭐ Rep tx →
                      </a>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
