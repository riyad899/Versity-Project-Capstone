import { useState, useEffect, useCallback } from 'react'
import apiClient from '../../Hooks/Axios'
import toast from 'react-hot-toast'
import {
  Users,
  ShieldCheck,
  LayoutDashboard,
  Navigation,
} from 'lucide-react'
import { useAuth } from '../../Hooks/useAuth'
import DashboardShell from '@/Components/Dashboard/DashboardShell'
import MsgModal from '@/Components/MsgModal'
import LiveFleetTracker from '@/Components/Map/LiveFleetTracker'

import AdminOverviewTab from './components/AdminOverviewTab'
import AdminUsersTab from './components/AdminUsersTab'
import AdminEditUserModal from './components/AdminEditUserModal'

const ROLE_OPTIONS = ['user', 'driver', 'transportation-manager', 'admin']
const ROLE_LABELS = {
  user: 'Passenger',
  driver: 'Driver',
  'transportation-manager': 'Transport Manager',
  admin: 'Admin',
}
const ROLE_BG = {
  user: 'bg-blue-600',
  driver: 'bg-amber-600',
  'transportation-manager': 'bg-emerald-600',
  admin: 'bg-rose-600',
}

export default function AdminDashboard() {
  const { user: currentAuthUser } = useAuth()
  const [activeTab, setActiveTab] = useState('users') // 'users' or 'overview'
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState({ role: '', search: '' })
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', role: '' })
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    user: null,
    isBanning: false,
    reason: '',
    loading: false,
  })

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/admin/stats')
      setStats(res.data?.data)
    } catch {
      // ignore
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const params = {}
      if (filter.role) params.role = filter.role
      if (filter.search) params.search = filter.search
      const res = await apiClient.get('/api/v1/admin/users', { params })
      setUsers(res.data?.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }, [filter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleChangeRole = async (userId, newRole) => {
    try {
      await apiClient.patch(`/api/v1/admin/users/${userId}/role`, { role: newRole })
      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`)
      fetchUsers()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role')
    }
  }

  const handleOpenStatusModal = (user) => {
    const isBanning = !user.banned
    setStatusModal({
      isOpen: true,
      user,
      isBanning,
      reason: isBanning ? (user.banReason || 'Violation of terms') : '',
      loading: false,
    })
  }

  const handleConfirmStatus = async () => {
    if (!statusModal.user) return
    setStatusModal((prev) => ({ ...prev, loading: true }))
    try {
      const user = statusModal.user
      const isBanning = statusModal.isBanning
      await apiClient.patch(`/api/v1/admin/users/${user._id || user.id}/ban`, {
        banned: isBanning,
        banReason: isBanning ? (statusModal.reason || 'Violation of terms') : '',
      })
      toast.success(
        isBanning
          ? `User "${user.name}" has been banned successfully`
          : `User "${user.name}" has been activated successfully`
      )
      setStatusModal({
        isOpen: false,
        user: null,
        isBanning: false,
        reason: '',
        loading: false,
      })
      fetchUsers()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status')
      setStatusModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete "${user.name}"? This cannot be undone.`)) {
      return
    }
    try {
      await apiClient.delete(`/api/v1/admin/users/${user._id || user.id}`)
      toast.success('User deleted successfully')
      fetchUsers()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const startEdit = (user) => {
    setEditingUser(user)
    setEditForm({ name: user.name, role: user.role })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingUser) return
    try {
      const uid = editingUser._id || editingUser.id
      await apiClient.patch(`/api/v1/admin/users/${uid}`, { name: editForm.name })
      if (editForm.role !== editingUser.role) {
        await apiClient.patch(`/api/v1/admin/users/${uid}/role`, { role: editForm.role })
      }
      toast.success('User details updated')
      setEditingUser(null)
      fetchUsers()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes')
    }
  }

  return (
    <DashboardShell
      roleTitle="Admin Portal"
      roleSubtitle="System Administration"
      roleBadge="Admin"
      roleBadgeVariant="softRed"
      portalIcon={ShieldCheck}
      navItems={[
        {
          id: 'users',
          label: 'User Accounts',
          icon: Users,
          badge: stats?.accounts?.totalUsers,
        },
        {
          id: 'overview',
          label: 'Overview & Stats',
          icon: LayoutDashboard,
        },
        {
          id: 'live-map',
          label: 'Live Fleet Map',
          icon: Navigation,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ======================= USERS TAB ======================= */}
      {activeTab === 'users' && (
        <AdminUsersTab
          users={users}
          stats={stats}
          loadingUsers={loadingUsers}
          filter={filter}
          setFilter={setFilter}
          roleOptions={ROLE_OPTIONS}
          roleLabels={ROLE_LABELS}
          roleBg={ROLE_BG}
          onChangeRole={handleChangeRole}
          onOpenStatusModal={handleOpenStatusModal}
          onStartEdit={startEdit}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {/* ======================= OVERVIEW TAB ======================= */}
      {activeTab === 'overview' && <AdminOverviewTab stats={stats} />}

      {/* ======================= LIVE MAP TAB ======================= */}
      {activeTab === 'live-map' && (
        <LiveFleetTracker
          title="System-Wide Live Fleet Tracking Map"
          subtitle="Real-time overview of all active buses, driver movement trails, and operational routes."
        />
      )}

      {/* Edit User Modal */}
      <AdminEditUserModal
        editingUser={editingUser}
        onClose={() => setEditingUser(null)}
        editForm={editForm}
        setEditForm={setEditForm}
        roleOptions={ROLE_OPTIONS}
        roleLabels={ROLE_LABELS}
        onSubmit={handleSaveEdit}
      />

      {/* Ban / Unban Modal */}
      <MsgModal
        isOpen={statusModal.isOpen}
        onClose={() =>
          !statusModal.loading &&
          setStatusModal((prev) => ({ ...prev, isOpen: false, user: null }))
        }
        title={
          statusModal.isBanning
            ? `Ban Account: ${statusModal.user?.name || ''}`
            : `Activate Account: ${statusModal.user?.name || ''}`
        }
        description={
          statusModal.isBanning
            ? 'Banning this user will immediately revoke their access across the portal. Please provide an explicit reason.'
            : 'Are you sure you want to restore access for this user?'
        }
        confirmText={
          statusModal.loading
            ? 'Processing...'
            : statusModal.isBanning
            ? 'Ban Account'
            : 'Activate Account'
        }
        confirmVariant={statusModal.isBanning ? 'danger' : 'primary'}
        onConfirm={handleConfirmStatus}
      >
        {statusModal.isBanning && (
          <div className="space-y-1.5 mt-2">
            <label className="text-xs font-semibold text-slate-700">Reason for Ban *</label>
            <input
              type="text"
              required
              placeholder="e.g., Code of conduct violation, unauthorized access"
              value={statusModal.reason}
              onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
        )}
      </MsgModal>
    </DashboardShell>
  )
}
