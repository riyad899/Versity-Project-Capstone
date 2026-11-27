import { useState } from 'react'
import {
  Route as RouteIcon,
  Clock,
  ArrowRight,
  Bus as BusIcon,
  MapPin,
  Navigation,
  User,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'

export default function PassengerRoutesTab({ routes = [], buses = [] }) {
  const [expandedRouteId, setExpandedRouteId] = useState(null)

  if (routes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
          <RouteIcon className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No routes found</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          Try searching for a different destination, building, or campus bus stop.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {routes.map((route) => {
        const routeId = route._id || route.id

        // Get assigned buses either from route.assignedBuses (populated by backend) or match from buses list
        const assignedBuses =
          Array.isArray(route.assignedBuses) && route.assignedBuses.length > 0
            ? route.assignedBuses
            : buses.filter((b) => {
                const bRouteId = b.assignedRoute?._id || b.assignedRoute?.id || b.assignedRoute
                return bRouteId && bRouteId.toString() === routeId?.toString()
              })

        const stops = Array.isArray(route.stops) ? route.stops : []
        const schedules = Array.isArray(route.scheduleTimes) ? route.scheduleTimes : []
        const isExpanded = expandedRouteId === routeId

        return (
          <Card
            key={routeId}
            className="border-slate-200/90 shadow-xs hover:border-slate-300 transition-all bg-white flex flex-col justify-between overflow-hidden"
          >
            {/* Header */}
            <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700">
                    <RouteIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-950 flex items-center gap-2">
                      {route.routeName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span>{stops.length} intermediate stops</span>
                      <span>•</span>
                      <span className="font-medium text-blue-700">
                        {assignedBuses.length} bus{assignedBuses.length === 1 ? '' : 'es'} assigned
                      </span>
                    </div>
                  </div>
                </div>

                <Badge
                  variant={route.status === 'active' ? 'softGreen' : 'softRed'}
                  className="capitalize text-xs shrink-0"
                >
                  {route.status || 'active'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5 flex-1">
              {/* Origin -> Terminus Banner */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Navigation className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Start Point
                      </span>
                      <strong className="text-slate-900 font-bold truncate block">
                        {route.startPoint}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    <span className="text-[10px] font-mono hidden sm:inline">
                      {stops.length} stops
                    </span>
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                  </div>

                  <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                        Final Stop
                      </span>
                      <strong className="text-slate-900 font-bold truncate block">
                        {route.endPoint}
                      </strong>
                    </div>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Bus Stops Pathway */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    Ordered Bus Stops Pathway
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {stops.length + 2} total locations
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Origin Badge */}
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {route.startPoint}
                    </span>

                    {/* Intermediate Stops */}
                    {stops.map((stop, idx) => (
                      <span key={idx} className="flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                        <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-2xs">
                          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
                            {idx + 1}
                          </span>
                          {stop}
                        </span>
                      </span>
                    ))}

                    {/* Final Terminus Badge */}
                    <span className="flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3 text-slate-300" />
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-xs font-bold text-purple-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                        {route.endPoint}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Buses Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BusIcon className="h-3.5 w-3.5 text-blue-600" />
                    Assigned Shuttle Buses ({assignedBuses.length})
                  </label>
                  {assignedBuses.length > 0 && (
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      {assignedBuses.filter((b) => b.status === 'active').length} Active
                    </span>
                  )}
                </div>

                {assignedBuses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center text-xs text-slate-400 italic">
                    No shuttle buses currently assigned to this route.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assignedBuses.map((bus) => {
                      const busId = bus._id || bus.id
                      return (
                        <div
                          key={busId}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-blue-50/30 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className="font-mono text-[10px] font-bold h-5 px-1.5">
                                #{bus.busNumber}
                              </Badge>
                              <span className="text-xs font-bold text-slate-900 truncate block">
                                {bus.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{bus.capacity} seats</span>
                              {bus.assignedDriver && (
                                <span>• Driver: {bus.assignedDriver.name}</span>
                              )}
                            </div>
                          </div>

                          <Badge
                            variant={
                              bus.status === 'active'
                                ? 'softGreen'
                                : bus.status === 'maintenance'
                                ? 'softAmber'
                                : 'softRed'
                            }
                            className="capitalize text-[10px] shrink-0"
                          >
                            {bus.status}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Schedules / Departures Section */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    Scheduled Departures ({schedules.length})
                  </label>
                  <span className="text-[11px] text-slate-400">Fixed Daily Times</span>
                </div>

                {schedules.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-2.5 text-center text-xs text-slate-400 italic">
                    Continuous loop / Flexible shuttle service
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {schedules.map((time, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-xs font-bold text-blue-700 shadow-2xs"
                      >
                        <Clock className="h-3 w-3 text-blue-500" />
                        {time}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
