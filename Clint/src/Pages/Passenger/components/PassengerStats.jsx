import { Bus, Route, Clock, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/Components/ui/card'

export default function PassengerStats({
  activeBusesCount = 0,
  totalRoutesCount = 0,
  totalBusesCount = 0,
  totalStopsCount = 0,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* 1. Available Routes */}
      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Route className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-slate-950 truncate">{totalRoutesCount}</div>
            <div className="text-[11px] font-semibold text-slate-500 truncate">Available Routes</div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Campus Bus Stops */}
      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-slate-950 truncate">{totalStopsCount}</div>
            <div className="text-[11px] font-semibold text-slate-500 truncate">Campus Bus Stops</div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Active Shuttle Buses */}
      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Bus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-slate-950 truncate">{activeBusesCount}</div>
            <div className="text-[11px] font-semibold text-slate-500 truncate">Active Buses</div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Total Fleet Vehicles */}
      <Card className="border-slate-200/80 shadow-xs bg-white">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-black text-slate-950 truncate">{totalBusesCount}</div>
            <div className="text-[11px] font-semibold text-slate-500 truncate">Fleet Vehicles</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
