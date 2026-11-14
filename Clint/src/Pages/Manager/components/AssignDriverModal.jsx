import { X, User, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/Components/ui/button'

export default function AssignDriverModal({
  isOpen,
  onClose,
  bus,
  drivers = [],
  buses = [],
  selectedDriverId,
  setSelectedDriverId,
  onSubmit,
}) {
  if (!isOpen || !bus) return null

  // Find if a driver is already assigned to a DIFFERENT bus
  const getDriverAssignedBus = (driverId) => {
    if (!driverId || !buses) return null
    return buses.find((b) => {
      const isCurrentBus = String(b._id || b.id) === String(bus._id || bus.id)
      if (isCurrentBus) return false
      const assignedId = b.assignedDriver?._id || b.assignedDriver?.id || b.assignedDriver
      return assignedId && String(assignedId) === String(driverId)
    })
  }

  const selectedDriver = drivers.find((d) => String(d._id || d.id) === String(selectedDriverId))
  const selectedDriverAssignedBus = getDriverAssignedBus(selectedDriverId)

  const isCurrentBusDriver =
    bus.assignedDriver &&
    String(bus.assignedDriver._id || bus.assignedDriver.id || bus.assignedDriver) ===
      String(selectedDriverId)

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
            <h3 className="font-bold text-slate-950 text-base flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Assign Driver to Bus
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Bus: <strong className="text-slate-800">{bus.name}</strong> (#{bus.busNumber})
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
              <span>Select Campus Driver</span>
              {bus.assignedDriver && (
                <span className="text-[11px] text-blue-600 font-semibold">
                  Current: {bus.assignedDriver.name || 'Assigned'}
                </span>
              )}
            </label>

            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className={`flex h-11 w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none focus:ring-2 ${
                selectedDriverAssignedBus
                  ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-100'
                  : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
              }`}
            >
              <option value="">-- No Driver (Unassign) --</option>
              {drivers.map((d) => {
                const did = d._id || d.id
                const otherBus = getDriverAssignedBus(did)
                const isThisBus =
                  bus.assignedDriver &&
                  String(
                    bus.assignedDriver._id || bus.assignedDriver.id || bus.assignedDriver
                  ) === String(did)

                let label = `${d.name} (${d.email})`
                if (isThisBus) {
                  label += ' — [Currently Assigned to This Bus]'
                } else if (otherBus) {
                  label += ` — ⚠️ [Already Assigned: #${otherBus.busNumber} ${otherBus.name}]`
                } else {
                  label += ' — [Available]'
                }

                return (
                  <option key={did} value={did}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Already Assigned Alert Message */}
          {selectedDriverAssignedBus && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Driver Already Assigned!</span>
              </div>
              <p className="leading-relaxed">
                Driver <strong className="font-bold text-amber-950">{selectedDriver?.name}</strong> is
                already assigned to bus{' '}
                <strong className="text-amber-950">#{selectedDriverAssignedBus.busNumber} ({selectedDriverAssignedBus.name})</strong>
                {selectedDriverAssignedBus.assignedRoute?.routeName && (
                  <span>
                    {' '}on route <strong>"{selectedDriverAssignedBus.assignedRoute.routeName}"</strong>
                  </span>
                )}.
              </p>
              <div className="flex items-start gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-100/80 p-2 rounded-lg mt-1">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-700" />
                <span>
                  1 driver cannot be assigned to multiple buses. To assign this driver here, please first unassign them from bus #{selectedDriverAssignedBus.busNumber}.
                </span>
              </div>
            </div>
          )}

          {/* Current Driver Info Note */}
          {isCurrentBusDriver && !selectedDriverAssignedBus && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 text-xs text-blue-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                <strong>{selectedDriver?.name}</strong> is the current active driver for this vehicle.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={Boolean(selectedDriverAssignedBus)}
              className={
                selectedDriverAssignedBus
                  ? 'bg-amber-600 hover:bg-amber-600 cursor-not-allowed opacity-80'
                  : ''
              }
            >
              {selectedDriverAssignedBus ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Already Assigned
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5 mr-1" /> Confirm Assignment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
