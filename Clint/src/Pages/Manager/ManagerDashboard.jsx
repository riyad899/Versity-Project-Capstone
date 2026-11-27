import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import apiClient from '../../Hooks/Axios'
import toast from 'react-hot-toast'
import {
  Users,
  Bus,
  Route,
  MapPin,
  ClipboardList,
  CalendarClock,
  Plus,
  Navigation,
  Radio,
} from 'lucide-react'
import { useAuth } from '../../Hooks/useAuth'
import DashboardShell from '@/Components/Dashboard/DashboardShell'
import { Button } from '@/Components/ui/button'
import LiveFleetTracker from '@/Components/Map/LiveFleetTracker'

// Modular Tab Components
import ManagerRealtimeMonitorTab from './components/ManagerRealtimeMonitorTab'
import ManagerUsersTab from './components/ManagerUsersTab'
import ManagerBusFleetTab from './components/ManagerBusFleetTab'
import ManagerDriverRouteAssignTab from './components/ManagerDriverRouteAssignTab'
import ManagerRouteStopAssociateTab from './components/ManagerRouteStopAssociateTab'
import ManagerScheduleTab from './components/ManagerScheduleTab'

// Modular Modal Components
import BusModal from './components/BusModal'
import RouteModal from './components/RouteModal'
import AssignDriverModal from './components/AssignDriverModal'
import AssignRouteModal from './components/AssignRouteModal'
import ScheduleModal from './components/ScheduleModal'

