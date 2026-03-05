import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Joblad — Africa\'s Skills Marketplace on Avalanche',
  description: 'Connect with verified skilled professionals across West Africa. Every credential, payment, and reputation score secured on Avalanche blockchain.',
  openGraph: {
    title: 'Joblad — Africa\'s Skills Marketplace on Avalanche',
    description: 'AI-powered skill matching with on-chain reputation, smart contract escrow, and tokenized incentives.',
    siteName: 'Joblad',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
