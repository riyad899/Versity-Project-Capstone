import { Users, Bus, Route, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'

export default function AdminOverviewTab({ stats }) {
  if (!stats) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          System Overview & Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          High-level statistics for campus accounts, fleet vehicles, and transit routes.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Registered Accounts
              </p>
              <h3 className="mt-2 text-3xl font-black text-slate-950">
                {stats.accounts?.totalUsers || 0}
              </h3>
              <p className="mt-1 text-xs text-blue-600 font-semibold">Active campus members</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Users className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Campus Buses
              </p>
              <h3 className="mt-2 text-3xl font-black text-slate-950">
                {stats.fleet?.totalBuses || 0}
              </h3>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Configured fleet units</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Bus className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Campus Routes
              </p>
              <h3 className="mt-2 text-3xl font-black text-slate-950">
                {stats.fleet?.totalRoutes || 0}
              </h3>
              <p className="mt-1 text-xs text-amber-600 font-semibold">Scheduled transit paths</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Route className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" /> Account Distribution
            </CardTitle>
            <CardDescription>Breakdown of campus community by authorization role</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-600 font-medium">Passenger Accounts</span>
              <strong className="text-slate-950 font-bold">{stats.accounts?.passengers || 0}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-600 font-medium">Driver Accounts</span>
              <strong className="text-slate-950 font-bold">{stats.accounts?.drivers || 0}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-600 font-medium">Transportation Managers</span>
              <strong className="text-slate-950 font-bold">{stats.accounts?.transportationManagers || 0}</strong>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-600 font-medium">System Administrators</span>
              <strong className="text-slate-950 font-bold">{stats.accounts?.admins || 0}</strong>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Bus className="h-4 w-4 text-emerald-600" /> Transit Fleet Operations
            </CardTitle>
            <CardDescription>Current operational capacity and network coverage</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-600 font-medium">Total Registered Buses</span>
              <strong className="text-slate-950 font-bold">{stats.fleet?.totalBuses || 0}</strong>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-600 font-medium">Configured Transit Routes</span>
              <strong className="text-slate-950 font-bold">{stats.fleet?.totalRoutes || 0}</strong>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-600 font-medium">Transit Network Status</span>
              <Badge variant="softGreen" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Fully Operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

