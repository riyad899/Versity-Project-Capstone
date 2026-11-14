import { X } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'

export default function RouteModal({
  isOpen,
  onClose,
  editingRoute,
  routeForm,
  setRouteForm,
  onSubmit,
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              {editingRoute ? 'Edit Transit Route' : 'Create New Campus Route'}
            </h3>
            <p className="text-xs text-slate-500">
              Set route name, origin, terminus, intermediate stops, and schedules
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
            <label className="text-xs font-bold text-slate-700">Route Name *</label>
            <Input
              type="text"
              placeholder="e.g. Express Loop A"
              value={routeForm.routeName}
              onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Initial Destination (Origin) *
              </label>
              <Input
                type="text"
                placeholder="e.g. Main Gate"
                value={routeForm.startPoint}
                onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Last Destination (Terminus) *
              </label>
              <Input
                type="text"
                placeholder="e.g. Science Complex"
                value={routeForm.endPoint}
                onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Stops (Comma separated)
            </label>
            <Input
              type="text"
              placeholder="e.g. Library Plaza, Gym, Tech Hall"
              value={routeForm.stops}
              onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Schedule Times (Comma separated)
            </label>
            <Input
              type="text"
              placeholder="e.g. 08:30 AM, 11:00 AM, 03:30 PM"
              value={routeForm.scheduleTimes}
              onChange={(e) => setRouteForm({ ...routeForm, scheduleTimes: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Route Status</label>
            <select
              value={routeForm.status}
              onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value })}
              className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingRoute ? 'Save Changes' : 'Create Route'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

