import { useState, useEffect } from 'react'
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Bus,
} from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Badge } from '@/Components/ui/badge'
import apiClient from '@/Hooks/Axios'
import toast from 'react-hot-toast'

const PRESET_DELAYS = [5, 10, 15, 20, 30, 45, 60]

const PRESET_REASONS = [
  'Heavy Traffic Congestion / Gridlock',
  'Birulia Bridge Traffic Slowdown',
  'Road Construction & Diversion',
  'Inclement Weather / Heavy Rain',
  'Mechanical / Engine Check',
  'Tire Replacement / Maintenance',
  'Driver Shift Handover Delay',
  'Passenger Assistance / Overcrowding',
]

export default function LogDelayModal({
  isOpen,
  onClose,
  bus,
  onDelayUpdated,
}) {
  const [delayMinutes, setDelayMinutes] = useState(0)
  const [delayReason, setDelayReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (bus) {
      setDelayMinutes(bus.delayMinutes || bus.bus?.delayMinutes || 0)
      const existingReason = bus.delayReason || bus.bus?.delayReason || ''
      if (PRESET_REASONS.includes(existingReason)) {
        setDelayReason(existingReason)
        setCustomReason('')
      } else {
        setDelayReason(existingReason ? 'Other' : '')
        setCustomReason(existingReason)
      }
    }
  }, [bus, isOpen])

  if (!isOpen || !bus) return null

  const busObj = bus.bus || bus
  const busId = busObj._id || busObj.id
  const currentDelay = bus.delayMinutes || busObj.delayMinutes || 0

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)
    try {
      const finalReason =
        delayReason === 'Other'
          ? customReason.trim()
          : (delayReason || customReason).trim()

      const payload = {
        delayMinutes: Number(delayMinutes) || 0,
        delayReason: Number(delayMinutes) > 0 ? finalReason : '',
      }

      const res = await apiClient.patch(`/api/v1/buses/${busId}/delay`, payload)
      toast.success(
        payload.delayMinutes > 0
          ? `Bus #${busObj.busNumber} marked delayed by ${payload.delayMinutes} mins`
          : `Delay cleared for Bus #${busObj.busNumber}!`
      )

      if (onDelayUpdated) {
        onDelayUpdated(res.data?.data || payload)
      }
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update delay')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearDelay = async () => {
    setIsSubmitting(true)
    try {
      await apiClient.patch(`/api/v1/buses/${busId}/delay`, {
        delayMinutes: 0,
        delayReason: '',
      })
      toast.success(`Delay cleared! Bus #${busObj.busNumber} is marked on time.`)
      if (onDelayUpdated) {
        onDelayUpdated({ delayMinutes: 0, delayReason: '' })
      }
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear delay')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-linear-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Log & Broadcast Bus Delay
              </h3>
              <p className="text-xs text-slate-500">
                Notify dispatch, managers, and live tracking passengers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs font-bold px-2 py-0.5">
              #{busObj.busNumber}
            </Badge>
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
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Bus Info Bar */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Bus className="h-4 w-4 text-slate-600" />
              <span className="font-bold text-slate-800">{busObj.name}</span>
              <span className="text-slate-500 font-mono">({busObj.licensePlate})</span>
            </div>
            {currentDelay > 0 ? (
              <Badge variant="softRed" className="text-[10px] font-bold">
                Currently +{currentDelay}m late
              </Badge>
            ) : (
              <Badge variant="softGreen" className="text-[10px] font-bold">
                Currently On Time
              </Badge>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Delay Duration</span>
              <span className="text-amber-600 font-extrabold">
                {delayMinutes > 0 ? `+${delayMinutes} mins` : 'On Time (0 mins)'}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {PRESET_DELAYS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDelayMinutes(mins)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all border ${
                    delayMinutes === mins
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  +{mins}m
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Input
                type="number"
                min="0"
                max="240"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Math.max(0, Number(e.target.value) || 0))}
                placeholder="Custom minutes"
                className="h-8 text-xs"
              />
              <span className="text-xs text-slate-400 font-medium shrink-0">minutes</span>
            </div>
          </div>

          {/* Reason Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Delay Reason / Incident Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {PRESET_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setDelayReason(reason)
                    setCustomReason('')
                  }}
                  className={`p-2 rounded-lg text-left text-xs font-medium border transition-all truncate ${
                    delayReason === reason
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <Input
                type="text"
                placeholder="Or custom passenger notice / remarks..."
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value)
                  setDelayReason('Other')
                }}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
            {currentDelay > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearDelay}
                disabled={isSubmitting}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8 text-xs w-full sm:w-auto"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Clear Delay (Mark On Time)
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                {isSubmitting ? 'Saving...' : 'Broadcast Delay'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
