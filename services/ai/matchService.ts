import axios from 'axios'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

interface ClaudeMessage {
  role: 'user'
  content: string
}

async function callClaude(system: string, userMessage: string, maxTokens = 1500): Promise<string> {
  const response = await axios.post(
    ANTHROPIC_API_URL,
    {
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.4,
      system,
      messages: [{ role: 'user', content: userMessage } as ClaudeMessage],
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  )

  return response.data.content[0].text
}

export interface ProviderProfile {
  name: string
  skill: string
  professionalTitle: string
  city: string
  country: string
  bio: string
  rateMin: number
  rateMax: number
  yearsExperience: number
  languages: string[]
  coordinates: [number, number]
}

export interface MatchResult {
  provider: ProviderProfile & { _id: string; walletAddress: string; reputationScore: number }
  score: number
  matchReason: string
}

/**
 * Ouer DEMO FLOW- realistic West African provider profiles for a given skill.
 * Weuse this to seed the platform with providers.
 */
export async function generateProviders(
  skill: string,
  count: number
): Promise<ProviderProfile[]> {
  const system = `You are generating realistic user profiles for Joblad, a West African gig economy platform.
You must return ONLY valid JSON — no markdown, no explanation.
Generate profiles of skilled workers in cities like Lagos, Abuja, Accra, Ibadan, Port Harcourt, Kano, Kumasi.
Use real West African names (Yoruba, Igbo, Hausa, Akan, Ewe, etc.).
All rates are in AVAX (testnet) — keep between 0.05 and 0.5 AVAX.
Coordinates should be accurate for Nigerian/Ghanaian cities.`

  const userMessage = `Generate ${count} realistic ${skill} provider profiles for Joblad.
Return a JSON array with this exact structure for each provider:
{
  "name": "Full Name",
  "skill": "${skill}",
  "professionalTitle": "e.g. Master Electrician",
  "city": "Lagos",
  "country": "Nigeria",
  "bio": "2-3 sentence bio",
  "rateMin": 0.05,
  "rateMax": 0.15,
  "yearsExperience": 5,
  "languages": ["English", "Yoruba"],
  "coordinates": [3.3792, 6.5244]
}
Return ONLY the JSON array, nothing else.`

  const raw = await callClaude(system, userMessage, 2000)

  // Extract JSON array from response
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Claude did not return valid JSON array for providers')

  return JSON.parse(match[0]) as ProviderProfile[]
}

/**
 * Match a seeker's request against available providers using Claude AI.
 * Returns top 3 providers ranked by match quality.
 */
export async function matchProviders(
  request: {
    description: string
    skill: string
    urgency: string
    budget: number
    city: string
  },
  providers: Array<ProviderProfile & { _id: string; walletAddress: string; reputationScore: number; jobCount: number }>
): Promise<MatchResult[]> {
  if (providers.length === 0) return []

  const system = `You are Joblad's AI matching engine for West Africa's gig economy platform.
Score providers for a seeker's request based on: skill relevance, rate vs budget, location match, experience, and availability fit.
Return ONLY valid JSON — no markdown, no explanation.`

  const userMessage = `Seeker Request:
- Description: "${request.description}"
- Skill Needed: ${request.skill}
- Urgency: ${request.urgency}
- Budget: ${request.budget} AVAX
- City: ${request.city}

Available Providers:
${JSON.stringify(providers.map(p => ({
  _id: p._id,
  name: p.name,
  skill: p.skill,
  professionalTitle: p.professionalTitle,
  city: p.city,
  rateMin: p.rateMin,
  rateMax: p.rateMax,
  yearsExperience: p.yearsExperience,
  bio: p.bio,
  reputationScore: p.reputationScore,
})), null, 2)}

Score each provider 0-100 based on fit. Return the top 3 as a JSON array:
[
  {
    "providerId": "the _id value",
    "score": 85,
    "matchReason": "1-2 sentence explanation of why this provider is a good match"
  }
]
Return ONLY the JSON array, sorted by score descending.`

  const raw = await callClaude(system, userMessage, 800)

  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Claude did not return valid JSON for matches')

  const scores: Array<{ providerId: string; score: number; matchReason: string }> = JSON.parse(match[0])

  // Map scores back to full provider objects
  return scores
    .slice(0, 3)
    .map(({ providerId, score, matchReason }) => {
      const provider = providers.find(p => p._id === providerId)
      if (!provider) return null
      return { provider, score, matchReason }
    })
    .filter(Boolean) as MatchResult[]
}
