'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StartPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const { user } = data

      if (user.role === 'seeker') {
        router.push('/seeker/dashboard')
      } else if (user.role === 'provider') {
        router.push('/provider/dashboard')
      } else {
        router.push('/role')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-primary-600 font-bold text-lg">J</span>
            </div>
            <span className="text-white font-bold text-2xl">Joblad</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-white/60">Enter your email to get started</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-error-500 text-sm bg-error-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full py-4 text-base"
            >
              {loading ? 'Setting up your account…' : 'Continue →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3 text-xs text-gray-400">
              <span className="text-lg">🔐</span>
              <p>
                No password needed. We create a secure Avalanche wallet for you automatically.
                Your credentials are secured on Fuji testnet.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          By continuing, you agree to explore Joblad on Avalanche Fuji Testnet
        </p>
      </div>
    </div>
  )
}
