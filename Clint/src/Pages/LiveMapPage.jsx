import { Radio } from 'lucide-react'
import LiveFleetTracker from '@/Components/Map/LiveFleetTracker'

export default function LiveMapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            Real-Time Campus Transit Map
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Active Bus Locations & Live Movement
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor live campus shuttle positions, movement trails, compass directions, and route stops across the interactive map.
          </p>
        </div>
      </div>

      <LiveFleetTracker />
    </div>
  )
}
