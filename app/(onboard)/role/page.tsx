'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RolePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<'seeker' | 'provider' | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!selected) return
    setLoading(true)

    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selected }),
    })

    router.push('/profile')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">J</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How will you use Joblad?</h1>
          <p className="text-gray-500">Choose your role to personalize your experience</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Seeker Card */}
          <button
            onClick={() => setSelected('seeker')}
            className={`text-left p-8 rounded-3xl border-2 transition-all ${
              selected === 'seeker'
                ? 'border-primary-500 bg-primary-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
            }`}
          >
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">I need a skill</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Find and hire verified skilled professionals — electricians, tailors, tutors,
              mechanics, and more across West Africa.
            </p>
            {selected === 'seeker' && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-primary-600 text-sm font-semibold">
                <span>✓</span> Selected
              </div>
            )}
          </button>

          {/* Provider Card */}
          <button
            onClick={() => setSelected('provider')}
            className={`text-left p-8 rounded-3xl border-2 transition-all ${
              selected === 'provider'
                ? 'border-primary-500 bg-primary-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
            }`}
          >
            <div className="text-5xl mb-4">🛠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">I offer a skill</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Get discovered by seekers, mint your skill credential on Avalanche, and build
              your verified on-chain reputation.
            </p>
            {selected === 'provider' && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-primary-600 text-sm font-semibold">
                <span>✓</span> Selected
              </div>
            )}
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="btn-primary w-full py-4 text-base"
        >
          {loading ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
