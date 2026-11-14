import { Bus, Route, Search, User, ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'

export default function ManagerDriverRouteAssignTab({
  buses,
  routes,
  search,
  setSearch,
  onOpenAssignDriver,
  onOpenAssignRoute,
  onEditRoute,
  onDeleteRoute,
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Driver & Route Assignments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pair campus drivers with buses and bind buses to specific transit routes.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search buses to assign drivers or routes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* Bus Assignment Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bus className="h-4 w-4 text-blue-600" /> Fleet Assignment Overview
          </CardTitle>
        </CardHeader>
        {buses.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No buses found. Add buses in the "Bus Fleet" tab first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Bus Information</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Driver</th>
                  <th className="px-5 py-3.5">Assigned Route</th>
                  <th className="px-5 py-3.5 text-right">Assignments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {buses.map((bus) => {
                  const bid = bus._id || bus.id
                  return (
                    <tr key={bid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Badge variant="secondary" className="font-mono font-bold text-xs">
                            #{bus.busNumber}
                          </Badge>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {bus.name}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {bus.licensePlate} • {bus.capacity} seats
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
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
                      </td>
                      <td className="px-5 py-3.5">
                        {bus.assignedDriver ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-xs font-bold text-white shadow-2xs">
                              {bus.assignedDriver.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">
                                {bus.assignedDriver.name}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {bus.assignedDriver.email}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No driver assigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {bus.assignedRoute ? (
                          <div>
                            <strong className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                              <Route className="h-3 w-3" /> {bus.assignedRoute.routeName}
                            </strong>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              {bus.assignedRoute.startPoint} <ArrowRight className="h-2.5 w-2.5" />{' '}
                              {bus.assignedRoute.endPoint}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No route assigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => onOpenAssignDriver(bus)}
                          >
                            <User className="h-3.5 w-3.5 mr-1" />
                            {bus.assignedDriver ? 'Change Driver' : 'Assign Driver'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => onOpenAssignRoute(bus)}
                          >
                            <Route className="h-3.5 w-3.5 mr-1" />
                            {bus.assignedRoute ? 'Change Route' : 'Assign Route'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Configured Routes Sub-Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              Configured Campus Routes ({routes.length})
            </h3>
            <p className="text-xs text-slate-500">
              List of established origin-to-destination pathways across the campus.
            </p>
          </div>
        </div>

        <Card className="border-slate-200/80 shadow-xs overflow-hidden">
          {routes.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No routes registered yet. Click "Create Route" above to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Route Name</th>
                    <th className="px-5 py-3.5">Origin</th>
                    <th className="px-5 py-3.5">Destination</th>
                    <th className="px-5 py-3.5">Stops</th>
                    <th className="px-5 py-3.5">Departures</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {routes.map((r) => (
                    <tr key={r._id || r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{r.routeName}</td>
                      <td className="px-5 py-3.5 text-slate-700">{r.startPoint}</td>
                      <td className="px-5 py-3.5 text-slate-700">{r.endPoint}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {r.stops?.join(', ') || 'Direct non-stop'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {r.scheduleTimes?.join(', ') || 'Flexible'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Route"
                            onClick={() => onEditRoute(r)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete Route"
                            onClick={() => onDeleteRoute(r)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

