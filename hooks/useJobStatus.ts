'use client'

import { useState, useEffect, useRef } from 'react'

export type JobStatus = 'accepted' | 'on_the_way' | 'arrived' | 'working' | 'completed'

export interface JobStatusUpdate {
  status: JobStatus
  providerLat: number
  providerLng: number
  estimatedMinutes: number
  timestamp: string
}

export function useJobStatus(requestId: string, enabled = true) {
  const [update, setUpdate] = useState<JobStatusUpdate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!requestId || !enabled) return

    const es = new EventSource(`/api/request/${requestId}/status`)
    eventSourceRef.current = es

    es.addEventListener('update', (e) => {
      try {
        setUpdate(JSON.parse(e.data))
      } catch {}
    })

    es.addEventListener('error', (e) => {
      const data = (e as MessageEvent).data
      if (data) {
        try {
          setError(JSON.parse(data).error)
        } catch {
          setError('Connection error')
        }
      }
      es.close()
    })

    es.onerror = () => {
      // SSE closed after completion — expected
      es.close()
    }

    return () => es.close()
  }, [requestId])

  return { update, error }
}
