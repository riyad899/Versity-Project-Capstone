import { Users, UserPlus, Search } from 'lucide-react'
import { Card } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'

export default function ManagerUsersTab({ users, loading, search, setSearch, onMakeDriver }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Passenger & User Accounts
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse campus passengers and promote qualified students or staff to official drivers.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search passenger accounts by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* Table Card */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm font-medium">Loading user list...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No passenger accounts found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              All active users may already have roles assigned or your search returned no matches.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Passenger Name</th>
                  <th className="px-5 py-3.5">Email Address</th>
                  <th className="px-5 py-3.5">Current Role</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => {
                  const uid = u._id || u.id
                  return (
                    <tr key={uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-2xs">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="softBlue" className="capitalize text-xs">
                          Passenger
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 hover:text-emerald-800"
                          onClick={() => onMakeDriver(uid)}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" /> Make Driver
                        </Button>
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

