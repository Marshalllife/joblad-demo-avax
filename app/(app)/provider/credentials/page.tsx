'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { snowtraceUrl } from '@/utils/avalanche'

interface UserData {
  name: string
  walletAddress: string
  credentialTokenId: string | null
  credentialTxHash: string | null
  skills: Array<{ skillName: string; professionalTitle: string }>
}

export default function CredentialsPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [minting, setMinting] = useState(false)
  const [result, setResult] = useState<{ tokenId: string; txHash: string; skillName: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user)
        if (d.user?.credentialTokenId) {
          setResult({
            tokenId: d.user.credentialTokenId,
            txHash: d.user.credentialTxHash,
            skillName: d.user.skills?.[0]?.skillName || 'Skill',
          })
        }
      })
  }, [])

  async function handleMint() {
    setMinting(true)
    setError('')
    try {
      const res = await fetch('/api/provider/mint-credential', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setUser((u) => u ? { ...u, credentialTokenId: data.tokenId, credentialTxHash: data.txHash } : u)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Minting failed')
    } finally {
      setMinting(false)
    }
  }

  const skill = user?.skills?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/provider/dashboard" className="flex items-center gap-2">
          <span className="text-gray-400">←</span>
          <span className="font-semibold text-gray-700">Back to Dashboard</span>
        </Link>
        <div className="onchain-tag">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          Avalanche Fuji
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skill Credential NFT</h1>
        <p className="text-gray-500 mb-8">
          Mint your skill as a verified ERC-721 NFT on Avalanche. Immutable proof of your expertise.
        </p>

        {result ? (
          /* Minted credential card */
          <div className="bg-gradient-to-br from-primary-600 to-primary-900 rounded-3xl p-8 text-white shadow-xl">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="text-xs text-white/60 uppercase tracking-widest mb-1">Joblad Credentials</div>
                <div className="text-3xl font-bold">{result.skillName}</div>
                <div className="text-white/70 text-sm mt-1">{skill?.professionalTitle}</div>
              </div>
              <div className="text-5xl">🎖️</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-xs text-white/60 mb-1">Token ID</div>
                <div className="font-bold">#{result.tokenId}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-xs text-white/60 mb-1">Network</div>
                <div className="font-bold">Avalanche Fuji</div>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 mb-6">
              <div className="text-xs text-white/60 mb-1">Wallet</div>
              <div className="font-mono text-sm truncate">{user?.walletAddress}</div>
            </div>

            <a
              href={snowtraceUrl(result.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white text-primary-700 font-bold py-3 px-6 rounded-xl text-center block hover:bg-primary-50 transition-all"
            >
              View on Snowtrace ↗
            </a>
          </div>
        ) : (
          /* Mint prompt */
          <div className="card">
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🎖️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Mint Your {skill?.skillName || 'Skill'} Credential
              </h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Your skill credential will be minted as an ERC-721 NFT on Avalanche Fuji and linked to your wallet forever.
              </p>

              {!skill && (
                <p className="text-warning-600 text-sm mb-4">
                  ⚠ Complete your profile to add a skill before minting.
                </p>
              )}

              {error && (
                <p className="text-error-500 text-sm bg-error-50 px-4 py-3 rounded-xl mb-4">{error}</p>
              )}

              <button
                onClick={handleMint}
                disabled={minting || !skill}
                className="btn-primary px-10 py-4 text-base"
              >
                {minting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Minting on Avalanche…
                  </span>
                ) : (
                  'Mint Credential NFT →'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
