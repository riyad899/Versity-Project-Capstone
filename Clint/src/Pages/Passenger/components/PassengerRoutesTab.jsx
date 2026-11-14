import { Route, Clock, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'

export default function PassengerRoutesTab({ routes }) {
  if (routes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
          <Route className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No routes found</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          Try searching for a different destination or campus building.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {routes.map((route) => (
        <Card
          key={route._id || route.id}
          className="border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Route className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-extrabold text-slate-950">
                  {route.routeName}
                </CardTitle>
              </div>
              <Badge
                variant={route.status === 'active' ? 'softGreen' : 'softRed'}
                className="capitalize text-xs"
              >
                {route.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4 flex-1">
            {/* Origin -> Terminus Banner */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Origin</span>
                <strong className="text-slate-900 font-bold">{route.startPoint}</strong>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="text-right">
                <span className="text-slate-400 block font-medium">Terminus</span>
                <strong className="text-slate-900 font-bold">{route.endPoint}</strong>
              </div>
            </div>

            {/* Stops List */}
            {route.stops?.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Stops ({route.stops.length})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {route.stops.map((stop, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      {stop}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Times */}
            {route.scheduleTimes?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Departures
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {route.scheduleTimes.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700"
                    >
                      <Clock className="h-3 w-3" /> {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

