import { Bus, Search, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'

export default function ManagerBusFleetTab({
  buses,
  loading,
  search,
  setSearch,
  onEditBus,
  onDeleteBus,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Campus Bus Fleet
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register, configure, and manage university shuttle buses and operational statuses.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search buses by number, name, or plate..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* Table Card */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm font-medium">Loading buses...</p>
          </div>
        ) : buses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <Bus className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No buses registered yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Click "Add Campus Bus" above to add your first bus to the fleet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Bus Number</th>
                  <th className="px-5 py-3.5">Bus Model / Name</th>
                  <th className="px-5 py-3.5">License Plate</th>
                  <th className="px-5 py-3.5">Capacity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {buses.map((bus) => {
                  const bid = bus._id || bus.id
                  return (
                    <tr key={bid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <Badge variant="secondary" className="font-mono font-bold text-xs">
                          #{bus.busNumber}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <strong className="text-slate-900 font-bold">{bus.name}</strong>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                        {bus.licensePlate}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <span className="font-bold text-slate-900">{bus.capacity}</span> seats
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5">
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
                            {bus.tripStatus === 'on_trip' && (
                              <Badge variant="softGreen" className="text-[10px] font-bold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                ON TRIP
                              </Badge>
                            )}
                          </div>
                          {(bus.delayMinutes || 0) > 0 && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                              ⚠️ +{bus.delayMinutes}m late
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Bus Details"
                            onClick={() => onEditBus(bus)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete Bus"
                            onClick={() => onDeleteBus(bus)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  )
}

