'use client'

import { useState, useEffect, useCallback } from 'react'
import { snowtraceAddressUrl, FUJI_CONFIG } from '@/utils/avalanche'

interface WalletCardProps {
  address: string
  compact?: boolean
}

export default function WalletCard({ address, compact = false }: WalletCardProps) {
  const [balance, setBalance] = useState<string | null>(null)
  const [locked, setLocked] = useState(0)
  const [funding, setFunding] = useState(false)
  const [fundResult, setFundResult] = useState<{ success: boolean; message: string; link?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/balance')
      const data = await res.json()
      setBalance(data.balance)
      setLocked(data.locked || 0)
    } catch {
      // Silent fail
    }
  }, [])

  useEffect(() => {
    fetchBalance()
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [fetchBalance])

  async function handleFund() {
    setFunding(true)
    setFundResult(null)
    try {
      const res = await fetch('/api/wallet/fund', { method: 'POST' })
      const data = await res.json()
      setFundResult({
        success: data.success,
        message: data.message,
        link: data.success ? data.snowtraceLink : data.faucetUrl,
      })
      if (data.success) setTimeout(fetchBalance, 3000)
    } finally {
      setFunding(false)
    }
  }

  function copyAddress() {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
  const balanceNum = parseFloat(balance || '0')
  const isLow = balanceNum < 0.05

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm font-mono text-primary-700">{shortAddress}</span>
        <span className="text-sm font-semibold text-gray-900">
          {balance !== null ? `${parseFloat(balance).toFixed(4)} AVAX` : '…'}
        </span>
      </div>
    )
  }

  return (
    <div className="card border border-primary-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="onchain-tag mb-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Avalanche Fuji Wallet
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-600 text-sm">{shortAddress}</span>
            <button
              onClick={copyAddress}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <a
              href={snowtraceAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              View ↗
            </a>
          </div>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900">
          {balance !== null ? `${parseFloat(balance).toFixed(4)}` : '—'}
          <span className="text-lg text-gray-400 ml-1">AVAX</span>
        </div>
        {locked > 0 && (
          <div className="text-sm text-warning-600 mt-1">
            🔒 {locked.toFixed(4)} AVAX locked in escrow
          </div>
        )}
        {isLow && balance !== null && (
          <div className="text-xs text-warning-600 mt-1">
            ⚠ Low balance — fund your wallet to book services
          </div>
        )}
      </div>

      {/* Fund button */}
      <button
        onClick={handleFund}
        disabled={funding}
        className="btn-secondary text-sm py-2 px-4 w-full"
      >
        {funding ? 'Funding…' : '+ Fund Wallet'}
      </button>

      {fundResult && (
        <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${fundResult.success ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'}`}>
          {fundResult.message}{' '}
          {fundResult.link && (
            <a href={fundResult.link} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              {fundResult.success ? 'View tx ↗' : 'Open faucet ↗'}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
