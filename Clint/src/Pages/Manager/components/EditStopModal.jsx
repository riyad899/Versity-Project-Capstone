import { X, MapPin, Navigation } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import RoutePickerMap from '@/Components/Map/RoutePickerMap'

export default function EditStopModal({
  isOpen,
  onClose,
  editStopModal,
  setEditStopModal,
  onSubmit,
}) {
  if (!isOpen || !editStopModal) return null

  const {
    routeName,
    oldStopName,
    newStopName,
    lat,
    lng,
    startPoint,
    endPoint,
    startCoordinates,
    endCoordinates,
    allStopCoordinates = [],
  } = editStopModal

  // Replace the currently edited stop's coordinates live in the preview array
  const previewStopCoords = allStopCoordinates.map((s) =>
    s.name?.toLowerCase() === oldStopName?.toLowerCase()
      ? {
          name: newStopName || oldStopName,
          lat: lat ?? s.lat,
          lng: lng ?? s.lng,
        }
      : s
  )

  const handleMapPick = (_mode, { lat: pickedLat, lng: pickedLng, placeName }) => {
    setEditStopModal({
      ...editStopModal,
      lat: pickedLat,
      lng: pickedLng,
      newStopName: placeName || editStopModal.newStopName,
    })
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
            <h3 className="text-lg font-bold text-slate-950">Edit Bus Stop & Map Location</h3>
            <p className="text-xs text-slate-500">
              Route: <strong>{routeName}</strong> ({startPoint} → {endPoint})
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Stop Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Stop Name *</label>
              <Input
                type="text"
                value={newStopName || ''}
                onChange={(e) =>
                  setEditStopModal({ ...editStopModal, newStopName: e.target.value })
                }
                placeholder="e.g. Science Building, Main Library"
                required
              />
            </div>

            <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/40 space-y-1.5">
              <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                Stop GPS Coordinates
              </span>
              {lat != null && lng != null ? (
                <p className="text-xs font-mono font-semibold text-blue-700">
                  Lat: {Number(lat).toFixed(6)}, Lng: {Number(lng).toFixed(6)}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Click on the map to set exact coordinates.</p>
              )}
              <p className="text-[11px] text-slate-500">
                Click anywhere on the map to relocate this stop along the route.
              </p>
            </div>

            {/* Route Context */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Existing Route Stops ({allStopCoordinates.length})
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="h-4 w-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center">
                    A
                  </span>
                  <span className="truncate">{startPoint}</span>
                </div>
                {previewStopCoords.map((s, idx) => {
                  const isCurrent = s.name?.toLowerCase() === (newStopName || oldStopName)?.toLowerCase()
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 pl-1 ${
                        isCurrent ? 'font-bold text-blue-700' : 'text-slate-600'
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full text-white text-[9px] flex items-center justify-center shrink-0 ${
                          isCurrent ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{s.name}</span>
                    </div>
                  )
                })}
                <div className="flex items-center gap-1.5 text-purple-700 font-semibold">
                  <span className="h-4 w-4 rounded-full bg-purple-600 text-white text-[9px] flex items-center justify-center">
                    B
                  </span>
                  <span className="truncate">{endPoint}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Stop Update
              </Button>
            </div>
          </div>

          {/* Right: Existing Route Map */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <RoutePickerMap
              startCoordinates={startCoordinates}
              endCoordinates={endCoordinates}
              stopCoordinates={previewStopCoords}
              pickMode="stop"
              setPickMode={() => {}}
              lockedMode="stop"
              instructionText={
                <>
                  Showing existing route from <strong>{startPoint}</strong> to{' '}
                  <strong>{endPoint}</strong>. Click on the map to update{' '}
                  <strong>{oldStopName}</strong>&apos;s location.
                </>
              }
              onMapPick={handleMapPick}
              height="380px"
            />
          </div>
        </form>
      </div>
    </div>
  )
}
