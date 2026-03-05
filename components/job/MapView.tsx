'use client'

import { useEffect, useRef } from 'react'
import type { Map, Marker } from 'leaflet'

interface Props {
  seekerLat: number
  seekerLng: number
  providerLat: number
  providerLng: number
  status: string
}

export default function MapView({ seekerLat, seekerLng, providerLat, providerLng, status }: Props) {
  const mapRef = useRef<Map | null>(null)
  const providerMarkerRef = useRef<Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Leaflet must only run in browser
    import('leaflet').then((L) => {
      if (!containerRef.current || mapRef.current) return
      // Bail if Leaflet already stamped this container (StrictMode double-invoke)
      if ((containerRef.current as unknown as { _leaflet_id?: number })._leaflet_id) return

      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current).setView([seekerLat, seekerLng], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      // Seeker marker (blue)
      const seekerIcon = L.divIcon({
        html: `<div style="background:#7140ED;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      L.marker([seekerLat, seekerLng], { icon: seekerIcon })
        .addTo(map)
        .bindPopup('📍 Your Location')
        .openPopup()

      // Provider marker (orange)
      const providerIcon = L.divIcon({
        html: `<div style="background:#f59e0b;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      const providerMarker = L.marker([providerLat, providerLng], { icon: providerIcon })
        .addTo(map)
        .bindPopup('🔧 Provider')

      mapRef.current = map
      providerMarkerRef.current = providerMarker
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        providerMarkerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update provider position
  useEffect(() => {
    if (!providerMarkerRef.current) return
    providerMarkerRef.current.setLatLng([providerLat, providerLng])

    if (status === 'arrived' || status === 'working' || status === 'completed') {
      providerMarkerRef.current.setLatLng([seekerLat, seekerLng])
    }
  }, [providerLat, providerLng, seekerLat, seekerLng, status])

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />
    </>
  )
}
