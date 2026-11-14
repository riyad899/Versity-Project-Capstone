import { useState, useEffect, useCallback } from 'react'
import apiClient from '../../Hooks/Axios'
import toast from 'react-hot-toast'
import {
  Users,
  Bus,
  Route,
  MapPin,
  ClipboardList,
  Plus,
} from 'lucide-react'
import { useAuth } from '../../Hooks/useAuth'
import DashboardShell from '@/Components/Dashboard/DashboardShell'
import { Button } from '@/Components/ui/button'

// Modular Tab Components
import ManagerUsersTab from './components/ManagerUsersTab'
import ManagerBusFleetTab from './components/ManagerBusFleetTab'
import ManagerDriverRouteAssignTab from './components/ManagerDriverRouteAssignTab'
import ManagerRouteStopAssociateTab from './components/ManagerRouteStopAssociateTab'

// Modular Modal Components
import BusModal from './components/BusModal'
import RouteModal from './components/RouteModal'
import AssignDriverModal from './components/AssignDriverModal'
import AssignRouteModal from './components/AssignRouteModal'

export default function ManagerDashboard() {
  const { user: currentAuthUser } = useAuth()
  // Sidebar tabs: 'users', 'bus-infos', 'driver-assign', 'route-stop-associate'
  const [activeTab, setActiveTab] = useState('users')

  // Data states
  const [users, setUsers] = useState([])
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)
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
    endPoint: '',
    stops: '',
    scheduleTimes: '',
    status: 'active',
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
    }
  }, [activeTab, fetchUsers, fetchBuses, fetchRoutes, fetchDrivers])

  // ---- Handlers ----
  const handleMakeDriver = async (userId) => {
    try {
      await apiClient.patch(`/api/v1/transportation-managers/users/${userId}/make-driver`)
      toast.success('User converted to Driver successfully!')
      fetchUsers()
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
      await apiClient.patch(`/api/v1/transportation-managers/buses/${busId}/assign-driver`, {
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
      await apiClient.patch(`/api/v1/transportation-managers/buses/${busId}/assign-route`, {
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
      endPoint: '',
      stops: '',
      scheduleTimes: '',
      status: 'active',
    })
  }

  const handleRouteSubmit = async (e) => {
    e.preventDefault()
    try {
      const stopsArr = routeForm.stops
        ? routeForm.stops.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      const schedArr = routeForm.scheduleTimes
        ? routeForm.scheduleTimes.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      const payload = {
        routeName: routeForm.routeName,
        startPoint: routeForm.startPoint,
        endPoint: routeForm.endPoint,
        stops: stopsArr,
        scheduleTimes: schedArr,
        status: routeForm.status,
      }

      if (editingRoute) {
        await apiClient.patch(`/api/v1/routes/${editingRoute._id || editingRoute.id}`, payload)
        toast.success('Route updated successfully!')
      } else {
        await apiClient.post('/api/v1/routes', payload)
        toast.success('Route created successfully!')
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
    setRouteForm({
      routeName: route.routeName,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      stops: route.stops?.join(', ') || '',
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

  return (
    <DashboardShell
      roleTitle="Manager Portal"
      roleSubtitle="Transportation Operations"
      roleBadge="Manager"
      roleBadgeVariant="softGreen"
      portalIcon={ClipboardList}
      navItems={[
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
      ]}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab)
        setSearch('')
      }}
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
        ) : null
      }
    >
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
    </DashboardShell>
  )
}
