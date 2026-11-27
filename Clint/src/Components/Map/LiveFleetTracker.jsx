import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import apiClient from '@/Hooks/Axios'
import {
  Radio,
  Bus,
  Navigation,
  RotateCw,
  Search,
  MapPin,
  Gauge,
  Compass,
  Clock,
  Route as RouteIcon,
  Play,
  Square,
  Pause,
  Sparkles,
  User,
  Activity,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import ActiveBusesMap from '@/Components/Map/ActiveBusesMap'
import {
  buildRouteNodes,
  calculateBearing,
  calculateDistanceKm,
  findNearestRouteStop,
  formatDuration,
  formatRelativeTime,
  getCompassDirection,
} from '@/lib/geoUtils'

const SAMPLE_SIM_ROUTES = [
  {
    _id: 'sim-route-1',
    routeName: 'DSC Campus – Mirpur 10 Express',
    startPoint: 'Daffodil Smart City (DSC)',
    startCoordinates: { lat: 23.8769, lng: 90.3202 },
    endPoint: 'Mirpur 10 Circle',
    endCoordinates: { lat: 23.8069, lng: 90.3687 },
    stops: ['Birulia Bridge', 'Mirpur 2 (Sony Square)'],
    stopCoordinates: [
      { name: 'Birulia Bridge', lat: 23.8625, lng: 90.3408 },
      { name: 'Mirpur 2 (Sony Square)', lat: 23.8058, lng: 90.3621 },
    ],
  },
  {
    _id: 'sim-route-2',
    routeName: 'DSC – Uttara Metro Shuttle',
    startPoint: 'DSC Main Gate',
    startCoordinates: { lat: 23.8758, lng: 90.3215 },
    endPoint: 'Uttara House Building',
    endCoordinates: { lat: 23.8742, lng: 90.4005 },
    stops: ['Birulia Bridge', 'Uttara Center Metro Station'],
    stopCoordinates: [
      { name: 'Birulia Bridge', lat: 23.8625, lng: 90.3408 },
      { name: 'Uttara Center Metro Station', lat: 23.8595, lng: 90.3677 },
    ],
  },
  {
    _id: 'sim-route-3',
    routeName: 'DSC – Dhanmondi 27 Commuter',
    startPoint: 'Daffodil Smart City (DSC)',
    startCoordinates: { lat: 23.8769, lng: 90.3202 },
    endPoint: 'Dhanmondi 27 (Sobhanbag)',
    endCoordinates: { lat: 23.7549, lng: 90.3762 },
    stops: ['Mirpur 1 Bus Stand'],
    stopCoordinates: [{ name: 'Mirpur 1 Bus Stand', lat: 23.7956, lng: 90.3537 }],
  },
]

function interpolatePathPoint(waypoints, progress) {
  if (!waypoints || waypoints.length === 0) return null
  if (waypoints.length === 1) {
    return { lat: waypoints[0].lat, lng: waypoints[0].lng, heading: 0 }
  }

  const totalSegments = waypoints.length - 1
  const scaled = Math.min(totalSegments - 0.0001, Math.max(0, progress * totalSegments))
  const segIndex = Math.floor(scaled)
  const segT = scaled - segIndex

  const a = waypoints[segIndex]
  const b = waypoints[segIndex + 1]
  const lat = a.lat + (b.lat - a.lat) * segT
  const lng = a.lng + (b.lng - a.lng) * segT
  const heading = calculateBearing(a.lat, a.lng, b.lat, b.lng)

  return { lat, lng, heading }
}

export default function LiveFleetTracker({
  initialBusId = 'all',
  compact = false,
  title = 'Live Campus Bus Location & Movement Map',
  subtitle = 'Watch active buses move in real time with speed, compass heading, movement trails, and route stops.',
}) {
  const [liveData, setLiveData] = useState({
    liveTripsCount: 0,
    standbyBusesCount: 0,
    activeBusesCount: 0,
    buses: [],
    routes: [],
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  const [selectedBusId, setSelectedBusId] = useState(initialBusId || 'all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'on_trip' | 'idle'
  const [searchQuery, setSearchQuery] = useState('')

  // Client-side movement simulation preview mode
  const [simulationActive, setSimulationActive] = useState(false)
  const [simBuses, setSimBuses] = useState([])
  const simTickRef = useRef(0)
  const liveDataRef = useRef(liveData)
  liveDataRef.current = liveData

  // Tick timer to keep relative timestamps fresh every second
  const [, setClockTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setClockTick((c) => c + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Sync initialBusId if parent changes it (e.g., clicking "Track on Map" from buses list)
  useEffect(() => {
    if (initialBusId) {
      setSelectedBusId(initialBusId)
    }
  }, [initialBusId])

  const fetchLiveMapData = useCallback(async (isSilent = false) => {
    if (!isSilent) setSyncing(true)
    try {
      const res = await apiClient.get('/api/v1/trips/live-map')
      const payload = res.data?.data
      if (payload) {
        setLiveData({
          liveTripsCount: payload.liveTripsCount || 0,
          standbyBusesCount: payload.standbyBusesCount || 0,
          activeBusesCount: payload.activeBusesCount || 0,
          buses: Array.isArray(payload.buses) ? payload.buses : [],
          routes: Array.isArray(payload.routes) ? payload.routes : [],
        })
        setLastSyncedAt(new Date())
      }
    } catch (err) {
      console.error('Failed to load live bus map feed:', err)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [])

  // Initial fetch + 3-second real-time polling
  useEffect(() => {
    fetchLiveMapData(false)
  }, [fetchLiveMapData])

  useEffect(() => {
    if (!autoRefresh || simulationActive) return
    const timer = setInterval(() => {
      fetchLiveMapData(true)
    }, 3000)
    return () => clearInterval(timer)
  }, [autoRefresh, simulationActive, fetchLiveMapData])

  // Simulation engine using real DB routes (with valid coordinates) or fallback sample campus routes
  useEffect(() => {
    if (!simulationActive) {
      setSimBuses([])
      return
    }

    const currentLive = liveDataRef.current
    const dbRoutesWithCoords = (currentLive.routes || []).filter(
      (r) => r.startCoordinates?.lat != null && r.endCoordinates?.lat != null
    )
    const routesToSimulate =
      dbRoutesWithCoords.length > 0 ? dbRoutesWithCoords.slice(0, 3) : SAMPLE_SIM_ROUTES

    const realFleetPool = currentLive.buses || []

    const seedEntries = routesToSimulate.map((route, idx) => {
      const baseBus = realFleetPool[idx]?.bus
      const nodes = buildRouteNodes(route)
      const startPt = nodes[0] || { lat: 23.8769, lng: 90.3202 }

      return {
        id: `sim-bus-${idx + 1}`,
        tripId: `sim-trip-${idx + 1}`,
        tripStatus: 'on_trip',
        isMoving: true,
        startTime: new Date(Date.now() - (idx + 1) * 420000).toISOString(),
        distanceTraveledKm: 0,
        progress: (idx * 0.27) % 0.85,
        direction: 1,
        speedBase: 32 + idx * 6,
        waypoints: nodes,
        currentLocation: {
          latitude: startPt.lat,
          longitude: startPt.lng,
          heading: 0,
          speed: 34,
          updatedAt: new Date().toISOString(),
        },
        locationHistory: [
          {
            latitude: startPt.lat,
            longitude: startPt.lng,
            speed: 34,
            heading: 0,
            timestamp: new Date().toISOString(),
          },
        ],
        bus: baseBus || {
          _id: `sim-bus-${idx + 1}`,
          busNumber: `SIM-10${idx + 1}`,
          name: `Campus Express ${idx + 1}`,
          licensePlate: `DHAKA-METRO-B-${1120 + idx}`,
          capacity: 48,
          status: 'active',
          tripStatus: 'on_trip',
        },
        route,
        driverName: realFleetPool[idx]?.driverName || `Demo Driver ${idx + 1}`,
      }
    })

    simTickRef.current = 0
    setSimBuses(seedEntries)
    setSelectedBusId('all')

    const interval = setInterval(() => {
      simTickRef.current += 1
      setSimBuses((prev) =>
        prev.map((entry, idx) => {
          let nextProgress = entry.progress + entry.direction * 0.032
          let nextDirection = entry.direction
          if (nextProgress >= 0.98) {
            nextProgress = 0.98
            nextDirection = -1
          } else if (nextProgress <= 0.02) {
            nextProgress = 0.02
            nextDirection = 1
          }

          const effectiveWaypoints =
            nextDirection === 1 ? entry.waypoints : [...entry.waypoints].reverse()
          const directedProgress = nextDirection === 1 ? nextProgress : 1 - nextProgress
          const pt = interpolatePathPoint(effectiveWaypoints, directedProgress)
          if (!pt) return entry

          const stepDist = calculateDistanceKm(
            entry.currentLocation.latitude,
            entry.currentLocation.longitude,
            pt.lat,
            pt.lng
          )
          const jitterSpeed = Math.max(
            18,
            Math.round(entry.speedBase + Math.sin(simTickRef.current * 0.6 + idx) * 7)
          )
          const nowIso = new Date().toISOString()

          const nextHistory = [
            ...entry.locationHistory.slice(-45),
            {
              latitude: pt.lat,
              longitude: pt.lng,
              speed: jitterSpeed,
              heading: pt.heading,
              timestamp: nowIso,
            },
          ]

          return {
            ...entry,
            progress: nextProgress,
            direction: nextDirection,
            distanceTraveledKm: Math.round((entry.distanceTraveledKm + stepDist) * 100) / 100,
            currentLocation: {
              latitude: pt.lat,
              longitude: pt.lng,
              heading: pt.heading,
              speed: jitterSpeed,
              updatedAt: nowIso,
            },
            locationHistory: nextHistory,
          }
        })
      )
      setLastSyncedAt(new Date())
    }, 1400)

    return () => clearInterval(interval)
  }, [simulationActive])

  // Active dataset (simulation preview or real DB feed)
  const sourceBuses = simulationActive ? simBuses : liveData.buses

  // Filtered buses by status & search
  const filteredBuses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return sourceBuses.filter((item) => {
      if (statusFilter === 'on_trip' && item.tripStatus !== 'on_trip') return false
      if (statusFilter === 'idle' && item.tripStatus !== 'idle') return false
      if (!q) return true

      return (
        item.bus?.busNumber?.toLowerCase().includes(q) ||
        item.bus?.name?.toLowerCase().includes(q) ||
        item.bus?.licensePlate?.toLowerCase().includes(q) ||
        item.route?.routeName?.toLowerCase().includes(q) ||
        item.route?.startPoint?.toLowerCase().includes(q) ||
        item.route?.endPoint?.toLowerCase().includes(q) ||
        item.route?.stops?.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [sourceBuses, statusFilter, searchQuery])

  // Derive focused bus cleanly from latest sourceBuses (no stale object reference!)
  const focusedBus = useMemo(() => {
    if (selectedBusId === 'all') return null
    return (
      filteredBuses.find((b) => b.id === selectedBusId) ||
      sourceBuses.find((b) => b.id === selectedBusId) ||
      null
    )
  }, [selectedBusId, filteredBuses, sourceBuses])

  // Reset to 'all' if focused bus disappeared (e.g. filtered out)
  useEffect(() => {
    if (selectedBusId !== 'all' && !focusedBus && !loading) {
      setSelectedBusId('all')
    }
  }, [selectedBusId, focusedBus, loading])

  const liveTripsCount = sourceBuses.filter((b) => b.tripStatus === 'on_trip').length
  const movingCount = sourceBuses.filter(
    (b) => b.tripStatus === 'on_trip' && (b.isMoving || (b.currentLocation?.speed || 0) > 1)
  ).length
  const standbyCount = sourceBuses.filter((b) => b.tripStatus === 'idle').length

  const routeProgress = useMemo(() => {
    if (!focusedBus || !focusedBus.route) return null
    return findNearestRouteStop(focusedBus.currentLocation, focusedBus.route)
  }, [focusedBus])

  const mapHeight = compact ? '430px' : '520px'

  return (
    <div className="space-y-5">
      {/* Top Status & Control Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${
                simulationActive
                  ? 'bg-amber-500'
                  : liveTripsCount > 0
                  ? 'bg-emerald-600'
                  : 'bg-blue-600'
              }`}
            >
              <Radio className={`h-5 w-5 ${liveTripsCount > 0 || simulationActive ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-950">
                  {title}
                </h2>
                {simulationActive ? (
                  <Badge variant="softAmber" className="text-[11px] font-bold">
                    <Sparkles className="h-3 w-3" /> Demo Movement Simulation
                  </Badge>
                ) : liveTripsCount > 0 ? (
                  <Badge variant="softGreen" className="text-[11px] font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    {liveTripsCount} Live In Transit
                  </Badge>
                ) : (
                  <Badge variant="softBlue" className="text-[11px] font-bold">
                    {standbyCount} Active Fleet Ready
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {!simulationActive && (
              <>
                <Button
                  type="button"
                  variant={autoRefresh ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoRefresh((v) => !v)}
                  className={`h-9 text-xs font-bold ${
                    autoRefresh ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                  }`}
                >
                  {autoRefresh ? (
                    <>
                      <Pause className="h-3.5 w-3.5 mr-1.5" /> Live Auto-Sync (3s)
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1.5" /> Resume Auto-Sync
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLiveMapData(false)}
                  disabled={syncing}
                  className="h-9 text-xs font-bold"
                >
                  <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </>
            )}

            <Button
              type="button"
              variant={simulationActive ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setSimulationActive((v) => !v)}
              className="h-9 text-xs font-bold"
            >
              {simulationActive ? (
                <>
                  <Square className="h-3.5 w-3.5 mr-1.5 fill-current" /> Exit Simulation
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 mr-1.5 text-blue-600 fill-current" /> Preview Bus Movement
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Metrics & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Active ({sourceBuses.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('on_trip')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === 'on_trip'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              On Trip / Moving ({liveTripsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('idle')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === 'idle'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Standby ({standbyCount})
            </button>

            {lastSyncedAt && (
              <span className="text-[11px] font-medium text-slate-400 ml-1">
                Last sync: <strong className="text-slate-600">{formatRelativeTime(lastSyncedAt)}</strong>
              </span>
            )}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search bus #, route, or stop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs bg-slate-50/70"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Interactive Map + Active Bus List & Live Telemetry */}
      {loading ? (
        <Card className="p-16 text-center text-slate-500 border-slate-200 bg-white">
          <RotateCw className="h-7 w-7 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm font-semibold">Connecting to active campus buses GPS feed...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Interactive Map Canvas */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
              <CardHeader className="py-3 px-4 sm:px-5 border-b border-slate-100 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 truncate">
                  <Navigation className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate">
                    {focusedBus
                      ? `Tracking #${focusedBus.bus?.busNumber} — ${focusedBus.bus?.name}`
                      : `Showing ${filteredBuses.length} Active Campus Bus${filteredBuses.length === 1 ? '' : 'es'}`}
                  </span>
                </CardTitle>

                <div className="flex items-center gap-2 shrink-0">
                  {focusedBus && (
                    <button
                      type="button"
                      onClick={() => setSelectedBusId('all')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Show All Buses
                    </button>
                  )}
                  <Badge variant={movingCount > 0 ? 'softGreen' : 'secondary'} className="text-[11px]">
                    {movingCount > 0 ? `${movingCount} Moving` : `${filteredBuses.length} On Map`}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-3">
                <ActiveBusesMap
                  buses={filteredBuses}
                  selectedBusId={selectedBusId}
                  onSelectBus={(busId) => setSelectedBusId(busId)}
                  height={mapHeight}
                />

                {filteredBuses.length === 0 && (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center text-xs text-slate-600">
                    No active buses match your current filter. Switch to{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('all')
                        setSearchQuery('')
                      }}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      All Active
                    </button>{' '}
                    or click{' '}
                    <button
                      type="button"
                      onClick={() => setSimulationActive(true)}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Preview Bus Movement
                    </button>{' '}
                    to watch live animated shuttle routes.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: Active Buses List & Focused Telemetry */}
          <div className="lg:col-span-4 space-y-4">
            {/* Active Buses Selector Card */}
            <Card className="border-slate-200/90 shadow-sm bg-white">
              <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bus className="h-4 w-4 text-blue-600" />
                  Active Buses ({filteredBuses.length})
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setSelectedBusId('all')}
                  className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                    selectedBusId === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Overview
                </button>
              </CardHeader>

              <CardContent className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
                {filteredBuses.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No buses currently matching filter.
                  </div>
                ) : (
                  filteredBuses.map((item) => {
                    const isSelected = selectedBusId === item.id
                    const isOnTrip = item.tripStatus === 'on_trip'
                    const speed = Math.round(Number(item.currentLocation?.speed) || 0)
                    const dir = getCompassDirection(item.currentLocation?.heading || 0)

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedBusId(item.id)}
                        className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/20'
                            : 'border-slate-200/80 bg-white hover:border-blue-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-extrabold ${
                                isOnTrip
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              #{item.bus?.busNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {item.bus?.name}
                            </span>
                          </div>

                          <Badge
                            variant={isOnTrip ? 'softGreen' : 'secondary'}
                            className="text-[10px] px-2 py-0.5 shrink-0"
                          >
                            {isOnTrip ? (speed > 1 ? `${speed} km/h` : 'Live') : 'Standby'}
                          </Badge>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-600">
                          <span className="truncate font-medium">
                            {item.route
                              ? `${item.route.routeName}`
                              : 'Route not assigned'}
                          </span>
                          <span className="shrink-0 text-[10px] text-slate-400 font-medium">
                            {isOnTrip ? `${dir} • ${formatRelativeTime(item.currentLocation?.updatedAt)}` : 'Idle'}
                          </span>
                        </div>
                      </button>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Focused Bus Live Movement Telemetry */}
            {focusedBus ? (
              <Card className="border-slate-200/90 shadow-sm bg-white">
                <CardHeader className="py-3 px-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-600" />
                      Live Movement Telemetry
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {focusedBus.bus?.licensePlate}
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-3.5 text-xs">
                  {/* Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-blue-600" /> Speed
                      </span>
                      <span className="mt-0.5 block text-base font-black text-blue-600">
                        {Math.round(Number(focusedBus.currentLocation?.speed) || 0)} km/h
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Compass className="h-3 w-3 text-emerald-600" /> Heading
                      </span>
                      <span className="mt-0.5 block text-base font-black text-slate-900">
                        {getCompassDirection(focusedBus.currentLocation?.heading || 0)}{' '}
                        <span className="text-xs font-semibold text-slate-500">
                          ({Math.round(focusedBus.currentLocation?.heading || 0)}°)
                        </span>
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <RouteIcon className="h-3 w-3 text-indigo-600" /> Traveled
                      </span>
                      <span className="mt-0.5 block text-sm font-bold text-slate-900">
                        {focusedBus.distanceTraveledKm || 0} km
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-600" />
                        {focusedBus.startTime ? 'Trip Duration' : 'Last Update'}
                      </span>
                      <span className="mt-0.5 block text-sm font-bold text-slate-900">
                        {focusedBus.startTime
                          ? formatDuration(focusedBus.startTime)
                          : formatRelativeTime(focusedBus.currentLocation?.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* GPS & Driver Info */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" /> Driver
                      </span>
                      <strong className="text-slate-900">
                        {focusedBus.driverName || 'Unassigned'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Coordinates</span>
                      <span className="font-mono text-[11px] font-semibold text-slate-700">
                        {Number(focusedBus.currentLocation?.latitude || 0).toFixed(5)},{' '}
                        {Number(focusedBus.currentLocation?.longitude || 0).toFixed(5)}
                      </span>
                    </div>
                  </div>

                  {/* Route Progress & Nearest Stop */}
                  {focusedBus.route && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Assigned Route
                        </span>
                        <span className="font-bold text-blue-800 block">
                          {focusedBus.route.routeName}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {focusedBus.route.startPoint} → {focusedBus.route.endPoint}
                        </span>
                      </div>

                      {routeProgress?.nearest && (
                        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-bold text-emerald-900">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                              Nearest Stop: {routeProgress.nearest.name}
                            </span>
                            <span>{routeProgress.nearest.distanceKm} km</span>
                          </div>
                          {routeProgress.distToDestKm != null && focusedBus.tripStatus === 'on_trip' && (
                            <div className="text-emerald-700">
                              Destination distance: <strong>{routeProgress.distToDestKm} km</strong>{' '}
                              (~{routeProgress.etaMinutes} min est.)
                            </div>
                          )}
                        </div>
                      )}

                      {focusedBus.route.stops?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {focusedBus.route.stops.map((s, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                routeProgress?.nearest?.name === s
                                  ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <MapPin className="h-2.5 w-2.5 text-blue-500" />
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200/90 shadow-sm bg-white">
                <CardContent className="p-4 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-blue-600" />
                    Fleet Overview Mode
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Click any bus marker directly on the interactive map or select a bus from the list above to follow its real-time movement, directional heading, speed, and nearest stop progress.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
