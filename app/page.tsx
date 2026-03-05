import Link from 'next/link'

const AVAX_FEATURES = [
  {
    icon: '🔒',
    title: 'Smart Contract Escrow',
    description: 'Payments locked on Avalanche until job completion. No disputes, no fraud — code enforces trust.',
    tag: 'JobladEscrow.sol',
  },
  {
    icon: '⭐',
    title: 'On-Chain Reputation',
    description: 'Provider ratings written to Avalanche after every job. Tamper-proof, portable, verifiable by anyone.',
    tag: 'JobladReputation.sol',
  },
  {
    icon: '🎖️',
    title: 'Skill Credential NFTs',
    description: 'Providers mint verified skill credentials as NFTs. Your expertise, owned forever on Avalanche.',
    tag: 'JobladCredentials.sol (ERC-721)',
  },
]

const STATS = [
  { value: '80%+', label: 'of West Africa\'s skilled workers are informal' },
  { value: '<2s', label: 'Avalanche finality' },
  { value: '3', label: 'smart contracts securing every job' },
  { value: '$450B+', label: 'global gig economy opportunity' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Joblad</span>
            <span className="badge-primary text-xs hidden sm:flex">Avalanche Demo</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="onchain-tag hidden sm:flex">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              Live on Fuji Testnet
            </div>
            <Link href="/start" className="btn-primary text-sm py-2 px-5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 flex items-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative">
          <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-sm font-medium">
              Built for Avalanche Build Games 2025
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Africa&apos;s Skills Marketplace
            <span className="block text-primary-300 mt-2">Secured by Avalanche</span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
            Connect with verified skilled professionals across West Africa.
            AI-powered matching, on-chain reputation, and smart contract escrow —
            built for the informal economy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/start"
              className="bg-white text-primary-700 font-bold px-10 py-4 rounded-full hover:bg-primary-50 transition-all text-lg shadow-lg"
            >
              Find a Skill
            </Link>
            <Link
              href="/start"
              className="border-2 border-white/40 text-white font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-all text-lg backdrop-blur-sm"
            >
              Offer a Skill
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/60 text-xs leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AVAX Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="badge-primary mb-4">Avalanche Technology</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
              How Avalanche Powers Joblad
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Three smart contracts that make every job trustless, transparent, and tamper-proof.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {AVAX_FEATURES.map((feature) => (
              <div key={feature.title} className="card hover:shadow-lg transition-all group">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-4">{feature.description}</p>
                <code className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg font-mono">
                  {feature.tag}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-500">Three flows, all secured by Avalanche</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Auto-Match */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Auto-Match</h3>
              <p className="text-gray-500 leading-relaxed">
                Describe what you need. Joblad AI scores all available providers and returns your best 3 matches in seconds.
              </p>
            </div>

            {/* Lad Board */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lad Board</h3>
              <p className="text-gray-500 leading-relaxed">
                Post an open request. Providers compete with bids. You pick the best offer. All tracked on Avalanche.
              </p>
            </div>

            {/* Job Tracker */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Live Job Tracking</h3>
              <p className="text-gray-500 leading-relaxed">
                Track your provider on a live map. Escrow releases automatically when you confirm completion on-chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to experience the future of local services?
          </h2>
          <p className="text-white/70 text-lg mb-10">
            No MetaMask needed. We create your Avalanche wallet automatically.
          </p>
          <Link
            href="/start"
            className="bg-white text-primary-700 font-bold px-12 py-4 rounded-full text-lg hover:bg-primary-50 transition-all inline-block shadow-xl"
          >
            Get Started — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-950 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">J</span>
            </div>
            <span className="text-white font-bold">Joblad</span>
            <span className="text-white/40 text-sm">by Mydappr</span>
          </div>
          <div className="text-white/40 text-sm text-center">
            Built for Avalanche Build Games 2025 · All blockchain interactions on Fuji Testnet
          </div>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Fuji Testnet Live
          </div>
        </div>
      </footer>
    </div>
  )
}
