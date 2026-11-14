import {
  Users,
  Bus,
  ShieldCheck,
  Search,
  Pencil,
  Trash2,
  Ban,
  CheckCircle2,
  Route,
} from 'lucide-react'
import { Card } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'

export default function AdminUsersTab({
  users,
  stats,
  loadingUsers,
  filter,
  setFilter,
  roleOptions,
  roleLabels,
  roleBg,
  onChangeRole,
  onOpenStatusModal,
  onStartEdit,
  onDeleteUser,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          User Account Governance
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage system roles, assign permissions, oversee authentication, and manage suspensions.
        </p>
      </div>

      {/* Role Counts Pills / Cards */}
      {stats?.accounts && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card
            onClick={() => setFilter({ ...filter, role: 'user' })}
            className="cursor-pointer border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="p-4 flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-950">{stats.accounts.passengers}</div>
                <div className="text-xs font-semibold text-slate-500">Passengers</div>
              </div>
            </div>
          </Card>

          <Card
            onClick={() => setFilter({ ...filter, role: 'driver' })}
            className="cursor-pointer border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all"
          >
            <div className="p-4 flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-950">{stats.accounts.drivers}</div>
                <div className="text-xs font-semibold text-slate-500">Drivers</div>
              </div>
            </div>
          </Card>

          <Card
            onClick={() => setFilter({ ...filter, role: 'transportation-manager' })}
            className="cursor-pointer border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all"
          >
            <div className="p-4 flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Route className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-950">
                  {stats.accounts.transportationManagers}
                </div>
                <div className="text-xs font-semibold text-slate-500">Managers</div>
              </div>
            </div>
          </Card>

          <Card
            onClick={() => setFilter({ ...filter, role: 'admin' })}
            className="cursor-pointer border-slate-200/80 hover:border-rose-400 hover:shadow-md transition-all"
          >
            <div className="p-4 flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-950">{stats.accounts.admins}</div>
                <div className="text-xs font-semibold text-slate-500">Admins</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search accounts by name or email..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="pl-10 bg-white"
          />
        </div>

        <select
          value={filter.role}
          onChange={(e) => setFilter({ ...filter, role: e.target.value })}
          className="h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All Account Roles</option>
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {roleLabels[r]}
            </option>
          ))}
        </select>
      </div>

      {/* Users Table Card */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        {loadingUsers ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm font-medium">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No accounts found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              No accounts matched your current search and role filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Account Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">System Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => {
                  const uid = u._id || u.id
                  return (
                    <tr
                      key={uid}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        u.banned ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs shadow-2xs ${
                              roleBg[u.role] || 'bg-slate-600'
                            }`}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {u.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => onChangeRole(uid, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                        >
                          {roleOptions.map((r) => (
                            <option key={r} value={r}>
                              {roleLabels[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => onOpenStatusModal(u)}
                          className="cursor-pointer transition-transform hover:scale-105 focus:outline-none"
                          title={`Click to ${u.banned ? 'activate' : 'ban'} user`}
                        >
                          {u.banned ? (
                            <Badge
                              variant="softRed"
                              title={u.banReason || 'Banned'}
                              className="text-xs cursor-pointer"
                            >
                              <Ban className="h-3 w-3 mr-1" /> Banned
                            </Badge>
                          ) : (
                            <Badge variant="softGreen" className="text-xs cursor-pointer">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Name & Role"
                            onClick={() => onStartEdit(u)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              u.banned
                                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                            }`}
                            title={u.banned ? 'Activate User' : 'Ban User'}
                            onClick={() => onOpenStatusModal(u)}
                          >
                            {u.banned ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete User Permanently"
                            onClick={() => onDeleteUser(u)}
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

