'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SKILL_CATEGORIES = [
  { id: 1, name: 'Electrician', title: 'Licensed Electrician' },
  { id: 2, name: 'Plumber', title: 'Professional Plumber' },
  { id: 3, name: 'Tailor', title: 'Fashion Designer & Tailor' },
  { id: 4, name: 'Mechanic', title: 'Auto Mechanic' },
  { id: 5, name: 'Cleaner', title: 'Professional Cleaner' },
  { id: 6, name: 'Tutor', title: 'Private Tutor' },
  { id: 7, name: 'Photographer', title: 'Professional Photographer' },
  { id: 8, name: 'Carpenter', title: 'Carpenter & Furniture Maker' },
  { id: 9, name: 'Painter', title: 'House Painter' },
  { id: 10, name: 'Graphic Designer', title: 'Graphic Designer' },
]

const CITIES: { city: string; country: string; coordinates: [number, number] }[] = [
  { city: 'Lagos', country: 'Nigeria', coordinates: [3.3792, 6.5244] },
  { city: 'Abuja', country: 'Nigeria', coordinates: [7.4898, 9.0579] },
  { city: 'Port Harcourt', country: 'Nigeria', coordinates: [7.0134, 4.8156] },
  { city: 'Ibadan', country: 'Nigeria', coordinates: [3.9017, 7.3775] },
  { city: 'Kano', country: 'Nigeria', coordinates: [8.5227, 12.0022] },
  { city: 'Accra', country: 'Ghana', coordinates: [-0.1870, 5.6037] },
  { city: 'Kumasi', country: 'Ghana', coordinates: [-1.6234, 6.6884] },
]

export default function ProfilePage() {
  const router = useRouter()
  const [role, setRole] = useState<'seeker' | 'provider' | null>(null)
  const [name, setName] = useState('')
  const [selectedCity, setSelectedCity] = useState(CITIES[0])
  const [selectedSkill, setSelectedSkill] = useState(SKILL_CATEGORIES[0])
  const [rateMin, setRateMin] = useState('0.05')
  const [rateMax, setRateMax] = useState('0.15')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        setRole(d.user?.role)
        setName(d.user?.name || '')
        setFetching(false)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const update =
      role === 'provider'
        ? {
            name,
            location: {
              city: selectedCity.city,
              country: selectedCity.country,
              coordinates: selectedCity.coordinates,
            },
            skills: [
              {
                skillId: selectedSkill.id,
                skillName: selectedSkill.name,
                professionalTitle: selectedSkill.title,
              },
            ],
            rate: {
              min: parseFloat(rateMin),
              max: parseFloat(rateMax),
              currency: 'AVAX',
            },
            bio,
          }
        : {
            name,
            location: {
              city: selectedCity.city,
              country: selectedCity.country,
              coordinates: selectedCity.coordinates,
            },
          }

    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })

    router.push(role === 'provider' ? '/provider/dashboard' : '/seeker/dashboard')
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">J</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set up your profile</h1>
          <p className="text-gray-500">
            {role === 'provider'
              ? 'Tell seekers what you offer'
              : 'Tell us a bit about yourself'}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="input"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your City</label>
              <select
                value={selectedCity.city}
                onChange={(e) => setSelectedCity(CITIES.find((c) => c.city === e.target.value)!)}
                className="input"
              >
                {CITIES.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}, {c.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider-only fields */}
            {role === 'provider' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Primary Skill
                  </label>
                  <select
                    value={selectedSkill.id}
                    onChange={(e) =>
                      setSelectedSkill(SKILL_CATEGORIES.find((s) => s.id === Number(e.target.value))!)
                    }
                    className="input"
                  >
                    {SKILL_CATEGORIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Min Rate (AVAX)
                    </label>
                    <input
                      type="number"
                      value={rateMin}
                      onChange={(e) => setRateMin(e.target.value)}
                      step="0.01"
                      min="0.01"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Rate (AVAX)
                    </label>
                    <input
                      type="number"
                      value={rateMax}
                      onChange={(e) => setRateMax(e.target.value)}
                      step="0.01"
                      min="0.01"
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bio <span className="text-gray-400 font-normal">(tell seekers about your experience)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. I've been an electrician for 8 years specializing in residential and commercial installations across Lagos…"
                    rows={3}
                    className="input resize-none"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || !name}
              className="btn-primary w-full py-4 text-base"
            >
              {loading ? 'Saving…' : "Complete Setup →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
