import { useState, useRef, useEffect } from 'react'
import {
  X,
  Clock,
  Calendar,
  Bus as BusIcon,
  Route as RouteIcon,
  User,
  Plus,
  Sparkles,
  Timer,
} from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Badge } from '@/Components/ui/badge'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
const PERIODS = ['AM', 'PM']

const DEPARTURE_PRESETS = [
  '07:30 AM',
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '10:30 AM',
  '12:00 PM',
  '02:30 PM',
  '05:00 PM',
]

// Convert 24hr "HH:mm" to 12hr "hh:mm A" (e.g. "14:30" -> "02:30 PM")
function format24to12(time24) {
  if (!time24) return ''
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr || '00'
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  const hDisplay = h < 10 ? `0${h}` : `${h}`
  return `${hDisplay}:${m} ${period}`
}

// Convert 12hr "hh:mm A" to 24hr "HH:mm" (e.g. "02:30 PM" -> "14:30")
function format12to24(time12) {
  if (!time12) return ''
  const match = time12.match(/^(\d{1,2}):(\d{2})(?:\s*([APap][Mm]))?$/)
  if (!match) return ''
  let [, hStr, mStr, period] = match
  let h = parseInt(hStr, 10)
  if (period) {
    const p = period.toUpperCase()
    if (p === 'PM' && h < 12) h += 12
    if (p === 'AM' && h === 12) h = 0
  }
  const hDisplay = h < 10 ? `0${h}` : `${h}`
  return `${hDisplay}:${mStr}`
}

// Parse string time into { hour, minute, period }
function parseTimeToParts(timeStr) {
  if (!timeStr) return { hour: '08', minute: '00', period: 'AM' }
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*([APap][Mm]))?$/)
  if (!match) return { hour: '08', minute: '00', period: 'AM' }
  let [, hStr, mStr, pStr] = match
  let h = parseInt(hStr, 10)
  let p = (pStr || 'AM').toUpperCase()
  if (h > 12) {
    h = h - 12
    p = 'PM'
  }
  if (h === 0) h = 12
  const hour = h < 10 ? `0${h}` : `${h}`
  return { hour, minute: mStr || '00', period: p }
}

// Add minutes to a time string (e.g. "08:00 AM" + 45 -> "08:45 AM")
function addMinutesToTime(timeStr, mins) {
  if (!timeStr) return ''
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*([APap][Mm]))?$/)
  if (!match) return ''
  let [, hStr, mStr, pStr] = match
  let h = parseInt(hStr, 10)
  let m = parseInt(mStr, 10)
  const p = (pStr || 'AM').toUpperCase()
  if (p === 'PM' && h < 12) h += 12
  if (p === 'AM' && h === 12) h = 0

  const total = (h * 60 + m + mins) % (24 * 60)
  let newH = Math.floor(total / 60)
  const newM = total % 60
  const newP = newH >= 12 ? 'PM' : 'AM'
  newH = newH % 12
  if (newH === 0) newH = 12
  const hDisplay = newH < 10 ? `0${newH}` : `${newH}`
  const mDisplay = newM < 10 ? `0${newM}` : `${newM}`
  return `${hDisplay}:${mDisplay} ${newP}`
}

/**
 * Clock & Time Picker Field Component
 * Supports:
 * - Native HTML5 clock picker popup via .showPicker()
 * - Visual Hour/Minute/AM-PM point-and-click dropdown controls (zero typing)
 * - Free text typing (optional)
 * - Quick presets & offset buttons (+30m, +45m, etc.)
 */
