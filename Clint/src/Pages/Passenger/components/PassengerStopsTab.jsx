import { useState, useMemo } from 'react'
import { MapPin, Route as RouteIcon, Bus as BusIcon, Clock, ArrowRight, Search, Navigation } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'

export default function PassengerStopsTab({ routes = [], buses = [] }) {
  const [stopSearch, setStopSearch] = useState('')

  // Aggregate all unique stops and their associated routes and buses
  const stopsData = useMemo(() => {
    const map = new Map()

    routes.forEach((route) => {
      const allRouteStops = [
        { name: route.startPoint, role: 'origin' },
        ...(route.stops || []).map((s) => ({ name: s, role: 'intermediate' })),
        { name: route.endPoint, role: 'terminus' },
      ].filter((s) => s.name && s.name.trim())

      // Find buses for this route
      const routeBuses =
        Array.isArray(route.assignedBuses) && route.assignedBuses.length > 0
          ? route.assignedBuses
          : buses.filter((b) => {
              const bRouteId = b.assignedRoute?._id || b.assignedRoute?.id || b.assignedRoute
              return bRouteId && bRouteId.toString() === (route._id || route.id)?.toString()
            })

      allRouteStops.forEach((stop) => {
        const key = stop.name.trim()
        if (!map.has(key)) {
          map.set(key, {
            stopName: key,
            routes: [],
            buses: [],
          })
        }
        const item = map.get(key)
        // Add route if not already present
        if (!item.routes.some((r) => (r._id || r.id) === (route._id || route.id))) {
          item.routes.push({
            ...route,
            stopRole: stop.role,
          })
        }
        // Add buses
        routeBuses.forEach((b) => {
          if (!item.buses.some((existing) => (existing._id || existing.id) === (b._id || b.id))) {
            item.buses.push(b)
          }
        })
      })
    })

    return Array.from(map.values()).sort((a, b) => a.stopName.localeCompare(b.stopName))
  }, [routes, buses])

  const filteredStops = useMemo(() => {
    if (!stopSearch) return stopsData
    const q = stopSearch.toLowerCase()
    return stopsData.filter(
      (s) =>
        s.stopName.toLowerCase().includes(q) ||
        s.routes.some((r) => r.routeName?.toLowerCase().includes(q))
    )
  }, [stopsData, stopSearch])

  return (
    <div className="space-y-6">
      {/* Top Search for Stops */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search bus stops across campus (e.g. Library, Science Complex, Dorms)..."
            value={stopSearch}
            onChange={(e) => setStopSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <Badge variant="outline" className="self-start sm:self-auto px-3 py-1.5 font-mono text-xs">
          {filteredStops.length} Campus Stop{filteredStops.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {filteredStops.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <MapPin className="h-10 w-10 text-slate-300 mb-2" />
          <h3 className="text-base font-bold text-slate-900">No bus stops found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {stopSearch ? 'Try a different stop name query.' : 'No routes have been registered with stops yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStops.map((stopItem) => (
            <Card
              key={stopItem.stopName}
              className="border-slate-200/90 shadow-xs hover:border-slate-300 transition-all bg-white flex flex-col justify-between"
            >
              <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-950 truncate">
                      {stopItem.stopName}
                    </CardTitle>
                  </div>
                  <Badge variant="softBlue" className="text-[11px] shrink-0 font-mono">
                    {stopItem.routes.length} Route{stopItem.routes.length === 1 ? '' : 's'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4 flex-1">
                {/* Routes connecting to this stop */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Routes Serving This Stop
                  </label>
                  <div className="space-y-2">
                    {stopItem.routes.map((r) => (
                      <div
                        key={r._id || r.id}
                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <RouteIcon className="h-3 w-3 text-blue-600" />
                            {r.routeName}
                          </span>
                          <Badge
                            variant={r.status === 'active' ? 'softGreen' : 'secondary'}
                            className="text-[10px] capitalize px-1.5 py-0"
                          >
                            {r.status || 'active'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <span className="truncate">{r.startPoint}</span>
                          <ArrowRight className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                          <span className="truncate">{r.endPoint}</span>
                        </div>

                        {/* Departure schedules for this route */}
                        {r.scheduleTimes?.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <Clock className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                            <span className="font-medium">Departures:</span>
                            <span className="truncate text-blue-700 font-bold">
                              {r.scheduleTimes.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned Buses serving this stop */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Available Buses at this Stop</span>
                    <span className="font-mono text-slate-500">{stopItem.buses.length}</span>
                  </label>
                  {stopItem.buses.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No buses currently active.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {stopItem.buses.map((b) => (
                        <Badge
                          key={b._id || b.id}
                          variant="secondary"
                          className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs"
                        >
                          <BusIcon className="h-2.5 w-2.5 mr-1 text-blue-600" />
                          #{b.busNumber} • {b.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
