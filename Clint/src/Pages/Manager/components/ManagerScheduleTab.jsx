import { useState } from 'react'
import {
  CalendarClock,
  Clock,
  Bus,
  Route,
  User,
  Search,
  Pencil,
  Trash2,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'

const DAYS = ['All Days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ManagerScheduleTab({
  schedules = [],
  loading = false,
  search = '',
  setSearch,
  onOpenCreateModal,
  onEditSchedule,
  onDeleteSchedule,
}) {
  const [selectedDay, setSelectedDay] = useState('All Days')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredSchedules = schedules.filter((item) => {
    // Search filter
    const q = search.toLowerCase()
    const matchesSearch =
      search === '' ||
      item.departureTime?.toLowerCase().includes(q) ||
      item.arrivalTime?.toLowerCase().includes(q) ||
      item.remarks?.toLowerCase().includes(q) ||
      item.bus?.busNumber?.toLowerCase().includes(q) ||
      item.bus?.name?.toLowerCase().includes(q) ||
      item.route?.routeName?.toLowerCase().includes(q) ||
      item.route?.startPoint?.toLowerCase().includes(q) ||
      item.route?.endPoint?.toLowerCase().includes(q) ||
      item.driver?.name?.toLowerCase().includes(q)

    // Day filter
    const matchesDay =
      selectedDay === 'All Days' || (item.operatingDays && item.operatingDays.includes(selectedDay))

    // Status filter
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus

    return matchesSearch && matchesDay && matchesStatus
  })

  // Quick stats
  const totalCount = schedules.length
  const activeCount = schedules.filter((s) => s.status === 'active').length
  const delayedCount = schedules.filter((s) => s.status === 'delayed').length
  const uniqueBusesCount = new Set(schedules.map((s) => s.bus?._id || s.bus?.id || s.bus).filter(Boolean)).size

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active':
        return 'softGreen'
      case 'delayed':
        return 'softAmber'
      case 'completed':
        return 'softBlue'
      case 'inactive':
      case 'cancelled':
        return 'softRed'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Top Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl flex items-center gap-2.5">
            <CalendarClock className="h-7 w-7 text-blue-600" />
            Bus Schedules & Timetable
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define and manage university bus schedules, departure times, arrival windows, and operating days.
          </p>
        </div>

        <Button
          type="button"
          onClick={onOpenCreateModal}
          className="h-9 px-3.5 text-xs sm:h-10 sm:px-4 sm:text-sm self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Create Bus Schedule
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-slate-200/80 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Schedules</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarClock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalCount}</p>
          <span className="text-[11px] text-slate-400">Scheduled transit runs</span>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Duty</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{activeCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Running on schedule</span>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Delayed / Flagged</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700">{delayedCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">Attention needed</span>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned Fleet</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Bus className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-700">{uniqueBusesCount}</p>
          <span className="text-[11px] text-slate-400">Buses in service</span>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search schedules by bus number, model, route, departure, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Day of week filter */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="delayed">Delayed Only</option>
            <option value="completed">Completed</option>
            <option value="inactive">Inactive</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Schedules Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" /> Master Transit Timetable ({filteredSchedules.length})
          </CardTitle>
          {filteredSchedules.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              Showing {filteredSchedules.length} of {totalCount}
            </Badge>
          )}
        </CardHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm font-medium">Loading bus schedules...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <CalendarClock className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No bus schedules found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              {search || selectedDay !== 'All Days' || selectedStatus !== 'all'
                ? 'No schedules matched your search or filters. Try adjusting your query.'
                : 'Click "Create Bus Schedule" to add your first departure and arrival timetable.'}
            </p>
            {!(search || selectedDay !== 'All Days' || selectedStatus !== 'all') && (
              <Button type="button" onClick={onOpenCreateModal} className="mt-4">
                <Plus className="h-4 w-4 mr-1.5" /> Create Bus Schedule
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Bus Vehicle</th>
                  <th className="px-5 py-3.5">Campus Route</th>
                  <th className="px-5 py-3.5">Departure & Arrival</th>
                  <th className="px-5 py-3.5">Assigned Driver</th>
                  <th className="px-5 py-3.5">Operating Days</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSchedules.map((schedule) => {
                  const sid = schedule._id || schedule.id
                  const bus = schedule.bus
                  const route = schedule.route
                  const driver = schedule.driver

                  return (
                    <tr key={sid} className="hover:bg-slate-50/70 transition-colors">
                      {/* Bus Vehicle */}
                      <td className="px-5 py-3.5">
                        {bus ? (
                          <div className="flex items-center gap-2.5">
                            <Badge variant="secondary" className="font-mono font-bold text-xs shrink-0">
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
                        ) : (
                          <span className="text-xs text-slate-400 italic">No bus specified</span>
                        )}
                      </td>

                      {/* Route */}
                      <td className="px-5 py-3.5">
                        {route ? (
                          <div>
                            <strong className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                              <Route className="h-3.5 w-3.5" /> {route.routeName}
                            </strong>
                            <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                              <span>{route.startPoint}</span>
                              <ArrowRight className="h-3 w-3 text-slate-400" />
                              <span>{route.endPoint}</span>
                            </div>
                            {route.stops && route.stops.length > 0 && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[200px]">
                                Stops: {route.stops.slice(0, 3).join(', ')}
                                {route.stops.length > 3 ? '...' : ''}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No route linked</span>
                        )}
                      </td>

                      {/* Departure & Arrival Times */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-bold text-xs">
                              <Clock className="h-3 w-3 text-blue-600" />
                              <span>{schedule.departureTime}</span>
                            </div>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-xs">
                              <Clock className="h-3 w-3 text-emerald-600" />
                              <span>{schedule.arrivalTime}</span>
                            </div>
                          </div>
                          {schedule.remarks && (
                            <p className="text-[11px] text-slate-500 italic max-w-xs truncate">
                              "{schedule.remarks}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Driver */}
                      <td className="px-5 py-3.5">
                        {driver ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-xs font-bold text-white shadow-2xs">
                              {driver.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">
                                {driver.name}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate max-w-[130px]">
                                {driver.email}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Operating Days */}
                      <td className="px-5 py-3.5">
                        {schedule.operatingDays && schedule.operatingDays.length > 0 ? (
                          schedule.operatingDays.length === 7 ? (
                            <Badge variant="softBlue" className="text-[11px] font-semibold">
                              All Days (Daily)
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {schedule.operatingDays.map((day) => (
                                <span
                                  key={day}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold"
                                >
                                  {day.slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-slate-400 italic">Flexible</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={getStatusBadgeVariant(schedule.status)}
                          className="capitalize text-xs font-bold"
                        >
                          {schedule.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Schedule"
                            onClick={() => onEditSchedule(schedule)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete Schedule"
                            onClick={() => onDeleteSchedule(schedule)}
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