function ClockTimePicker({
  label,
  value,
  onChange,
  required = false,
  badgeText = 'Clock Picker',
  badgeColor = 'blue',
  presets = [],
  offsetBaseTime = '',
  offsetMinutes = [],
  placeholder = 'e.g. 08:00 AM',
}) {
  const nativeInputRef = useRef(null)
  const [showPickerControls, setShowPickerControls] = useState(false)

  const parts = parseTimeToParts(value)

  const handleNativeClockChange = (e) => {
    const val24 = e.target.value
    if (val24) {
      const val12 = format24to12(val24)
      onChange(val12)
    }
  }

  const triggerNativeClock = () => {
    try {
      if (nativeInputRef.current) {
        if (typeof nativeInputRef.current.showPicker === 'function') {
          nativeInputRef.current.showPicker()
        } else {
          nativeInputRef.current.focus()
        }
      }
    } catch {
      setShowPickerControls(true)
    }
  }

  const handlePartChange = (field, newVal) => {
    const current = parseTimeToParts(value)
    const updated = { ...current, [field]: newVal }
    onChange(`${updated.hour}:${updated.minute} ${updated.period}`)
  }

  const isEmerald = badgeColor === 'emerald'

  return (
    <div
      className={`rounded-xl border p-3 space-y-2.5 transition-colors ${
        isEmerald ? 'bg-emerald-50/50 border-emerald-100' : 'bg-blue-50/50 border-blue-100'
      }`}
    >
      {/* Label and Quick Clock Launch Button */}
      <div className="flex items-center justify-between">
        <label
          className={`text-xs font-bold flex items-center gap-1.5 ${
            isEmerald ? 'text-emerald-950' : 'text-blue-950'
          }`}
        >
          <Clock className={`h-3.5 w-3.5 ${isEmerald ? 'text-emerald-600' : 'text-blue-600'}`} />
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div className="flex items-center gap-1">
          {/* Native Clock Trigger */}
          <button
            type="button"
            onClick={triggerNativeClock}
            title="Open Interactive Clock Picker"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
              isEmerald
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Clock</span>
          </button>

          {/* Toggle dropdown selectors */}
          <button
            type="button"
            onClick={() => setShowPickerControls(!showPickerControls)}
            className="text-[11px] text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded hover:bg-white/80 font-semibold cursor-pointer"
          >
            {showPickerControls ? 'Hide Picker' : 'Pick Time'}
          </button>
        </div>
      </div>

      {/* Input row with integrated clock button and hidden native input */}
      <div className="relative flex items-center">
        {/* Hidden HTML5 time input that powers the browser clock dial */}
        <input
          ref={nativeInputRef}
          type="time"
          value={format12to24(value) || ''}
          onChange={handleNativeClockChange}
          className="absolute inset-0 opacity-0 pointer-events-none -z-10"
          tabIndex={-1}
          aria-hidden="true"
        />

        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="bg-white font-bold text-slate-900 pr-10 tracking-wide text-sm h-10 shadow-2xs border-slate-200"
        />

        <button
          type="button"
          onClick={triggerNativeClock}
          title="Click to open Clock popup"
          className="absolute right-2 p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Clock className="h-4 w-4" />
        </button>
      </div>

      {/* Point-and-Click Dropdowns (Zero typing needed) */}
      {showPickerControls && (
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Hour</span>
            <span>Minute</span>
            <span>AM / PM</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={parts.hour}
              onChange={(e) => handlePartChange('hour', e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            <select
              value={parts.minute}
              onChange={(e) => handlePartChange('minute', e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={parts.period}
              onChange={(e) => handlePartChange('period', e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Quick Offset Buttons (e.g. +30m, +45m based on Departure) */}
      {offsetBaseTime && offsetMinutes.length > 0 && (
        <div className="pt-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mb-1">
            <Timer className="h-3 w-3 text-emerald-600" />
            <span>From Departure ({offsetBaseTime}):</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {offsetMinutes.map((mins) => {
              const targetTime = addMinutesToTime(offsetBaseTime, mins)
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onChange(targetTime)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200 shadow-2xs transition-all cursor-pointer"
                >
                  +{mins} min ({targetTime})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Departure Presets */}
      {presets.length > 0 && (
        <div className="pt-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Quick Times:
          </span>
          <div className="flex flex-wrap gap-1">
            {presets.map((timePreset) => (
              <button
                key={timePreset}
                type="button"
                onClick={() => onChange(timePreset)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer border ${
                  value === timePreset
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
              >
                {timePreset}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScheduleModal({
  isOpen,
  onClose,
  editingSchedule,
  scheduleForm,
  setScheduleForm,
  buses = [],
  routes = [],
  drivers = [],
  submitting = false,
  onSubmit,
}) {
  if (!isOpen) return null

  const handleBusSelect = (busId) => {
    const selectedBus = buses.find((b) => (b._id || b.id) === busId)
    setScheduleForm((prev) => {
      const next = { ...prev, bus: busId }
      // Auto-suggest bus's assigned route if not already set
      if (selectedBus?.assignedRoute) {
        const routeId =
          selectedBus.assignedRoute._id ||
          selectedBus.assignedRoute.id ||
          selectedBus.assignedRoute
        if (routeId) next.route = routeId
      }
      // Auto-suggest bus's assigned driver if not already set
      if (selectedBus?.assignedDriver) {
        const driverId =
          selectedBus.assignedDriver._id ||
          selectedBus.assignedDriver.id ||
          selectedBus.assignedDriver
        if (driverId) next.driver = driverId
      }
      return next
    })
  }

  const toggleDay = (day) => {
    setScheduleForm((prev) => {
      const currentDays = prev.operatingDays || []
      const exists = currentDays.includes(day)
      const nextDays = exists ? currentDays.filter((d) => d !== day) : [...currentDays, day]
      return { ...prev, operatingDays: nextDays }
    })
  }

  const selectDayPreset = (preset) => {
    if (preset === 'daily') {
      setScheduleForm((prev) => ({ ...prev, operatingDays: [...DAYS] }))
    } else if (preset === 'weekdays') {
      setScheduleForm((prev) => ({
        ...prev,
        operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      }))
    } else if (preset === 'weekends') {
      setScheduleForm((prev) => ({
        ...prev,
        operatingDays: ['Saturday', 'Sunday'],
      }))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs overflow-y-auto"
      onClick={!submitting ? onClose : undefined}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              {editingSchedule ? 'Edit Bus Schedule' : 'Create New Bus Schedule'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify bus vehicle, route, departure & arrival times, and operating service days.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            onClick={onClose}
            className="h-8 w-8 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Bus & Route Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BusIcon className="h-3.5 w-3.5 text-blue-600" /> Select Bus *
              </label>
              <select
                value={scheduleForm.bus}
                onChange={(e) => handleBusSelect(e.target.value)}
                required
                disabled={submitting}
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              >
                <option value="">-- Choose Bus --</option>
                {buses.map((b) => (
                  <option key={b._id || b.id} value={b._id || b.id}>
                    #{b.busNumber} - {b.name} ({b.capacity} seats)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <RouteIcon className="h-3.5 w-3.5 text-blue-600" /> Assigned Route *
              </label>
              <select
                value={scheduleForm.route}
                onChange={(e) => setScheduleForm({ ...scheduleForm, route: e.target.value })}
                required
                disabled={submitting}
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              >
                <option value="">-- Choose Route --</option>
                {routes.map((r) => (
                  <option key={r._id || r.id} value={r._id || r.id}>
                    {r.routeName} ({r.startPoint} → {r.endPoint})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Driver (Optional override) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-blue-600" /> Assigned Driver (Optional)
            </label>
            <select
              value={scheduleForm.driver || ''}
              onChange={(e) => setScheduleForm({ ...scheduleForm, driver: e.target.value || null })}
              disabled={submitting}
              className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            >
              <option value="">Default to Bus Assigned Driver (if any)</option>
              {drivers.map((d) => {
                const did = d._id || d.id
                const otherBus = buses.find((b) => {
                  const assignedId = b.assignedDriver?._id || b.assignedDriver?.id || b.assignedDriver
                  return assignedId && String(assignedId) === String(did)
                })
                const isSelectedBus =
                  otherBus && scheduleForm.bus && String(otherBus._id || otherBus.id) === String(scheduleForm.bus)

                let label = `${d.name} (${d.email})`
                if (isSelectedBus) {
                  label += ' — [Current Bus Assigned Driver]'
                } else if (otherBus) {
                  label += ` — ⚠️ [Already Assigned to #${otherBus.busNumber} ${otherBus.name}]`
                }
                return (
                  <option key={did} value={did}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Departure & Arrival Times with Interactive Clock Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ClockTimePicker
              label="Departure Time"
              value={scheduleForm.departureTime}
              onChange={(newTime) => setScheduleForm({ ...scheduleForm, departureTime: newTime })}
              required
              badgeColor="blue"
              presets={DEPARTURE_PRESETS}
              placeholder="e.g. 08:00 AM"
            />

            <ClockTimePicker
              label="Arrival Time"
              value={scheduleForm.arrivalTime}
              onChange={(newTime) => setScheduleForm({ ...scheduleForm, arrivalTime: newTime })}
              required
              badgeColor="emerald"
              offsetBaseTime={scheduleForm.departureTime}
              offsetMinutes={[20, 30, 45, 60]}
              presets={['08:45 AM', '09:15 AM', '10:00 AM', '01:15 PM', '03:15 PM', '05:45 PM']}
              placeholder="e.g. 08:45 AM"
            />
          </div>

          {/* Operating Days */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" /> Operating Days
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => selectDayPreset('daily')}
                  className="px-2 py-0.5 rounded text-blue-600 hover:bg-blue-50 font-semibold cursor-pointer disabled:opacity-50"
                >
                  All Days
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => selectDayPreset('weekdays')}
                  className="px-2 py-0.5 rounded text-blue-600 hover:bg-blue-50 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Weekdays
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => selectDayPreset('weekends')}
                  className="px-2 py-0.5 rounded text-blue-600 hover:bg-blue-50 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Weekends
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => {
                const isSelected = (scheduleForm.operatingDays || []).includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={submitting}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Schedule Status & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Schedule Status</label>
              <select
                value={scheduleForm.status}
                onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value })}
                disabled={submitting}
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              >
                <option value="active">Active (On Schedule)</option>
                <option value="delayed">Delayed</option>
                <option value="inactive">Inactive / Suspended</option>
                <option value="completed">Completed Trip</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Remarks / Operational Note</label>
              <Input
                type="text"
                placeholder="e.g. Morning express shuttle, Exam week rush"
                value={scheduleForm.remarks || ''}
                disabled={submitting}
                onChange={(e) => setScheduleForm({ ...scheduleForm, remarks: e.target.value })}
              />
            </div>
          </div>

          {/* Actions with Anti-Double-Click Submit Protection */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="relative min-w-[150px] font-bold"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{editingSchedule ? 'Saving...' : 'Creating...'}</span>
                </span>
              ) : editingSchedule ? (
                'Save Changes'
              ) : (
                'Create Bus Schedule'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
