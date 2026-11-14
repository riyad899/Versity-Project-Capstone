import { Bus, Route, Clock } from 'lucide-react'
import { Card, CardContent } from '@/Components/ui/card'

export default function PassengerStats({ activeBusesCount, totalRoutesCount, totalBusesCount }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-950">{activeBusesCount}</div>
            <div className="text-xs font-semibold text-slate-500">Active Shuttle Buses</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Route className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-950">{totalRoutesCount}</div>
            <div className="text-xs font-semibold text-slate-500">Campus Routes</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-950">{totalBusesCount}</div>
            <div className="text-xs font-semibold text-slate-500">Total Fleet Vehicles</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

