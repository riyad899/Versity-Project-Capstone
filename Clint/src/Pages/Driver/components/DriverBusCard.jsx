import {
  Bus,
  Route,
  Clock,
  CheckCircle2,
  ArrowRight,
  MapPin,
  User,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'

export default function DriverBusCard({ bus, isAssignedToMe }) {
  return (
    <Card
      className={`border-slate-200/80 hover:shadow-md transition-all flex flex-col justify-between ${
        isAssignedToMe ? 'ring-2 ring-blue-600 border-blue-500' : ''
      }`}
    >
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono font-bold text-xs">
              #{bus.busNumber}
            </Badge>
            <CardTitle className="text-base font-extrabold text-slate-950">
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
            className="capitalize text-xs"
          >
            {bus.status}
          </Badge>
        </div>
        {isAssignedToMe && (
          <div className="pt-1">
            <Badge variant="softBlue" className="text-xs font-bold">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Assigned to You
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-100">
          <div>
            <span className="text-slate-400 block font-medium">Plate Number</span>
            <strong className="text-slate-800 font-mono">{bus.licensePlate}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Capacity</span>
            <strong className="text-slate-800">{bus.capacity} seats</strong>
          </div>
        </div>

        {/* Route Details */}
        {bus.assignedRoute ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Route className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>{bus.assignedRoute.routeName}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <span className="truncate">{bus.assignedRoute.startPoint}</span>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">{bus.assignedRoute.endPoint}</span>
            </div>

            {bus.assignedRoute.stops?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {bus.assignedRoute.stops.map((stop, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-white border border-blue-200/60 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                  >
                    <MapPin className="h-2.5 w-2.5 text-blue-500" />
                    {stop}
                  </span>
                ))}
              </div>
            )}

            {bus.assignedRoute.scheduleTimes?.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1 border-t border-blue-100/60">
                <Clock className="h-3 w-3 text-blue-600 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {bus.assignedRoute.scheduleTimes.map((t, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-400 italic text-center">
            Route: Not assigned yet
          </div>
        )}

        {/* Driver status */}
        <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
          <User className="h-3.5 w-3.5 text-slate-400" />
          {bus.assignedDriver ? (
            isAssignedToMe ? (
              <span className="font-bold text-blue-600">You are driving this bus</span>
            ) : (
              <span>
                Driver: <strong>{bus.assignedDriver.name}</strong>
              </span>
            )
          ) : (
            <span className="text-slate-400 italic">Driver: Unassigned</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

