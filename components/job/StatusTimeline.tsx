import type { JobStatus } from '@/hooks/useJobStatus'

const STEPS: { status: JobStatus; label: string; description: string }[] = [
  { status: 'accepted', label: 'Accepted', description: 'Escrow locked on Avalanche' },
  { status: 'on_the_way', label: 'On The Way', description: 'Provider is en route to you' },
  { status: 'arrived', label: 'Arrived', description: 'Provider is at your location' },
  { status: 'working', label: 'Working', description: 'Job in progress' },
  { status: 'completed', label: 'Completed', description: 'Job finished successfully' },
]

const ORDER: JobStatus[] = ['accepted', 'on_the_way', 'arrived', 'working', 'completed']

interface Props {
  currentStatus: JobStatus
  timestamps?: Partial<Record<JobStatus, string>>
}

export default function StatusTimeline({ currentStatus, timestamps = {} }: Props) {
  const currentIndex = ORDER.indexOf(currentStatus)

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const pending = i > currentIndex

        return (
          <div key={step.status} className="flex gap-4">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  done
                    ? 'bg-success-500 text-white'
                    : active
                    ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 h-8 mt-1 ${done ? 'bg-success-400' : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
              <p
                className={`font-semibold text-sm ${
                  pending ? 'text-gray-400' : 'text-gray-900'
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              {timestamps[step.status] && (
                <p className="text-xs text-primary-500 mt-0.5">
                  {new Date(timestamps[step.status]!).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
