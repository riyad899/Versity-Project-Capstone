import { Bus, Route as RouteIcon, Clock, ArrowRight, MapPin, User, Navigation } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'

export default function PassengerBusesTab({ buses = [] }) {
  if (buses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
          <Bus className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No buses found</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          Try adjusting your search query, stop filter, or operational status.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {buses.map((bus) => {
        const busId = bus._id || bus.id
        const route = bus.assignedRoute
        const stops = route?.stops || []
        const schedules = route?.scheduleTimes || []

        return (
          <Card
            key={busId}
            className="border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between bg-white overflow-hidden"
          >
            <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="font-mono font-bold text-xs h-6 px-2">
                    #{bus.busNumber}
                  </Badge>
                  <CardTitle className="text-base font-extrabold text-slate-950 truncate">
                    {bus.name}
                  </CardTitle>
                </div>
                <Badge
                  variant={
                    bus.status === 'active'
                      ? 'softGreen'
                      : bus.status === 'maintenance'
                      ? 'softAmber'
                      : 'softRed'
                  }
                  className="capitalize text-xs shrink-0"
                >
                  {bus.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4 flex-1">
              {/* Bus Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">License Plate</span>
                  <strong className="text-slate-800 font-mono">{bus.licensePlate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Capacity</span>
                  <strong className="text-slate-800">{bus.capacity} seats</strong>
                </div>
              </div>

              {/* Assigned Route Box */}
              {route ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5 truncate">
                      <RouteIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      {route.routeName}
                    </span>
                    <Badge variant="softBlue" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                      {stops.length} stops
                    </Badge>
                  </div>

                  {/* Origin to Destination */}
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-800 bg-white/80 p-2 rounded-lg border border-blue-100/60">
                    <span className="truncate flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-emerald-600 shrink-0" />
                      {route.startPoint}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-purple-600 shrink-0" />
                      {route.endPoint}
                    </span>
                  </div>

                  {/* Intermediate Stops */}
                  {stops.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Stops on this Route
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {stops.map((stop, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md bg-white border border-blue-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-2xs"
                          >
                            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">
                              {idx + 1}
                            </span>
                            {stop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scheduled Departures */}
                  {schedules.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-blue-100/70">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                        <Clock className="h-2.5 w-2.5 text-blue-600" />
                        <span>Schedules / Departures</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {schedules.map((time, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 shadow-2xs"
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-400 italic text-center">
                  Route: Currently unassigned
                </div>
              )}

              {/* Driver Box */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                    {bus.assignedDriver?.name ? bus.assignedDriver.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="truncate">
                    Driver:{' '}
                    <strong className="text-slate-800">
                      {bus.assignedDriver?.name || 'Unassigned'}
                    </strong>
                  </span>
                </div>
                {bus.assignedDriver && (
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    On Duty
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
