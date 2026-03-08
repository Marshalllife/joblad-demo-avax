import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Request from '@/models/Request'

// SSE simulation sequence timings (ms)
const SEQUENCE: Array<{ status: string; delay: number; message: string }> = [
  { status: 'accepted', delay: 0, message: 'Provider accepted your request' },
  { status: 'on_the_way', delay: 5000, message: 'Provider is on the way to you' },
  { status: 'arrived', delay: 35000, message: 'Provider has arrived at your location' },
  { status: 'working', delay: 20000, message: 'Provider has started working' },
  { status: 'completed', delay: 60000, message: 'Job completed! Release payment to provider.' },
]

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect()
  const request = await Request.findById(params.id)

  if (!request) {
    return new Response('Request not found', { status: 404 })
  }

  const coords = request.location?.coordinates
  const seekerCoords = coords && coords.length >= 2 ? coords : [3.3792, 6.5244]

  const encoder = new TextEncoder()

  // If already completed, return final state immediately — no simulation needed
  if (request.simulation?.currentStatus === 'completed' || request.status === 'completed') {
    const targetLat = seekerCoords[1]
    const targetLng = seekerCoords[0]
    const body = `event: update\ndata: ${JSON.stringify({
      status: 'completed',
      providerLat: targetLat,
      providerLng: targetLng,
      seekerLat: targetLat,
      seekerLng: targetLng,
      estimatedMinutes: 0,
      message: 'Job completed',
    })}\n\n`
    return new Response(body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  }

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        const msg = `event: update\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(msg))
      }

      // Always start provider from a fresh random offset (~4-8km away) for clean animation
      const targetLat = seekerCoords[1]
      const targetLng = seekerCoords[0]
      const startLat = targetLat + (Math.random() > 0.5 ? 1 : -1) * (0.03 + Math.random() * 0.05)
      const startLng = targetLng + (Math.random() > 0.5 ? 1 : -1) * (0.03 + Math.random() * 0.05)

      // Send initial state with fresh start position
      send({
        status: 'accepted',
        providerLat: startLat,
        providerLng: startLng,
        seekerLat: targetLat,
        seekerLng: targetLng,
        estimatedMinutes: request.simulation?.estimatedMinutes || 10,
        message: 'Tracking your job',
      })

      // Walk through simulation sequence
      for (const step of SEQUENCE) {
        await delay(step.delay)

        // Calculate interpolated provider position during on_the_way
        let providerLat = startLat
        let providerLng = startLng

        if (step.status === 'arrived' || step.status === 'working' || step.status === 'completed') {
          providerLat = targetLat
          providerLng = targetLng
        } else if (step.status === 'on_the_way') {
          providerLat = startLat + (targetLat - startLat) * 0.3
          providerLng = startLng + (targetLng - startLng) * 0.3
        }

        // Update DB
        await Request.findByIdAndUpdate(params.id, {
          'simulation.currentStatus': step.status,
          'simulation.providerLat': providerLat,
          'simulation.providerLng': providerLng,
        })

        send({
          status: step.status,
          providerLat,
          providerLng,
          seekerLat: targetLat,
          seekerLng: targetLng,
          estimatedMinutes:
            step.status === 'on_the_way' ? Math.max(1, (request.simulation?.estimatedMinutes || 10) - 2) : 0,
          message: step.message,
        })

        // Send moving frames during on_the_way
        if (step.status === 'on_the_way') {
          for (let i = 1; i <= 5; i++) {
            await delay(5000)
            const progress = 0.3 + i * 0.14
            const capped = Math.min(progress, 0.95)
            send({
              status: 'on_the_way',
              providerLat: startLat + (targetLat - startLat) * capped,
              providerLng: startLng + (targetLng - startLng) * capped,
              seekerLat: targetLat,
              seekerLng: targetLng,
              estimatedMinutes: Math.max(0, Math.round((1 - capped) * (request.simulation?.estimatedMinutes || 10))),
              message: 'Provider is on the way',
            })
          }
        }
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}
