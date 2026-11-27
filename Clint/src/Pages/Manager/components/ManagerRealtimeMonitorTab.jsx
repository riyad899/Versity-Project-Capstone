import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Radio,
  Bus,
  Navigation,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Gauge,
  MapPin,
  Search,
  ArrowRight,
  User,
  Activity,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  StopCircle,
  HelpCircle,
  Play,
  Pause,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import ActiveBusesMap from '@/Components/Map/ActiveBusesMap'
import LogDelayModal from './LogDelayModal'
import apiClient from '@/Hooks/Axios'
import toast from 'react-hot-toast'
import {
  buildRouteNodes,
  calculateDistanceKm,
  findNearestRouteStop,
  formatDuration,
  formatRelativeTime,
  getCompassDirection,
} from '@/lib/geoUtils'

const AUTO_REFRESH_INTERVAL_MS = 5000

export default function ManagerRealtimeMonitorTab({ onTabSwitch }) {
  const [data, setData] = useState({
    buses: [],
    routes: [],
    liveTripsCount: 0,
    standbyBusesCount: 0,
    activeBusesCount: 0,
    serverTime: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(Date.now())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'on_trip', 'delayed', 'standby'
  const [selectedBusId, setSelectedBusId] = useState('all')
  const [delayModalBus, setDelayModalBus] = useState(null)
  const [viewMode, setViewMode] = useState('split') // 'split', 'grid', 'map'
  const [stoppingTripId, setStoppingTripId] = useState(null)

  const isMountedRef = useRef(true)

  // Fetch live fleet and trip telemetry
  const fetchLiveTelemetry = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await apiClient.get('/api/v1/trips/live-map')
      if (isMountedRef.current) {
        setData(res.data?.data || {})
        setLastRefreshed(Date.now())
      }
    } catch (err) {
      if (!isSilent) {
        toast.error(err.response?.data?.message || 'Failed to fetch live fleet monitor data')
      }
    } finally {
      if (isMountedRef.current && !isSilent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchLiveTelemetry(false)
    return () => {
      isMountedRef.current = false
    }
  }, [fetchLiveTelemetry])

  // Real-time polling timer
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchLiveTelemetry(true)
    }, AUTO_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLiveTelemetry])

  const allBuses = data.buses || []

  // Compute delay and route progress statistics
  const metrics = useMemo(() => {
    const total = allBuses.length
    const onTripBuses = allBuses.filter((b) => b.tripStatus === 'on_trip')
    const delayedBuses = allBuses.filter(
      (b) => (b.delayMinutes || b.bus?.delayMinutes || 0) > 0
    )
    const standbyBuses = allBuses.filter((b) => b.tripStatus !== 'on_trip')
    const movingBuses = onTripBuses.filter(
      (b) => (Number(b.currentLocation?.speed) || 0) > 1
    )

    const totalDelayMins = delayedBuses.reduce(
      (acc, b) => acc + (b.delayMinutes || b.bus?.delayMinutes || 0),
      0
    )
    const onTimeRate =
      total > 0
        ? Math.round(((total - delayedBuses.length) / total) * 100)
        : 100

    return {
      total,
      onTripCount: onTripBuses.length,
      movingCount: movingBuses.length,
      standbyCount: standbyBuses.length,
      delayedCount: delayedBuses.length,
      totalDelayMins,
      onTimeRate,
      delayedBuses,
    }
  }, [allBuses])

  // Filter buses by search and selected filter tab
  const filteredBuses = useMemo(() => {
    return allBuses.filter((item) => {
      const busObj = item.bus || item
      const delay = item.delayMinutes || busObj.delayMinutes || 0
      const isOnTrip = item.tripStatus === 'on_trip'

      if (statusFilter === 'on_trip' && !isOnTrip) return false
      if (statusFilter === 'delayed' && delay <= 0) return false
      if (statusFilter === 'standby' && isOnTrip) return false

      if (!search.trim()) return true
      const q = search.toLowerCase().trim()

      return (
        busObj.busNumber?.toLowerCase().includes(q) ||
        busObj.name?.toLowerCase().includes(q) ||
        busObj.licensePlate?.toLowerCase().includes(q) ||
        item.driverName?.toLowerCase().includes(q) ||
        item.route?.routeName?.toLowerCase().includes(q) ||
        item.route?.startPoint?.toLowerCase().includes(q) ||
        item.route?.endPoint?.toLowerCase().includes(q)
      )
    })
  }, [allBuses, search, statusFilter])

  // Calculate route progress details for a bus
  const getRouteProgressInfo = (item) => {
    const route = item.route
    if (!route) return null

    const nodes = buildRouteNodes(route)
    if (nodes.length < 2) return null

    // Approximate total route distance
    let totalKm = 0
    for (let i = 1; i < nodes.length; i++) {
      totalKm += calculateDistanceKm(
        nodes[i - 1].lat,
        nodes[i - 1].lng,
        nodes[i].lat,
        nodes[i].lng
      )
    }
    totalKm = Math.round(totalKm * 10) / 10

    const loc = item.currentLocation
    let progressPct = 0
    let nearestStop = null
    let distRemainingKm = totalKm

    if (loc?.latitude != null && loc?.longitude != null) {
      const nearestInfo = findNearestRouteStop(loc, route)
      nearestStop = nearestInfo?.nearest

      const dest = nodes[nodes.length - 1]
      const distToDest = calculateDistanceKm(loc.latitude, loc.longitude, dest.lat, dest.lng)
      distRemainingKm = Math.max(0, Math.round(distToDest * 10) / 10)

      const distanceCovered = Math.max(0, totalKm - distRemainingKm)
      progressPct = Math.min(100, Math.max(5, Math.round((distanceCovered / (totalKm || 1)) * 100)))
    }

    return {
      nodes,
      totalKm,
      progressPct: item.tripStatus === 'on_trip' ? progressPct : 0,
      distRemainingKm,
      nearestStop,
    }
  }

  // Manager force stop active trip
  const handleForceStopTrip = async (tripId, busNumber) => {
    if (!tripId) return
    if (!window.confirm(`Are you sure you want to stop the active trip for Bus #${busNumber}?`)) {
      return
    }

    setStoppingTripId(tripId)
    try {
      await apiClient.patch(`/api/v1/trips/${tripId}/stop`, {
        remarks: 'Force completed by Transportation Manager',
      })
      toast.success(`Active trip for Bus #${busNumber} completed successfully!`)
      fetchLiveTelemetry(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to stop trip')
    } finally {
      setStoppingTripId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Monitor Control Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                Real-Time Transit & Fleet Operations Monitor
              </h2>
              <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50/70 text-[11px] font-bold">
                Live Telemetry Feed
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Continuous live tracking of active campus buses, route progress, nearest stop estimates, and delay alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto refresh toggle button */}
            <Button
              type="button"
              variant={autoRefresh ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-9 px-3 text-xs font-semibold gap-1.5"
            >
              {autoRefresh ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-slate-500" />
                  Auto-Refresh (5s)
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-blue-600" />
                  Resume Auto (5s)
                </>
              )}
            </Button>

            {/* Manual refresh */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchLiveTelemetry(false)}
              disabled={loading}
              className="h-9 px-3 text-xs font-semibold"
            >
              <RotateCw className={`h-3.5 w-3.5 mr-1.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'split' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Split View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cards Only
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'map' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Map Full
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Real-Time Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Fleet */}
        <Card className="border-slate-200/80 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Fleet
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
                <span className="text-xs text-slate-500 font-semibold">buses in fleet</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                <span>{metrics.standbyCount} standby / idle</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Bus className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Live On-Trip & Moving */}
        <Card className="border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                On Trip (Active)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-900">{metrics.onTripCount}</span>
                <span className="text-xs text-emerald-700 font-semibold">trips ongoing</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-600 font-medium">
                <Activity className="h-3 w-3" />
                <span>{metrics.movingCount} currently in motion</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Navigation className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Real-time Delays Alert */}
        <Card className={`shadow-2xs ${metrics.delayedCount > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200/80 bg-white'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                Active Delays
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black ${metrics.delayedCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
                  {metrics.delayedCount}
                </span>
                <span className="text-xs text-amber-700 font-semibold">delayed buses</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-600 font-medium">
                <Clock className="h-3 w-3" />
                <span>{metrics.totalDelayMins}m total delay time</span>
              </div>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${metrics.delayedCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* On-Time Performance Rate */}
        <Card className="border-slate-200/80 bg-white shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                On-Time Reliability
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{metrics.onTimeRate}%</span>
                <span className="text-xs text-slate-500 font-semibold">fleet on-schedule</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>Updated {formatRelativeTime(lastRefreshed)}</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Gauge className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Delays Alert Banner (If Any Bus Is Delayed) */}
      {metrics.delayedCount > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-amber-950">
                  Real-Time Delay Advisory: {metrics.delayedCount} Campus Shuttle{metrics.delayedCount > 1 ? 's' : ''} Delayed
                </h4>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-amber-900">
                  {metrics.delayedBuses.map((item) => {
                    const busObj = item.bus || item
                    const delayMins = item.delayMinutes || busObj.delayMinutes || 0
                    const reason = item.delayReason || busObj.delayReason || 'Traffic slowdown'
                    return (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white/90 border border-amber-200 px-2 py-0.5 font-medium shadow-2xs"
                      >
                        <strong className="font-mono">#{busObj.busNumber}</strong> ({item.route?.routeName || 'Route'}):
                        <span className="text-red-700 font-bold">+{delayMins}m</span> — {reason}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setStatusFilter('delayed')}
              className="text-xs font-bold border-amber-400 bg-white text-amber-900 hover:bg-amber-100 shrink-0 self-start sm:self-auto"
            >
              Filter Delayed Buses
            </Button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by bus #, name, driver, or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white"
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className="h-8 text-xs font-bold"
          >
            All Buses ({allBuses.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === 'on_trip' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('on_trip')}
            className={`h-8 text-xs font-bold ${
              statusFilter === 'on_trip' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 inline-block"></span>
            On Trip ({metrics.onTripCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === 'delayed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('delayed')}
            className={`h-8 text-xs font-bold ${
              statusFilter === 'delayed' ? 'bg-amber-600 hover:bg-amber-700' : 'text-amber-800 border-amber-200 hover:bg-amber-50'
            }`}
          >
            ⚠️ Delayed ({metrics.delayedCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === 'standby' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('standby')}
            className="h-8 text-xs font-bold"
          >
            Standby ({metrics.standbyCount})
          </Button>
        </div>
      </div>

      {/* Main Content Layout based on viewMode */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Left Column: Real-Time Bus Cards & Route Progress */}
        {viewMode !== 'map' && (
          <div className={`${viewMode === 'split' ? 'xl:col-span-7' : 'w-full'} space-y-4`}>
            {filteredBuses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
                  <Bus className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No buses matching criteria</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm">
                  Try clearing your search query or switching to another filter status.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredBuses.map((item) => {
                  const busObj = item.bus || item
                  const busId = busObj._id || busObj.id || item.id
                  const isOnTrip = item.tripStatus === 'on_trip'
                  const delayMinutes = item.delayMinutes || busObj.delayMinutes || 0
                  const delayReason = item.delayReason || busObj.delayReason || ''
                  const speed = Math.round(Number(item.currentLocation?.speed) || 0)
                  const heading = Math.round(Number(item.currentLocation?.heading) || 0)
                  const compassDir = getCompassDirection(heading)
                  const isSelected = selectedBusId === item.id || selectedBusId === busId
                  const progressInfo = getRouteProgressInfo(item)

                  return (
                    <Card
                      key={item.id}
                      className={`border transition-all overflow-hidden bg-white shadow-xs ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
                          : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Header */}
                      <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/70">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="secondary" className="font-mono font-bold text-xs h-6 px-2 shrink-0">
                              #{busObj.busNumber}
                            </Badge>
                            <CardTitle className="text-sm font-extrabold text-slate-900 truncate">
                              {busObj.name}
                            </CardTitle>
                            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                              ({busObj.licensePlate})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Trip State Badge */}
                            {isOnTrip ? (
                              <Badge variant="softGreen" className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                ON TRIP
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] font-medium text-slate-600 px-2 py-0.5">
                                STANDBY
                              </Badge>
                            )}

                            {/* Delay Badge */}
                            {delayMinutes > 0 ? (
                              <Badge variant="softRed" className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 animate-pulse">
                                <Clock className="h-2.5 w-2.5" />
                                +{delayMinutes}m DELAY
                              </Badge>
                            ) : (
                              <Badge variant="softGreen" className="text-[10px] font-semibold px-2 py-0.5">
                                ON TIME
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-3.5">
                        {/* Driver & Telemetry Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1 px-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Driver
                            </span>
                            <div className="flex items-center gap-1 font-semibold text-slate-800 truncate mt-0.5">
                              <User className="h-3 w-3 text-slate-500 shrink-0" />
                              <span className="truncate">{item.driverName || 'Unassigned'}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Live Speed
                            </span>
                            <div className="flex items-center gap-1 font-mono font-bold text-slate-800 mt-0.5">
                              <Gauge className="h-3 w-3 text-blue-600 shrink-0" />
                              <span>{speed} km/h</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Heading
                            </span>
                            <div className="font-semibold text-slate-800 mt-0.5">
                              {compassDir} ({heading}°)
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Last Ping
                            </span>
                            <div className="text-slate-600 mt-0.5">
                              {formatRelativeTime(item.currentLocation?.updatedAt)}
                            </div>
                          </div>
                        </div>

                        {/* Real-Time Route Progress Section */}
                        {item.route ? (
                          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="font-bold text-blue-950 flex items-center gap-1.5 truncate">
                                <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                <span>{item.route.routeName}</span>
                              </div>
                              <span className="text-[11px] text-blue-700 font-semibold shrink-0">
                                {item.route.startPoint} → {item.route.endPoint}
                              </span>
                            </div>

                            {/* Visual Progress Bar */}
                            {progressInfo && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-600">
                                    Route Progress: <strong className="text-blue-700">{progressInfo.progressPct}%</strong>
                                  </span>
                                  <span className="text-slate-500 font-mono">
                                    {isOnTrip ? `~${progressInfo.distRemainingKm} km to destination` : 'Trip not started'}
                                  </span>
                                </div>

                                <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 rounded-full ${
                                      delayMinutes > 0 ? 'bg-amber-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${progressInfo.progressPct}%` }}
                                  />
                                </div>

                                {/* Approaching / Nearest Stop Indicator */}
                                {progressInfo.nearestStop && isOnTrip && (
                                  <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1">
                                    <span className="flex items-center gap-1 truncate font-medium">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      Approaching: <strong className="text-slate-900">{progressInfo.nearestStop.name}</strong>
                                    </span>
                                    <span className="text-slate-500 text-[10px] font-mono">
                                      ({progressInfo.nearestStop.distanceKm} km away)
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Stops Breadcrumb / Stepper */}
                            {progressInfo?.nodes && progressInfo.nodes.length > 0 && (
                              <div className="flex items-center gap-1 overflow-x-auto py-1 text-[10px]">
                                {progressInfo.nodes.map((node, nIdx) => {
                                  const isLast = nIdx === progressInfo.nodes.length - 1
                                  return (
                                    <div key={node.key || nIdx} className="flex items-center gap-1 shrink-0">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                          node.type === 'origin'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : node.type === 'destination'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-white text-slate-700 border-slate-200'
                                        }`}
                                      >
                                        {node.name}
                                      </span>
                                      {!isLast && <ArrowRight className="h-2.5 w-2.5 text-slate-400 shrink-0" />}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-2.5 text-center text-xs text-slate-400 italic">
                            No route assigned to this bus yet.
                          </div>
                        )}

                        {/* Active Delay Warning Box (If Delayed) */}
                        {delayMinutes > 0 && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                            <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-amber-950">
                                Bus Delayed by +{delayMinutes} Minutes
                              </span>
                              {delayReason && (
                                <p className="text-[11px] text-amber-800 mt-0.5">
                                  Reason: {delayReason}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Manager Real-Time Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            {/* Focus on map */}
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => {
                                setSelectedBusId(item.id)
                                if (viewMode === 'grid') setViewMode('split')
                              }}
                              className="h-8 px-2.5 text-xs font-semibold"
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              {isSelected ? 'Focused on Map' : 'Focus on Map'}
                            </Button>

                            {/* Stop Active Trip button */}
                            {isOnTrip && item.tripId && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleForceStopTrip(item.tripId, busObj.busNumber)}
                                disabled={stoppingTripId === item.tripId}
                                className="h-8 px-2 text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50"
                              >
                                <StopCircle className="h-3 w-3 mr-1 text-rose-600" />
                                End Trip
                              </Button>
                            )}
                          </div>

                          {/* Log / Update Delay Button */}
                          <Button
                            type="button"
                            size="sm"
                            variant={delayMinutes > 0 ? 'default' : 'outline'}
                            onClick={() => setDelayModalBus(item)}
                            className={`h-8 px-2.5 text-xs font-bold ${
                              delayMinutes > 0
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'text-amber-800 border-amber-300 hover:bg-amber-50'
                            }`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {delayMinutes > 0 ? 'Update Delay' : 'Log Delay'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Right Column: Live Interactive Leaflet GPS Fleet Map */}
        {viewMode !== 'grid' && (
          <div className={`${viewMode === 'split' ? 'xl:col-span-5' : 'w-full'} space-y-3`}>
            <div className="sticky top-4 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Live Campus Fleet Map
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                    {filteredBuses.length} shown
                  </Badge>
                </div>

                {selectedBusId !== 'all' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedBusId('all')}
                    className="h-6 px-2 text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Reset Map Selection
                  </Button>
                )}
              </div>

              {/* Map Canvas */}
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <ActiveBusesMap
                  buses={filteredBuses}
                  selectedBusId={selectedBusId}
                  onSelectBus={(bus) => {
                    setSelectedBusId(bus?.id || bus?._id || 'all')
                  }}
                  height={viewMode === 'map' ? '680px' : '580px'}
                />
              </div>

              {/* Map Footer legend */}
              <div className="pt-2.5 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Moving
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span> Live / Stopped
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span> Standby
                  </span>
                </div>
                <span>Auto updates every 5s</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delay Management Modal */}
      {delayModalBus && (
        <LogDelayModal
          isOpen={Boolean(delayModalBus)}
          onClose={() => setDelayModalBus(null)}
          bus={delayModalBus}
          onDelayUpdated={() => {
            fetchLiveTelemetry(true)
          }}
        />
      )}
    </div>
  )
}
