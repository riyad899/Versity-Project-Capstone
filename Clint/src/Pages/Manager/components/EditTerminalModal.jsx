import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import RoutePickerMap from '@/Components/Map/RoutePickerMap'

export default function EditTerminalModal({
  isOpen,
  onClose,
  editTerminalModal,
  setEditTerminalModal,
  onSubmit,
}) {
  const [pickMode, setPickMode] = useState('origin')

  if (!isOpen || !editTerminalModal) return null

  const handleMapPick = (mode, { lat, lng, placeName }) => {
    if (mode === 'origin') {
      setEditTerminalModal({
        ...editTerminalModal,
        startPoint: placeName || editTerminalModal.startPoint,
        startCoordinates: { lat, lng },
      })
    } else if (mode === 'destination') {
      setEditTerminalModal({
        ...editTerminalModal,
        endPoint: placeName || editTerminalModal.endPoint,
        endCoordinates: { lat, lng },
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Edit Route Destinations & Map</h3>
            <p className="text-xs text-slate-500">Route: <strong>{editTerminalModal.routeName}</strong></p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-1.5 p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/30">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-900">
                  Initial Destination (Start Point A) *
                </label>
                {editTerminalModal.startCoordinates?.lat != null && (
                  <span className="text-[10px] font-mono text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                    {Number(editTerminalModal.startCoordinates.lat).toFixed(4)},{' '}
                    {Number(editTerminalModal.startCoordinates.lng).toFixed(4)}
                  </span>
                )}
              </div>
              <Input
                type="text"
                value={editTerminalModal.startPoint || ''}
                onFocus={() => setPickMode('origin')}
                onChange={(e) =>
                  setEditTerminalModal({ ...editTerminalModal, startPoint: e.target.value })
                }
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5 p-3 rounded-xl border border-purple-200/80 bg-purple-50/30">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-900">
                  Last Destination (End Point B) *
                </label>
                {editTerminalModal.endCoordinates?.lat != null && (
                  <span className="text-[10px] font-mono text-purple-700 bg-white px-1.5 py-0.5 rounded border border-purple-200">
                    {Number(editTerminalModal.endCoordinates.lat).toFixed(4)},{' '}
                    {Number(editTerminalModal.endCoordinates.lng).toFixed(4)}
                  </span>
                )}
              </div>
              <Input
                type="text"
                value={editTerminalModal.endPoint || ''}
                onFocus={() => setPickMode('destination')}
                onChange={(e) =>
                  setEditTerminalModal({ ...editTerminalModal, endPoint: e.target.value })
                }
                required
                className="bg-white"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Update Destinations
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <RoutePickerMap
              startCoordinates={editTerminalModal.startCoordinates}
              endCoordinates={editTerminalModal.endCoordinates}
              stopCoordinates={editTerminalModal.stopCoordinates || []}
              pickMode={pickMode}
              setPickMode={setPickMode}
              onMapPick={handleMapPick}
              height="360px"
            />
          </div>
        </form>
      </div>
    </div>
  )
}
