import { X } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'

export default function BusModal({
  isOpen,
  onClose,
  editingBus,
  busForm,
  setBusForm,
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
              {editingBus ? 'Edit Bus Information' : 'Add New Campus Bus'}
            </h3>
            <p className="text-xs text-slate-500">
              Enter identification number, vehicle name, and seating parameters
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Bus Number (ID) *</label>
              <Input
                type="text"
                placeholder="e.g. BUS-101"
                value={busForm.busNumber}
                onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Model / Name *</label>
              <Input
                type="text"
                placeholder="e.g. Scania City Express"
                value={busForm.name}
                onChange={(e) => setBusForm({ ...busForm, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">License Plate *</label>
              <Input
                type="text"
                placeholder="e.g. DHA-GA-1122"
                value={busForm.licensePlate}
                onChange={(e) => setBusForm({ ...busForm, licensePlate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Passenger Capacity *</label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 40"
                value={busForm.capacity}
                onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Operational Status</label>
            <select
              value={busForm.status}
              onChange={(e) => setBusForm({ ...busForm, status: e.target.value })}
              className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="active">Active On Duty</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="inactive">Inactive / Standby</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingBus ? 'Save Changes' : 'Register Campus Bus'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