const VALID_TABS = ['realtime-monitor', 'users', 'bus-infos', 'driver-assign', 'route-stop-associate', 'schedules', 'live-map']

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ManagerDashboard() {
  const { user: currentAuthUser } = useAuth()
  const { tab: urlTab } = useParams()
  const navigate = useNavigate()

  // Sidebar tabs: 'realtime-monitor', 'users', 'bus-infos', 'driver-assign', 'route-stop-associate', 'schedules', 'live-map'
  const [activeTab, setActiveTab] = useState(
    urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'realtime-monitor'
  )

  // Sync tab with URL parameter if present
  useEffect(() => {
    if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [urlTab])

  // Data states
  const [users, setUsers] = useState([])
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [drivers, setDrivers] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [search, setSearch] = useState('')

  // Bus Modal states
  const [showBusModal, setShowBusModal] = useState(false)
  const [editingBus, setEditingBus] = useState(null)
  const [busForm, setBusForm] = useState({
    busNumber: '',
    name: '',
    licensePlate: '',
    capacity: '',
    status: 'active',
  })

  // Assignment Modal states
  const [assignDriverModal, setAssignDriverModal] = useState(null)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [assignRouteModal, setAssignRouteModal] = useState(null)
  const [selectedRouteId, setSelectedRouteId] = useState('')

  // Route Modal states
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [routeForm, setRouteForm] = useState({
    routeName: '',
    startPoint: '',
    startCoordinates: null,
    endPoint: '',
    endCoordinates: null,
    stops: '',
    stopCoordinates: [],
    scheduleTimes: '',
    status: 'active',
  })

  // Schedule Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [submittingSchedule, setSubmittingSchedule] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [scheduleForm, setScheduleForm] = useState({
    bus: '',
    route: '',
    driver: '',
    departureTime: '',
    arrivalTime: '',
    operatingDays: DEFAULT_DAYS,
    status: 'active',
    remarks: '',
  })

  // ---- Fetch functions ----
  const fetchUsers = useCallback(async () => {
    try {
      const params = search ? { search } : {}
      const res = await apiClient.get('/api/v1/transportation-managers/users', { params })
      setUsers(res.data?.data || [])
    } catch {
      // ignore
    }
  }, [search])

  const fetchBuses = useCallback(async () => {
    try {
      const params = search ? { search } : {}
      const res = await apiClient.get('/api/v1/buses', { params })
      setBuses(res.data?.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load buses')
    }
  }, [search])

  const fetchRoutes = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/routes')
      setRoutes(res.data?.data || [])
    } catch {
      // ignore
    }
  }, [])

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/transportation-managers/drivers')
      setDrivers(res.data?.data || [])
    } catch {
      // ignore
    }
  }, [])

  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true)
    try {
      const params = search ? { search } : {}
      const res = await apiClient.get('/api/v1/schedules', { params })
      setSchedules(res.data?.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bus schedules')
    } finally {
      setLoadingSchedules(false)
    }
  }, [search])

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'bus-infos') {
      fetchBuses()
    } else if (activeTab === 'driver-assign') {
      fetchBuses()
      fetchRoutes()
      fetchDrivers()
    } else if (activeTab === 'route-stop-associate') {
      fetchRoutes()
    } else if (activeTab === 'schedules') {
      fetchSchedules()
      fetchBuses()
      fetchRoutes()
      fetchDrivers()
    }
  }, [activeTab, fetchUsers, fetchBuses, fetchRoutes, fetchDrivers, fetchSchedules])

  // ---- Handlers ----
  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    setSearch('')
    navigate(`/manager/${newTab}`)
  }

  const handleMakeDriver = async (userOrId) => {
    const userId =
      typeof userOrId === 'object' && userOrId !== null
        ? userOrId._id || userOrId.id
        : userOrId

    if (!userId) {
      toast.error('Invalid user selected')
      return
    }

    try {
      await apiClient.patch(`/api/v1/transportation-managers/users/${userId}/make-driver`)
      toast.success('User promoted to Driver successfully!')
      fetchUsers()
      fetchDrivers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to convert user')
    }
  }

  const resetBusForm = () => {
    setEditingBus(null)
    setBusForm({
      busNumber: '',
      name: '',
      licensePlate: '',
      capacity: '',
      status: 'active',
    })
  }

  const startEditBus = (bus) => {
    setEditingBus(bus)
    setBusForm({
      busNumber: bus.busNumber,
      name: bus.name,
      licensePlate: bus.licensePlate || '',
      capacity: bus.capacity,
      status: bus.status,
    })
    setShowBusModal(true)
  }

  const handleBusSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        busNumber: busForm.busNumber,
        name: busForm.name,
        licensePlate: busForm.licensePlate,
        capacity: Number(busForm.capacity),
        status: busForm.status,
      }

      if (editingBus) {
        await apiClient.patch(`/api/v1/buses/${editingBus._id || editingBus.id}`, payload)
        toast.success('Bus details updated successfully!')
      } else {
        await apiClient.post('/api/v1/buses', payload)
        toast.success('New bus registered successfully!')
      }

      setShowBusModal(false)
      resetBusForm()
      fetchBuses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bus details')
    }
  }

  const handleDeleteBus = async (bus) => {
    if (!window.confirm(`Are you sure you want to delete bus "${bus.name}" (${bus.busNumber})?`)) {
      return
    }
    try {
      await apiClient.delete(`/api/v1/buses/${bus._id || bus.id}`)
      toast.success('Bus deleted successfully!')
      fetchBuses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete bus')
    }
  }

  const handleAssignDriver = async (e) => {
    e.preventDefault()
    if (!assignDriverModal) return
    try {
      const busId = assignDriverModal._id || assignDriverModal.id
      await apiClient.patch(`/api/v1/buses/${busId}/assign-driver`, {
        driverId: selectedDriverId || null,
      })
      toast.success('Driver assignment updated!')
      setAssignDriverModal(null)
      fetchBuses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign driver')
    }
  }

  const handleAssignRoute = async (e) => {
    e.preventDefault()
    if (!assignRouteModal) return
    try {
      const busId = assignRouteModal._id || assignRouteModal.id
      await apiClient.patch(`/api/v1/buses/${busId}/assign-route`, {
        routeId: selectedRouteId || null,
      })
      toast.success('Route assignment updated!')
      setAssignRouteModal(null)
      fetchBuses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign route')
    }
  }

  const resetRouteForm = () => {
    setEditingRoute(null)
    setRouteForm({
      routeName: '',
      startPoint: '',
      startCoordinates: null,
      endPoint: '',
      endCoordinates: null,
      stops: '',
      stopCoordinates: [],
      scheduleTimes: '',
      status: 'active',
    })
  }

  const handleRouteSubmit = async (e) => {
    e.preventDefault()
    try {
      const stopCoords = Array.isArray(routeForm.stopCoordinates)
        ? routeForm.stopCoordinates.filter((s) => s.name?.trim())
        : []

      const stopsArr =
        stopCoords.length > 0
          ? stopCoords.map((s) => s.name.trim())
          : routeForm.stops
          ? routeForm.stops.split(',').map((s) => s.trim()).filter(Boolean)
          : []

      const schedArr = routeForm.scheduleTimes
        ? routeForm.scheduleTimes.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      const payload = {
        routeName: routeForm.routeName,
        startPoint: routeForm.startPoint,
        startCoordinates: routeForm.startCoordinates || null,
        endPoint: routeForm.endPoint,
        endCoordinates: routeForm.endCoordinates || null,
        stops: stopsArr,
        stopCoordinates: stopCoords,
        scheduleTimes: schedArr,
        status: routeForm.status,
      }

      if (editingRoute) {
        await apiClient.patch(`/api/v1/routes/${editingRoute._id || editingRoute.id}`, payload)
        toast.success('Route & map coordinates updated successfully!')
      } else {
        await apiClient.post('/api/v1/routes', payload)
        toast.success('Route & map coordinates created successfully!')
      }

      setShowRouteModal(false)
      resetRouteForm()
      fetchRoutes()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save route')
    }
  }

  const startEditRoute = (route) => {
    setEditingRoute(route)

    // Build stopCoordinates from saved stopCoordinates or fallback to stops array
    let existingStopCoords = Array.isArray(route.stopCoordinates) ? route.stopCoordinates : []
    if (existingStopCoords.length === 0 && Array.isArray(route.stops) && route.stops.length > 0) {
      const baseLat = route.startCoordinates?.lat || 23.8103
      const baseLng = route.startCoordinates?.lng || 90.4125
      existingStopCoords = route.stops.map((name, idx) => ({
        name,
        lat: Number((baseLat + 0.002 * (idx + 1)).toFixed(6)),
        lng: Number((baseLng + 0.002 * (idx + 1)).toFixed(6)),
      }))
    }

    setRouteForm({
      routeName: route.routeName,
      startPoint: route.startPoint,
      startCoordinates: route.startCoordinates?.lat != null ? route.startCoordinates : null,
      endPoint: route.endPoint,
      endCoordinates: route.endCoordinates?.lat != null ? route.endCoordinates : null,
      stops: route.stops?.join(', ') || '',
      stopCoordinates: existingStopCoords,
      scheduleTimes: route.scheduleTimes?.join(', ') || '',
      status: route.status,
    })
    setShowRouteModal(true)
  }

  const handleDeleteRoute = async (route) => {
    if (!window.confirm(`Are you sure you want to delete route "${route.routeName}"?`)) {
      return
    }
    try {
      await apiClient.delete(`/api/v1/routes/${route._id || route.id}`)
      toast.success('Route deleted successfully!')
      fetchRoutes()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete route')
    }
  }

  // ---- Schedule Handlers ----
  const resetScheduleForm = () => {
    setEditingSchedule(null)
    setScheduleForm({
      bus: buses[0]?._id || buses[0]?.id || '',
      route: buses[0]?.assignedRoute?._id || buses[0]?.assignedRoute?.id || routes[0]?._id || routes[0]?.id || '',
      driver: buses[0]?.assignedDriver?._id || buses[0]?.assignedDriver?.id || '',
      departureTime: '',
      arrivalTime: '',
      operatingDays: [...DEFAULT_DAYS],
      status: 'active',
      remarks: '',
    })
  }

  const startEditSchedule = (schedule) => {
    setEditingSchedule(schedule)
    setScheduleForm({
      bus: schedule.bus?._id || schedule.bus?.id || schedule.bus || '',
      route: schedule.route?._id || schedule.route?.id || schedule.route || '',
      driver: schedule.driver?._id || schedule.driver?.id || schedule.driver || '',
      departureTime: schedule.departureTime || '',
      arrivalTime: schedule.arrivalTime || '',
      operatingDays: schedule.operatingDays || [...DEFAULT_DAYS],
      status: schedule.status || 'active',
      remarks: schedule.remarks || '',
    })
    setShowScheduleModal(true)
  }

  const handleScheduleSubmit = async (e) => {
    e.preventDefault()
    if (submittingSchedule) return
    setSubmittingSchedule(true)
    try {
      const payload = {
        bus: scheduleForm.bus,
        route: scheduleForm.route,
        driver: scheduleForm.driver || null,
        departureTime: scheduleForm.departureTime?.trim(),
        arrivalTime: scheduleForm.arrivalTime?.trim(),
        operatingDays: scheduleForm.operatingDays,
        status: scheduleForm.status,
        remarks: scheduleForm.remarks || '',
      }

      if (editingSchedule) {
        await apiClient.patch(`/api/v1/schedules/${editingSchedule._id || editingSchedule.id}`, payload)
        toast.success('Bus schedule updated successfully!')
      } else {
        await apiClient.post('/api/v1/schedules', payload)
        toast.success('New bus schedule created successfully!')
      }

      setShowScheduleModal(false)
      resetScheduleForm()
      fetchSchedules()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bus schedule')
    } finally {
      setSubmittingSchedule(false)
    }
  }

  const handleDeleteSchedule = async (schedule) => {
    const desc = `${schedule.bus?.busNumber || 'Bus'} (${schedule.departureTime} → ${schedule.arrivalTime})`
    if (!window.confirm(`Are you sure you want to delete the schedule for ${desc}?`)) {
      return
    }
    try {
      await apiClient.delete(`/api/v1/schedules/${schedule._id || schedule.id}`)
      toast.success('Bus schedule removed successfully!')
      fetchSchedules()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete bus schedule')
    }
  }

  return (
    <DashboardShell
      roleTitle="Manager Portal"
      roleSubtitle="Transportation Operations"
      roleBadge="Manager"
      roleBadgeVariant="softGreen"
      portalIcon={ClipboardList}
      navItems={[
        {
          id: 'realtime-monitor',
          label: 'Real-Time Monitor',
          icon: Radio,
          badge:
            buses.filter((b) => (b.delayMinutes || 0) > 0).length > 0
              ? `${buses.filter((b) => (b.delayMinutes || 0) > 0).length} DELAY`
              : buses.filter((b) => b.tripStatus === 'on_trip').length > 0
              ? `${buses.filter((b) => b.tripStatus === 'on_trip').length} LIVE`
              : undefined,
          badgeVariant:
            buses.filter((b) => (b.delayMinutes || 0) > 0).length > 0 ? 'softRed' : 'softGreen',
        },
        {
          id: 'users',
          label: 'User Accounts',
          icon: Users,
          badge: users.length,
        },
        {
          id: 'bus-infos',
          label: 'Bus Fleet',
          icon: Bus,
          badge: buses.length,
        },
        {
          id: 'driver-assign',
          label: 'Driver & Route Assign',
          icon: Route,
        },
        {
          id: 'route-stop-associate',
          label: 'Route Stop Associate',
          icon: MapPin,
        },
        {
          id: 'schedules',
          label: 'Bus Schedules',
          icon: CalendarClock,
          badge: schedules.length,
        },
        {
          id: 'live-map',
          label: 'Live Fleet Map',
          icon: Navigation,
        },
      ]}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      headerActions={
        activeTab === 'bus-infos' ? (
          <Button
            type="button"
            onClick={() => {
              resetBusForm()
              setShowBusModal(true)
            }}
            className="h-9 px-3.5 text-xs sm:h-10 sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Campus Bus
          </Button>
        ) : activeTab === 'driver-assign' ? (
          <Button
            type="button"
            onClick={() => {
              resetRouteForm()
              setShowRouteModal(true)
            }}
            className="h-9 px-3.5 text-xs sm:h-10 sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create Route
          </Button>
        ) : activeTab === 'schedules' ? (
          <Button
            type="button"
            onClick={() => {
              resetScheduleForm()
              setShowScheduleModal(true)
            }}
            className="h-9 px-3.5 text-xs sm:h-10 sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create Bus Schedule
          </Button>
        ) : null
      }
    >
      {/* TAB 0: REAL-TIME MONITOR */}
      {activeTab === 'realtime-monitor' && (
        <ManagerRealtimeMonitorTab onTabSwitch={handleTabChange} />
      )}

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <ManagerUsersTab
          users={users}
          loading={loading}
          search={search}
          setSearch={setSearch}
          onMakeDriver={handleMakeDriver}
        />
      )}

      {/* TAB 2: BUS FLEET */}
      {activeTab === 'bus-infos' && (
        <ManagerBusFleetTab
          buses={buses}
          loading={loading}
          search={search}
          setSearch={setSearch}
          onEditBus={startEditBus}
          onDeleteBus={handleDeleteBus}
        />
      )}

      {/* TAB 3: DRIVER & ROUTE ASSIGN */}
      {activeTab === 'driver-assign' && (
        <ManagerDriverRouteAssignTab
          buses={buses}
          routes={routes}
          search={search}
          setSearch={setSearch}
          onOpenAssignDriver={(bus) => {
            setAssignDriverModal(bus)
            setSelectedDriverId(bus.assignedDriver?._id || bus.assignedDriver?.id || '')
          }}
          onOpenAssignRoute={(bus) => {
            setAssignRouteModal(bus)
            setSelectedRouteId(bus.assignedRoute?._id || bus.assignedRoute?.id || '')
          }}
          onEditRoute={startEditRoute}
          onDeleteRoute={handleDeleteRoute}
        />
      )}

      {/* TAB 4: ROUTE STOP ASSOCIATE */}
      {activeTab === 'route-stop-associate' && (
        <ManagerRouteStopAssociateTab
          routes={routes}
          onRefreshRoutes={fetchRoutes}
        />
      )}

      {/* TAB 5: BUS SCHEDULES */}
      {activeTab === 'schedules' && (
        <ManagerScheduleTab
          schedules={schedules}
          loading={loadingSchedules}
          search={search}
          setSearch={setSearch}
          onOpenCreateModal={() => {
            resetScheduleForm()
            setShowScheduleModal(true)
          }}
          onEditSchedule={startEditSchedule}
          onDeleteSchedule={handleDeleteSchedule}
        />
      )}

      {/* TAB 6: LIVE FLEET MAP */}
      {activeTab === 'live-map' && (
        <LiveFleetTracker
          title="Manager Live Fleet Location & Movement Monitor"
          subtitle="Track every active campus bus, real-time speed, heading, and route progress across your fleet."
        />
      )}

      {/* MODAL: ADD / EDIT BUS */}
      <BusModal
        isOpen={showBusModal}
        onClose={() => setShowBusModal(false)}
        editingBus={editingBus}
        busForm={busForm}
        setBusForm={setBusForm}
        onSubmit={handleBusSubmit}
      />

      {/* MODAL: ASSIGN DRIVER */}
      <AssignDriverModal
        isOpen={Boolean(assignDriverModal)}
        onClose={() => setAssignDriverModal(null)}
        bus={assignDriverModal}
        drivers={drivers}
        buses={buses}
        selectedDriverId={selectedDriverId}
        setSelectedDriverId={setSelectedDriverId}
        onSubmit={handleAssignDriver}
      />

      {/* MODAL: ASSIGN ROUTE */}
      <AssignRouteModal
        isOpen={Boolean(assignRouteModal)}
        onClose={() => setAssignRouteModal(null)}
        bus={assignRouteModal}
        routes={routes}
        selectedRouteId={selectedRouteId}
        setSelectedRouteId={setSelectedRouteId}
        onSubmit={handleAssignRoute}
      />

      {/* MODAL: CREATE / EDIT ROUTE */}
      <RouteModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        editingRoute={editingRoute}
        routeForm={routeForm}
        setRouteForm={setRouteForm}
        onSubmit={handleRouteSubmit}
      />

      {/* MODAL: CREATE / EDIT BUS SCHEDULE */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        editingSchedule={editingSchedule}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        buses={buses}
        routes={routes}
        drivers={drivers}
        submitting={submittingSchedule}
        onSubmit={handleScheduleSubmit}
      />
    </DashboardShell>
  )
}
