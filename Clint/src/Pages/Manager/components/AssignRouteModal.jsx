import { X, Route } from 'lucide-react'
import { Button } from '@/Components/ui/button'

export default function AssignRouteModal({
  isOpen,
  onClose,
  bus,
  routes,
  selectedRouteId,
  setSelectedRouteId,
  onSubmit,
}) {
  if (!isOpen || !bus) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-950 text-base">Assign Route to Bus</h3>
            <p className="text-xs text-slate-500">
              Bus: {bus.name} (#{bus.busNumber})
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Select Transit Route</span>
              {bus.assignedRoute && (
                <span className="text-[11px] text-blue-600 font-semibold">
                  Current: {bus.assignedRoute.routeName || 'Assigned'}
                </span>
              )}
            </label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">-- No Route (Unassign) --</option>
              {routes.map((r) => {
                const rid = r._id || r.id
                const isCurrent =
                  bus.assignedRoute &&
                  String(bus.assignedRoute._id || bus.assignedRoute.id || bus.assignedRoute) === String(rid)
                return (
                  <option key={rid} value={rid}>
                    {r.routeName} ({r.startPoint} ➔ {r.endPoint})
                    {isCurrent ? ' — [Current Route]' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Route className="h-3.5 w-3.5 mr-1" /> Bind Route to Bus
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

