import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../Hooks/useAuth'
import apiClient from '../../Hooks/Axios'
import toast from 'react-hot-toast'
import { Bus, UserCheck, Search, Navigation, History } from 'lucide-react'
import DashboardShell from '@/Components/Dashboard/DashboardShell'
import { Input } from '@/Components/ui/input'
import DriverStats from './components/DriverStats'
import DriverBusCard from './components/DriverBusCard'
import DriverLiveTripTab from './components/DriverLiveTripTab'
import DriverTripHistoryTab from './components/DriverTripHistoryTab'

export default function DriverDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('live-trip') // 'live-trip', 'my-buses', 'bus-infos', 'trip-history'
  const [buses, setBuses] = useState([])
  const [activeTrip, setActiveTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchBusesAndTrip = useCallback(async () => {
    try {
      const [busRes, tripRes] = await Promise.allSettled([
        apiClient.get('/api/v1/buses'),
        apiClient.get('/api/v1/trips/active'),
      ])

      if (busRes.status === 'fulfilled') {
        setBuses(busRes.value.data?.data || [])
      }

      if (tripRes.status === 'fulfilled') {
        setActiveTrip(tripRes.value.data?.data || null)
      }
    } catch (err) {
      toast.error('Failed to load fleet information')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBusesAndTrip()
  }, [fetchBusesAndTrip])

  const driverId = user?._id || user?.id

  const myBuses = buses.filter((b) => {
    const assignedId = b.assignedDriver?._id || b.assignedDriver?.id || b.assignedDriver
    return assignedId === driverId
  })

  const myPrimaryBus = myBuses[0] || null

  const filteredBuses = (activeTab === 'my-buses' ? myBuses : buses).filter((bus) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      bus.busNumber?.toLowerCase().includes(q) ||
      bus.name?.toLowerCase().includes(q) ||
      bus.licensePlate?.toLowerCase().includes(q) ||
      bus.assignedRoute?.routeName?.toLowerCase().includes(q) ||
      bus.assignedRoute?.startPoint?.toLowerCase().includes(q) ||
      bus.assignedRoute?.endPoint?.toLowerCase().includes(q)
    )
  })

  const activeBusesCount = buses.filter((b) => b.status === 'active').length

  return (
    <DashboardShell
      roleTitle="Driver Portal"
      roleSubtitle="Fleet & Route Operations"
      roleBadge="Driver"
      roleBadgeVariant="softAmber"
      portalIcon={Bus}
      navItems={[
        {
          id: 'live-trip',
          label: 'Live Trip & GPS',
          icon: Navigation,
          badge: activeTrip ? 'LIVE' : undefined,
        },
        {
          id: 'my-buses',
          label: 'My Assigned Buses',
          icon: UserCheck,
          badge: myBuses.length,
        },
        {
          id: 'bus-infos',
          label: 'Campus Bus Fleet',
          icon: Bus,
          badge: buses.length,
        },
        {
          id: 'trip-history',
          label: 'Trip History',
          icon: History,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="space-y-6">
        {/* Title Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {activeTab === 'live-trip'
              ? 'Live Trip Operations & GPS Broadcasting'
              : activeTab === 'my-buses'
              ? 'My Assigned Campus Buses'
              : activeTab === 'trip-history'
              ? 'Completed Trip History'
              : 'Campus Fleet Information'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === 'live-trip'
              ? 'Start and stop your assigned trips, broadcast real-time bus GPS coordinates, and monitor route stops.'
              : activeTab === 'my-buses'
              ? 'Buses and schedules specifically assigned to you by campus transit management.'
              : activeTab === 'trip-history'
              ? 'Log of all started and completed trips on campus routes.'
              : 'View-only fleet catalogue, assigned drivers, and scheduled route pathways.'}
          </p>
        </div>

        {/* Quick Stats Component */}
        <DriverStats
          myBusesCount={myBuses.length}
          totalBusesCount={buses.length}
          activeBusesCount={activeBusesCount}
        />

        {/* TAB 1: LIVE TRIP & GPS */}
        {activeTab === 'live-trip' && (
          <DriverLiveTripTab
            myBus={myPrimaryBus}
            driverUser={user}
            onTripStateChange={fetchBusesAndTrip}
          />
        )}

        {/* TAB 2 & 3: BUSES LIST (MY BUSES / ALL FLEET) */}
        {(activeTab === 'my-buses' || activeTab === 'bus-infos') && (
          <div className="space-y-5">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by bus number, model, or route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="mt-3 text-sm font-medium">Loading bus fleet information...</p>
              </div>
            ) : filteredBuses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3">
                  <Bus className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeTab === 'my-buses'
                    ? 'No buses currently assigned to you'
                    : 'No campus buses found'}
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm">
                  {activeTab === 'my-buses'
                    ? 'Your transportation manager has not assigned any bus to your driver account yet.'
                    : 'Try adjusting your search query.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBuses.map((bus) => (
                  <DriverBusCard
                    key={bus._id || bus.id}
                    bus={bus}
                    isAssignedToMe={
                      (bus.assignedDriver?._id || bus.assignedDriver?.id || bus.assignedDriver) ===
                      driverId
                    }
                    onStartTripClick={() => setActiveTab('live-trip')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TRIP HISTORY */}
        {activeTab === 'trip-history' && <DriverTripHistoryTab />}
      </div>
    </DashboardShell>
  )
}
