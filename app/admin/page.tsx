'use client'

import { useState, useEffect } from 'react'

const SKILLS = ['Electrician', 'Plumber', 'Tailor', 'Mechanic', 'Cleaner', 'Tutor', 'Photographer', 'Carpenter', 'Painter', 'Graphic Designer']

interface GeneratedProvider {
  _id: string
  name: string
  email: string
  walletAddress: string
  skills: Array<{ skillName: string; professionalTitle: string }>
  location?: { city: string }
  reputationScore?: number
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [authError, setAuthError] = useState('')

  const [skill, setSkill] = useState(SKILLS[0])
  const [count, setCount] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedProvider[]>([])
  const [genError, setGenError] = useState('')

  const [fundAddress, setFundAddress] = useState('')
  const [funding, setFunding] = useState(false)
  const [fundResult, setFundResult] = useState('')

  const [adminWallet, setAdminWallet] = useState<{ address: string; balance: string } | null>(null)

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    // Verify by making a test request
    const res = await fetch('/api/admin/generate-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ skill: 'Electrician', count: 0 }),
    })
    if (res.status === 401 || res.status === 403) {
      setAuthError('Invalid secret')
    } else {
      setUnlocked(true)
      setAuthError('')
      loadAdminWallet()
    }
  }

  async function loadAdminWallet() {
    const res = await fetch('/api/wallet/balance?admin=true', {
      headers: { 'x-admin-secret': secret },
    })
    const data = await res.json()
    if (data.address) setAdminWallet(data)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setGenError('')
    setGenerated([])
    try {
      const res = await fetch('/api/admin/generate-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ skill, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGenerated(data.providers || [])
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handleFund(e: React.FormEvent) {
    e.preventDefault()
    setFunding(true)
    setFundResult('')
    try {
      const res = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ address: fundAddress }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFundResult(data.txHash ? `✅ Funded! tx: ${data.txHash.slice(0, 12)}…` : '✅ Funded (check logs)')
      loadAdminWallet()
    } catch (err: unknown) {
      setFundResult(err instanceof Error ? `❌ ${err.message}` : '❌ Failed')
    } finally {
      setFunding(false)
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1">Joblad Demo Control Center</p>
          </div>

          <form onSubmit={handleUnlock} className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Secret</label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter ADMIN_SECRET"
                required
                className="input"
                autoFocus
              />
            </div>
            {authError && <p className="text-error-500 text-sm">{authError}</p>}
            <button type="submit" className="btn-primary w-full py-3">
              Unlock Panel →
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <span className="font-bold text-gray-900">Joblad Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-primary">Demo Control</span>
          <button onClick={() => setUnlocked(false)} className="btn-ghost text-sm">Lock</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Admin wallet */}
        {adminWallet && (
          <div className="card bg-gray-900 text-white">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Platform Wallet (Admin)</h2>
            <div className="font-mono text-sm text-gray-300 mb-2">{adminWallet.address}</div>
            <div className="text-2xl font-bold">{adminWallet.balance} AVAX</div>
            <a
              href={`https://testnet.snowtrace.io/address/${adminWallet.address}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary-400 underline mt-2 inline-block"
            >
              View on Snowtrace →
            </a>
          </div>
        )}

        {/* Generate providers */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Generate Providers</h2>
          <p className="text-gray-500 text-sm mb-6">
            Joblad AI generates realistic West African provider profiles, creates wallets, and seeds the DB.
          </p>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Skill Category</label>
                <select value={skill} onChange={(e) => setSkill(e.target.value)} className="input text-sm">
                  {SKILLS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Count (1–5)</label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={5}
                  className="input text-sm"
                />
              </div>
            </div>

            {genError && <p className="text-error-500 text-sm bg-error-50 px-3 py-2 rounded-lg">{genError}</p>}

            <button type="submit" disabled={generating} className="btn-primary py-3 px-6">
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Joblad is generating providers…
                </span>
              ) : (
                `Generate ${count} ${skill} Provider${count !== 1 ? 's' : ''} →`
              )}
            </button>
          </form>

          {generated.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Generated Providers</h3>
              {generated.map((p) => (
                <div key={p._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-bold flex-shrink-0">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.skills?.[0]?.professionalTitle || skill} · {p.location?.city || 'Lagos'}</p>
                  </div>
                  <div className="text-xs font-mono text-gray-400 truncate max-w-[120px]">
                    {p.walletAddress?.slice(0, 10)}…
                  </div>
                  <span className="badge-success text-xs">✓ Created</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fund wallet */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Fund a Wallet</h2>
          <p className="text-gray-500 text-sm mb-5">Send 0.02 AVAX from platform wallet to any address.</p>

          <form onSubmit={handleFund} className="flex gap-3">
            <input
              value={fundAddress}
              onChange={(e) => setFundAddress(e.target.value)}
              placeholder="0x..."
              required
              className="input text-sm flex-1"
            />
            <button type="submit" disabled={funding} className="btn-primary px-5 py-2 text-sm whitespace-nowrap">
              {funding ? 'Sending…' : 'Send AVAX →'}
            </button>
          </form>
          {fundResult && (
            <p className="text-sm mt-3 text-gray-700">{fundResult}</p>
          )}
        </div>

        {/* Quick links */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <a href="/seeker/dashboard" className="card hover:shadow-md transition-all text-center py-4">
              <div className="text-2xl mb-1">🤝</div>
              <p className="font-medium text-gray-900">Seeker View</p>
            </a>
            <a href="/provider/dashboard" className="card hover:shadow-md transition-all text-center py-4">
              <div className="text-2xl mb-1">🔧</div>
              <p className="font-medium text-gray-900">Provider View</p>
            </a>
            <a href="https://testnet.snowtrace.io" target="_blank" rel="noreferrer"
              className="card hover:shadow-md transition-all text-center py-4">
              <div className="text-2xl mb-1">🔗</div>
              <p className="font-medium text-gray-900">Snowtrace Fuji</p>
            </a>
            <a href="https://faucet.avax.network" target="_blank" rel="noreferrer"
              className="card hover:shadow-md transition-all text-center py-4">
              <div className="text-2xl mb-1">🚰</div>
              <p className="font-medium text-gray-900">AVAX Faucet</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
