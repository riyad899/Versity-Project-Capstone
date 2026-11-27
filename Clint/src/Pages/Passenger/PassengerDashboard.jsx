import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../Hooks/useAuth'
import apiClient from '../../Hooks/Axios'
import toast from 'react-hot-toast'
import { Search, Bus, Route as RouteIcon, MapPin, RefreshCw, Navigation } from 'lucide-react'
import DashboardShell from '@/Components/Dashboard/DashboardShell'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import PassengerStats from './components/PassengerStats'
import PassengerBusesTab from './components/PassengerBusesTab'
import PassengerRoutesTab from './components/PassengerRoutesTab'
import PassengerStopsTab from './components/PassengerStopsTab'
import PassengerLiveTrackingTab from './components/PassengerLiveTrackingTab'

export default function PassengerDashboard() {
  const { user } = useAuth()
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stopFilter, setStopFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('routes') // 'routes', 'buses', 'stops', 'live-tracking'
  const [focusedBusId, setFocusedBusId] = useState('all')

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const [busRes, routeRes] = await Promise.all([
        apiClient.get('/api/v1/buses'),
        apiClient.get('/api/v1/routes'),
      ])
      setBuses(busRes.data?.data || [])
      setRoutes(routeRes.data?.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load transit data')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Extract all unique campus bus stop locations across all routes
  const allUniqueStops = useMemo(() => {
    const set = new Set()
    routes.forEach((r) => {
      if (r.startPoint) set.add(r.startPoint.trim())
      if (r.endPoint) set.add(r.endPoint.trim())
      if (Array.isArray(r.stops)) {
        r.stops.forEach((s) => s && set.add(s.trim()))
      }
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [routes])

  // Case-insensitive stop matching helper
  const cleanFilter = stopFilter ? stopFilter.toLowerCase().trim() : 'all'
  const isStopMatch = (target) => {
    if (cleanFilter === 'all') return true
    if (!target) return false
    return target.toLowerCase().trim() === cleanFilter
  }

  // Filter buses by search, status, and stop
  const filteredBuses = useMemo(() => {
    return buses.filter((bus) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        search === '' ||
        bus.busNumber?.toLowerCase().includes(q) ||
        bus.name?.toLowerCase().includes(q) ||
        bus.licensePlate?.toLowerCase().includes(q) ||
        bus.assignedRoute?.routeName?.toLowerCase().includes(q) ||
        bus.assignedRoute?.startPoint?.toLowerCase().includes(q) ||
        bus.assignedRoute?.endPoint?.toLowerCase().includes(q) ||
        (bus.assignedRoute?.stops &&
          bus.assignedRoute.stops.some((s) => s.toLowerCase().includes(q)))

      const matchesStatus = statusFilter === 'all' || bus.status === statusFilter

      const matchesStop =
        cleanFilter === 'all' ||
        isStopMatch(bus.assignedRoute?.startPoint) ||
        isStopMatch(bus.assignedRoute?.endPoint) ||
        (bus.assignedRoute?.stops &&
          bus.assignedRoute.stops.some((s) => isStopMatch(s)))

      return matchesSearch && matchesStatus && matchesStop
    })
  }, [buses, search, statusFilter, cleanFilter])

  // Filter routes by search and stop
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !search ||
        route.routeName?.toLowerCase().includes(q) ||
        route.startPoint?.toLowerCase().includes(q) ||
        route.endPoint?.toLowerCase().includes(q) ||
        (route.stops && route.stops.some((s) => s.toLowerCase().includes(q))) ||
        (route.scheduleTimes && route.scheduleTimes.some((t) => t.toLowerCase().includes(q)))

      const matchesStop =
        cleanFilter === 'all' ||
        isStopMatch(route.startPoint) ||
        isStopMatch(route.endPoint) ||
        (route.stops && route.stops.some((s) => isStopMatch(s)))

      return matchesSearch && matchesStop
    })
  }, [routes, search, cleanFilter])

  // Calculate filtered stops count for sidebar badge
  const filteredStopsCount = useMemo(() => {
    if (cleanFilter !== 'all') {
      const hasMatch = allUniqueStops.some((s) => s.toLowerCase().trim() === cleanFilter)
      return hasMatch ? 1 : 0
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      return allUniqueStops.filter((s) => s.toLowerCase().includes(q)).length
    }
    return allUniqueStops.length
  }, [allUniqueStops, cleanFilter, search])

  const activeBusesCount = useMemo(() => {
    return buses.filter((b) => b.status === 'active').length
  }, [buses])

  const liveTripsCount = useMemo(() => {
    return buses.filter((b) => b.tripStatus === 'on_trip').length
  }, [buses])

  return (
    <DashboardShell
      roleTitle="Passenger Portal"
      roleSubtitle="Live Campus Transit"
      roleBadge="Passenger"
      roleBadgeVariant="softBlue"
      portalIcon={Bus}
      navItems={[
        {
          id: 'routes',
          label: 'Available Routes',
          icon: RouteIcon,
          badge: filteredRoutes.length,
        },
        {
          id: 'buses',
          label: 'Assigned Buses',
          icon: Bus,
          badge: filteredBuses.length,
        },
        {
          id: 'stops',
          label: 'Bus Stops',
          icon: MapPin,
          badge: filteredStopsCount,
        },
        {
          id: 'live-tracking',
          label: 'Live Bus Map',
          icon: Navigation,
          badge: liveTripsCount > 0 ? `${liveTripsCount} LIVE` : undefined,
        },
      ]}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab)
        setSearch('')
        if (tab !== 'live-tracking') {
          setFocusedBusId('all')
        }
      }}
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Welcome, {user?.name || 'Passenger'}!
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab === 'live-tracking'
                ? 'Watch real-time campus shuttle locations and monitor live bus arrivals.'
                : 'View available campus routes, bus stop locations, assigned buses, and departure schedules.'}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="h-9 px-3 text-xs self-start sm:self-auto bg-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Transit Data
          </Button>
        </div>

        {/* Quick Stats Grid */}
        <PassengerStats
          activeBusesCount={activeBusesCount}
          totalRoutesCount={routes.length}
          totalBusesCount={buses.length}
          totalStopsCount={allUniqueStops.length}
        />

        {/* Search & Dynamic Filters Bar (Hidden on Live Tracking) */}
        {activeTab !== 'live-tracking' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Main Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder={
                  activeTab === 'routes'
                    ? 'Search routes by name, origin, terminus, stops, or departure times...'
                    : activeTab === 'buses'
                    ? 'Search buses by number, model name, route, or stop...'
                    : 'Search campus transit...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>

            {/* Filter by Campus Bus Stop */}
            <div className="flex items-center gap-2">
              <select
                className="h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                value={stopFilter}
                onChange={(e) => setStopFilter(e.target.value)}
              >
                <option value="all">📍 All Campus Stops ({allUniqueStops.length})</option>
                {allUniqueStops.map((stopName) => (
                  <option key={stopName} value={stopName}>
                    {stopName}
                  </option>
                ))}
              </select>

              {/* Filter by Bus Status (Only on Buses Tab) */}
              {activeTab === 'buses' && (
                <select
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active Only</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* Active Filter Pill */}
        {stopFilter !== 'all' && activeTab !== 'live-tracking' && (
          <div className="flex items-center gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg w-fit">
            <span>Filtering by bus stop: <strong>{stopFilter}</strong></span>
            <button
              type="button"
              onClick={() => setStopFilter('all')}
              className="text-blue-600 hover:text-blue-900 font-bold ml-1"
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* Content Tabs */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm font-medium">Loading live campus transit data...</p>
          </div>
        ) : activeTab === 'routes' ? (
          <PassengerRoutesTab routes={filteredRoutes} buses={buses} />
        ) : activeTab === 'buses' ? (
          <PassengerBusesTab
            buses={filteredBuses}
            onTrackLive={(bus) => {
              setFocusedBusId(bus._id || bus.id)
              setActiveTab('live-tracking')
            }}
          />
        ) : activeTab === 'stops' ? (
          <PassengerStopsTab
            routes={routes}
            buses={buses}
            search={search}
            stopFilter={stopFilter}
          />
        ) : (
          <PassengerLiveTrackingTab initialBusId={focusedBusId} />
        )}
      </div>
    </DashboardShell>
  )
}
