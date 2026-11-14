import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../Hooks/useAuth'
import apiClient from '../../Hooks/Axios'
import toast from 'react-hot-toast'
import { Search, Bus, Route } from 'lucide-react'
import DashboardShell from '@/Components/Dashboard/DashboardShell'
import { Input } from '@/Components/ui/input'
import PassengerStats from './components/PassengerStats'
import PassengerBusesTab from './components/PassengerBusesTab'
import PassengerRoutesTab from './components/PassengerRoutesTab'

export default function PassengerDashboard() {
  const { user } = useAuth()
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('buses') // 'buses' or 'routes'

  const fetchData = useCallback(async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredBuses = buses.filter((bus) => {
    const q = search.toLowerCase()
    const matchesSearch =
      search === '' ||
      bus.busNumber?.toLowerCase().includes(q) ||
      bus.name?.toLowerCase().includes(q) ||
      bus.assignedRoute?.routeName?.toLowerCase().includes(q) ||
      bus.assignedRoute?.startPoint?.toLowerCase().includes(q) ||
      bus.assignedRoute?.endPoint?.toLowerCase().includes(q)

    const matchesStatus = statusFilter === 'all' || bus.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredRoutes = routes.filter((route) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      route.routeName?.toLowerCase().includes(q) ||
      route.startPoint?.toLowerCase().includes(q) ||
      route.endPoint?.toLowerCase().includes(q) ||
      (route.stops && route.stops.some((s) => s.toLowerCase().includes(q)))
    )
  })

  const activeBusesCount = buses.filter((b) => b.status === 'active').length

  return (
    <DashboardShell
      roleTitle="Passenger Portal"
      roleSubtitle="Live Campus Travel"
      roleBadge="Passenger"
      roleBadgeVariant="softBlue"
      portalIcon={Bus}
      navItems={[
        {
          id: 'buses',
          label: 'Available Buses',
          icon: Bus,
          badge: filteredBuses.length,
        },
        {
          id: 'routes',
          label: 'Campus Routes',
          icon: Route,
          badge: filteredRoutes.length,
        },
      ]}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab)
        setSearch('')
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Welcome, {user?.name || 'Passenger'}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Explore live university shuttle buses, departure schedules, and campus stop locations.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <PassengerStats
          activeBusesCount={activeBusesCount}
          totalRoutesCount={routes.length}
          totalBusesCount={buses.length}
        />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={
                activeTab === 'buses'
                  ? 'Search buses by number, model name, or route...'
                  : 'Search campus routes by name or destination...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {activeTab === 'buses' && (
            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Operational Statuses</option>
              <option value="active">Active Only</option>
              <option value="maintenance">In Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm font-medium">Loading campus transit information...</p>
          </div>
        ) : activeTab === 'buses' ? (
          <PassengerBusesTab buses={filteredBuses} />
        ) : (
          <PassengerRoutesTab routes={filteredRoutes} />
        )}
      </div>
    </DashboardShell>
  )
}
