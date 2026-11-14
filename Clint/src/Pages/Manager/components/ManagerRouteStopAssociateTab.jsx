import { useState, useEffect, useCallback } from 'react'
import apiClient from '../../../Hooks/Axios'
import toast from 'react-hot-toast'
import {
  MapPin,
  Route as RouteIcon,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Navigation,
  Bus,
  Layers,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import EditStopModal from './EditStopModal'
import EditTerminalModal from './EditTerminalModal'

export default function ManagerRouteStopAssociateTab({ routes = [], onRefreshRoutes }) {
  const [routesData, setRoutesData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [newStopInputs, setNewStopInputs] = useState({})
  const [actionLoading, setActionLoading] = useState({})

  // Modals state
  const [editStopModal, setEditStopModal] = useState(null)
  const [editTerminalModal, setEditTerminalModal] = useState(null)

  // Fetch routes with stop associations
  const fetchRoutesWithStops = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await apiClient.get('/api/v1/stop-associated')
      if (res.data?.data) {
        setRoutesData(res.data.data)
      } else if (routes && routes.length > 0) {
        setRoutesData(routes)
      }
    } catch {
      // Fallback to routes prop if endpoint not ready
      if (routes && routes.length > 0) {
        setRoutesData(routes)
      }
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [routes])

  useEffect(() => {
    fetchRoutesWithStops()
  }, [fetchRoutesWithStops])

  const refreshAll = async () => {
    await fetchRoutesWithStops(true)
    if (onRefreshRoutes) {
      onRefreshRoutes()
    }
  }

  // Handle adding stop
  const handleAddStop = async (routeId, routeName) => {
    const stopName = (newStopInputs[routeId] || '').trim()
    if (!stopName) {
      toast.error('Please enter a stop name')
      return
    }

    setActionLoading((prev) => ({ ...prev, [`add-${routeId}`]: true }))
    try {
      await apiClient.post(`/api/v1/stop-associated/${routeId}/stops`, { stopName })
      toast.success(`Stop "${stopName}" added to ${routeName}`)
      setNewStopInputs((prev) => ({ ...prev, [routeId]: '' }))
      await refreshAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stop')
    } finally {
      setActionLoading((prev) => ({ ...prev, [`add-${routeId}`]: false }))
    }
  }

  // Handle reordering stop (direction: -1 for up/earlier, 1 for down/later)
  const handleReorderStop = async (route, index, direction) => {
    const routeId = route._id || route.id
    const currentStops = [...(route.stops || [])]
    const targetIndex = index + direction

    if (targetIndex < 0 || targetIndex >= currentStops.length) return

    const temp = currentStops[index]
    currentStops[index] = currentStops[targetIndex]
    currentStops[targetIndex] = temp

    setActionLoading((prev) => ({ ...prev, [`reorder-${routeId}`]: true }))
    try {
      await apiClient.put(`/api/v1/stop-associated/${routeId}/stops`, { stops: currentStops })
      toast.success('Stop sequence updated')
      await refreshAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reorder stops')
    } finally {
      setActionLoading((prev) => ({ ...prev, [`reorder-${routeId}`]: false }))
    }
  }

  // Handle removing a stop
  const handleRemoveStop = async (routeId, routeName, stopName) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove stop "${stopName}" from ${routeName}?`
    )
    if (!confirmed) return

    try {
      await apiClient.delete(
        `/api/v1/stop-associated/${routeId}/stops/${encodeURIComponent(stopName)}`
      )
      toast.success(`Stop "${stopName}" removed from route`)
      await refreshAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove stop')
    }
  }

  // Submit edit stop rename
  const handleEditStopSubmit = async (e) => {
    e.preventDefault()
    if (!editStopModal) return
    const { routeId, oldStopName, newStopName } = editStopModal
    if (!newStopName.trim()) {
      toast.error('Stop name cannot be empty')
      return
    }

    try {
      await apiClient.patch(`/api/v1/stop-associated/${routeId}/stops`, {
        oldStopName,
        newStopName: newStopName.trim(),
      })
      toast.success('Stop renamed successfully')
      setEditStopModal(null)
      await refreshAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename stop')
    }
  }

  // Submit edit terminal destinations
  const handleEditTerminalSubmit = async (e) => {
    e.preventDefault()
    if (!editTerminalModal) return
    const { routeId, startPoint, endPoint } = editTerminalModal
    if (!startPoint.trim() || !endPoint.trim()) {
      toast.error('Both origin and destination are required')
      return
    }

    try {
      await apiClient.patch(`/api/v1/stop-associated/${routeId}/endpoints`, {
        startPoint: startPoint.trim(),
        endPoint: endPoint.trim(),
      })
      toast.success('Route terminals updated successfully')
      setEditTerminalModal(null)
      await refreshAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update terminals')
    }
  }

  // Filtered routes based on search
  const filteredRoutes = routesData.filter((r) => {
    if (!search) return true
    const term = search.toLowerCase()
    const nameMatch = r.routeName?.toLowerCase().includes(term)
    const startMatch = r.startPoint?.toLowerCase().includes(term)
    const endMatch = r.endPoint?.toLowerCase().includes(term)
    const stopsMatch = (r.stops || []).some((s) => s.toLowerCase().includes(term))
    return nameMatch || startMatch || endMatch || stopsMatch
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl flex items-center gap-2">
            <RouteIcon className="h-7 w-7 text-blue-600" />
            Route Stop Associate
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure start points, ordered intermediate stops, and final destinations across campus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchRoutesWithStops()}
            disabled={loading}
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Filter by route, terminal, or stop name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* Route Cards List */}
      {loading && routesData.length === 0 ? (
        <Card className="p-12 text-center text-sm text-slate-500 border-slate-200">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
          Loading route stop associations...
        </Card>
      ) : filteredRoutes.length === 0 ? (
        <Card className="p-12 text-center text-sm text-slate-500 border-slate-200">
          <MapPin className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No matching routes found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Try clearing your search query.' : 'Create routes in the "Driver & Route Assignments" tab first.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredRoutes.map((route) => {
            const routeId = route._id || route.id
            const stops = Array.isArray(route.stops) ? route.stops : []
            const newStopValue = newStopInputs[routeId] || ''
            const isAddLoading = actionLoading[`add-${routeId}`]

            return (
              <Card
                key={routeId}
                className="border-slate-200/90 shadow-sm bg-white overflow-hidden hover:border-slate-300 transition-colors"
              >
                {/* Route Card Header */}
                <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <RouteIcon className="h-4 w-4 text-blue-600" />
                        {route.routeName}
                      </CardTitle>
                      <Badge
                        variant={route.status === 'active' ? 'softGreen' : 'secondary'}
                        className="text-[11px] capitalize"
                      >
                        {route.status || 'active'}
                      </Badge>
                      <Badge variant="softBlue" className="text-[11px]">
                        {stops.length} Intermediate Stop{stops.length === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Created by: {route.createdBy?.name || 'Administrator'}</span>
                      {route.scheduleTimes && route.scheduleTimes.length > 0 && (
                        <span>• Times: {route.scheduleTimes.join(', ')}</span>
                      )}
                    </CardDescription>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold text-slate-700 self-start sm:self-auto"
                    onClick={() =>
                      setEditTerminalModal({
                        routeId,
                        routeName: route.routeName,
                        startPoint: route.startPoint,
                        endPoint: route.endPoint,
                      })
                    }
                  >
                    <Pencil className="h-3 w-3 mr-1 text-slate-500" />
                    Edit Terminals
                  </Button>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Journey Overview Bar */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Origin Terminal */}
                      <div className="flex items-start gap-3 min-w-[160px]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                          <Navigation className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                            Initial Origin
                          </span>
                          <span className="text-sm font-bold text-slate-900 block leading-tight">
                            {route.startPoint}
                          </span>
                          <span className="text-[11px] text-slate-400">First pickup terminal</span>
                        </div>
                      </div>

                      {/* Intermediate Stops Counter Banner */}
                      <div className="flex-1 flex items-center justify-center px-2 py-1">
                        <div className="w-full flex items-center gap-2">
                          <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-300 via-blue-300 to-purple-300 hidden sm:block" />
                          <Badge variant="outline" className="bg-white text-xs font-mono font-medium py-1 px-3 border-slate-200 shadow-2xs">
                            <Layers className="h-3 w-3 mr-1 text-blue-600 inline" />
                            {stops.length} stop{stops.length === 1 ? '' : 's'} in transit
                          </Badge>
                          <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-300 to-purple-300 hidden sm:block" />
                        </div>
                      </div>

                      {/* Destination Terminal */}
                      <div className="flex items-start gap-3 min-w-[160px] md:justify-end">
                        <div className="md:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                            Last Destination
                          </span>
                          <span className="text-sm font-bold text-slate-900 block leading-tight">
                            {route.endPoint}
                          </span>
                          <span className="text-[11px] text-slate-400">Final drop-off terminal</span>
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                          <MapPin className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sequential Stop List Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Intermediate Stop Pathway (Ordered Sequence)
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Use arrows to reorder stops along the route
                      </span>
                    </div>

                    {stops.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 bg-slate-50/40">
                        <MapPin className="h-6 w-6 mx-auto text-slate-300 mb-1.5" />
                        No intermediate stops associated with this route yet.
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Add bus stops below to configure pickup and drop-off locations between {route.startPoint} and {route.endPoint}.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5">
                        {stops.map((stopName, idx) => (
                          <div
                            key={`${stopName}-${idx}`}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/80 transition-colors shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Badge
                                variant="secondary"
                                className="font-mono font-bold text-xs h-6 w-7 justify-center shrink-0 bg-blue-50 text-blue-700 border-blue-200"
                              >
                                #{idx + 1}
                              </Badge>
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-slate-900 truncate block">
                                  {stopName}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  Transit stop {idx + 1} of {stops.length}
                                </span>
                              </div>
                            </div>

                            {/* Stop Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                title="Move Earlier (Up)"
                                disabled={idx === 0}
                                onClick={() => handleReorderStop(route, idx, -1)}
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                title="Move Later (Down)"
                                disabled={idx === stops.length - 1}
                                onClick={() => handleReorderStop(route, idx, 1)}
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50 ml-1"
                                title="Rename Stop"
                                onClick={() =>
                                  setEditStopModal({
                                    routeId,
                                    routeName: route.routeName,
                                    oldStopName: stopName,
                                    newStopName: stopName,
                                  })
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Remove Stop"
                                onClick={() => handleRemoveStop(routeId, route.routeName, stopName)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Stop Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddStop(routeId, route.routeName)
                    }}
                    className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                  >
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Add intermediate stop (e.g. Science Complex, Library, Dorms)..."
                        value={newStopValue}
                        onChange={(e) =>
                          setNewStopInputs({ ...newStopInputs, [routeId]: e.target.value })
                        }
                        className="pl-9 h-9 text-xs bg-slate-50/60 focus:bg-white"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isAddLoading || !newStopValue.trim()}
                      className="h-9 px-4 text-xs font-semibold shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Stop
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal: Edit Stop Name */}
      <EditStopModal
        isOpen={Boolean(editStopModal)}
        onClose={() => setEditStopModal(null)}
        editStopModal={editStopModal}
        setEditStopModal={setEditStopModal}
        onSubmit={handleEditStopSubmit}
      />

      {/* Modal: Edit Route Terminals */}
      <EditTerminalModal
        isOpen={Boolean(editTerminalModal)}
        onClose={() => setEditTerminalModal(null)}
        editTerminalModal={editTerminalModal}
        setEditTerminalModal={setEditTerminalModal}
        onSubmit={handleEditTerminalSubmit}
      />
    </div>
  )
}
