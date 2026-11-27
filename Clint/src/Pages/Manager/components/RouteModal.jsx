import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { X, MapPin, Trash2, Plus, LocateFixed, Loader2, Search } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import RoutePickerMap from '@/Components/Map/RoutePickerMap'

// Instant campus & Dhaka area suggestions with exact lat/lng
const PRESET_LOCATIONS = [
  { name: 'Daffodil Smart City (DSC)', sub: 'Ashulia, Birulia', lat: 23.8769, lng: 90.3202 },
  { name: 'DSC Main Gate', sub: 'Daffodil Smart City Entrance', lat: 23.8758, lng: 90.3215 },
  { name: 'Birulia Bridge', sub: 'Birulia, Savar', lat: 23.8625, lng: 90.3408 },
  { name: 'Uttara Center Metro Station', sub: 'Uttara Sector 18', lat: 23.8595, lng: 90.3677 },
  { name: 'Uttara House Building', sub: 'Uttara Sector 7', lat: 23.8742, lng: 90.4005 },
  { name: 'Mirpur 10 Circle', sub: 'Mirpur, Dhaka', lat: 23.8069, lng: 90.3687 },
  { name: 'Mirpur 2 (Sony Square)', sub: 'Mirpur, Dhaka', lat: 23.8058, lng: 90.3621 },
  { name: 'Mirpur 1 Bus Stand', sub: 'Mirpur, Dhaka', lat: 23.7956, lng: 90.3537 },
  { name: 'Dhanmondi 27 (Sobhanbag)', sub: 'Dhanmondi, Dhaka', lat: 23.7549, lng: 90.3762 },
  { name: 'Savar City Center', sub: 'Savar, Dhaka', lat: 23.8479, lng: 90.2576 },
]

export default function RouteModal({
  isOpen,
  onClose,
  editingRoute,
  routeForm,
  setRouteForm,
  onSubmit,
}) {
  const [pickMode, setPickMode] = useState('origin') // 'origin' | 'stop' | 'destination'
  const [manualStopName, setManualStopName] = useState('')
  const [activeSuggestField, setActiveSuggestField] = useState(null) // 'origin' | 'destination' | 'stop' | null
  const [searchResults, setSearchResults] = useState([])
  const [searchingPlace, setSearchingPlace] = useState(false)
  const [locatingCurrent, setLocatingCurrent] = useState(false)

  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      setActiveSuggestField(null)
      setSearchResults([])
    }
  }, [isOpen])

  if (!isOpen) return null

  const stopCoordinates = Array.isArray(routeForm.stopCoordinates)
    ? routeForm.stopCoordinates
    : []

  // Query OpenStreetMap Nominatim when typing
  const triggerLocationSearch = (queryText) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    const q = (queryText || '').trim()
    if (q.length < 2) {
      setSearchResults([])
      setSearchingPlace(false)
      return
    }

    setSearchingPlace(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=bd&limit=5`
        )
        if (res.ok) {
          const data = await res.json()
          const formatted = data.map((item) => ({
            name: item.name || item.display_name.split(',')[0],
            sub: item.display_name.split(',').slice(1, 3).join(',').trim(),
            lat: Number(Number(item.lat).toFixed(6)),
            lng: Number(Number(item.lon).toFixed(6)),
          }))
          setSearchResults(formatted)
        }
      } catch {
        setSearchResults([])
      } finally {
        setSearchingPlace(false)
      }
    }, 350)
  }

  // Get suggestions list (preset filtered + live OSM results)
  const getSuggestionsFor = (queryText) => {
    const q = (queryText || '').trim().toLowerCase()
    const matchingPresets = PRESET_LOCATIONS.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)
    )
    // Combine without duplicates
    const combined = [...matchingPresets]
    searchResults.forEach((sr) => {
      if (!combined.some((c) => c.name.toLowerCase() === sr.name.toLowerCase())) {
        combined.push(sr)
      }
    })
    return combined.slice(0, 7)
  }

  // Helper: IP-based location fallback when browser GPS is denied or unavailable
  const fetchFallbackIPLocation = async () => {
    try {
      const res = await fetch('https://ipwho.is/')
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data.latitude && data.longitude) {
          return {
            lat: Number(Number(data.latitude).toFixed(6)),
            lng: Number(Number(data.longitude).toFixed(6)),
            placeName: [data.city, data.region].filter(Boolean).join(', ') || 'Current Area',
            isApprox: true,
          }
        }
      }
    } catch {
      // fallback to campus default
    }
    return {
      lat: 23.8769,
      lng: 90.3202,
      placeName: 'Daffodil Smart City (DSC)',
      isApprox: true,
    }
  }

  // Use browser current GPS location for Origin or Destination (with IP fallback)
  const handleUseCurrentLocation = async (targetField = 'origin') => {
    setLocatingCurrent(true)
    toast.loading('Detecting your current location...', { id: 'curr-loc' })

    const applyLocation = async (lat, lng, initialName = null, isApprox = false) => {
      let placeName = initialName || `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data?.name) {
            placeName = data.name
          } else if (data?.address) {
            placeName =
              data.address.road ||
              data.address.suburb ||
              data.address.neighbourhood ||
              data.address.city_district ||
              placeName
          }
        }
      } catch {
        // keep fallback name
      }

      if (targetField === 'origin') {
        setRouteForm((prev) => ({
          ...prev,
          startPoint: placeName,
          startCoordinates: { lat, lng },
        }))
        setPickMode('origin')
      } else if (targetField === 'destination') {
        setRouteForm((prev) => ({
          ...prev,
          endPoint: placeName,
          endCoordinates: { lat, lng },
        }))
        setPickMode('destination')
      }

      toast.dismiss('curr-loc')
      if (isApprox) {
        toast.success(`Browser GPS denied — set ${targetField} using approximate location (${placeName}). Click map to fine-tune!`)
      } else {
        toast.success(`Set ${targetField === 'origin' ? 'Origin' : 'Destination'} to your current location!`)
      }
      setLocatingCurrent(false)
      setActiveSuggestField(null)
    }

    if (!('geolocation' in navigator)) {
      const fb = await fetchFallbackIPLocation()
      await applyLocation(fb.lat, fb.lng, fb.placeName, true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        await applyLocation(lat, lng, null, false)
      },
      async () => {
        // Browser denied or timed out -> gracefully use IP geolocation fallback
        const fb = await fetchFallbackIPLocation()
        await applyLocation(fb.lat, fb.lng, fb.placeName, true)
      },
      { enableHighAccuracy: true, timeout: 6000 }
    )
  }

  const handleSelectSuggestion = (field, item) => {
    if (field === 'origin') {
      setRouteForm((prev) => ({
        ...prev,
        startPoint: item.name,
        startCoordinates: { lat: item.lat, lng: item.lng },
      }))
    } else if (field === 'destination') {
      setRouteForm((prev) => ({
        ...prev,
        endPoint: item.name,
        endCoordinates: { lat: item.lat, lng: item.lng },
      }))
    } else if (field === 'stop') {
      setRouteForm((prev) => {
        const current = Array.isArray(prev.stopCoordinates) ? prev.stopCoordinates : []
        const updatedCoords = [...current, { name: item.name, lat: item.lat, lng: item.lng }]
        return {
          ...prev,
          stopCoordinates: updatedCoords,
          stops: updatedCoords.map((s) => s.name).join(', '),
        }
      })
      setManualStopName('')
    }
    setActiveSuggestField(null)
  }

  const handleMapPick = (mode, { lat, lng, placeName }) => {
    if (mode === 'origin') {
      setRouteForm((prev) => ({
        ...prev,
        startPoint: prev.startPoint?.trim()
          ? prev.startPoint
          : placeName || `Origin (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        startCoordinates: { lat, lng },
      }))
    } else if (mode === 'destination') {
      setRouteForm((prev) => ({
        ...prev,
        endPoint: prev.endPoint?.trim()
          ? prev.endPoint
          : placeName || `Destination (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
        endCoordinates: { lat, lng },
      }))
    } else if (mode === 'stop') {
      const newStopName = placeName || `Stop #${stopCoordinates.length + 1}`
      setRouteForm((prev) => {
        const current = Array.isArray(prev.stopCoordinates) ? prev.stopCoordinates : []
        const updatedCoords = [...current, { name: newStopName, lat, lng }]
        return {
          ...prev,
          stopCoordinates: updatedCoords,
          stops: updatedCoords.map((s) => s.name).join(', '),
        }
      })
    }
  }

  const handleRenameStop = (index, newName) => {
    setRouteForm((prev) => {
      const current = [...(prev.stopCoordinates || [])]
      current[index] = { ...current[index], name: newName }
      return {
        ...prev,
        stopCoordinates: current,
        stops: current.map((s) => s.name).join(', '),
      }
    })
  }

  const handleDeleteStop = (index) => {
    setRouteForm((prev) => {
      const current = [...(prev.stopCoordinates || [])]
      current.splice(index, 1)
      return {
        ...prev,
        stopCoordinates: current,
        stops: current.map((s) => s.name).join(', '),
      }
    })
  }

  const handleAddManualStop = () => {
    const clean = manualStopName.trim()
    if (!clean) return
    const baseLat = routeForm.startCoordinates?.lat || 23.8103
    const baseLng = routeForm.startCoordinates?.lng || 90.4125
    setRouteForm((prev) => {
      const current = Array.isArray(prev.stopCoordinates) ? prev.stopCoordinates : []
      const updatedCoords = [
        ...current,
        {
          name: clean,
          lat: Number((baseLat + 0.002 * (current.length + 1)).toFixed(6)),
          lng: Number((baseLng + 0.002 * (current.length + 1)).toFixed(6)),
        },
      ]
      return {
        ...prev,
        stopCoordinates: updatedCoords,
        stops: updatedCoords.map((s) => s.name).join(', '),
      }
    })
    setManualStopName('')
    setActiveSuggestField(null)
  }

  const renderSuggestionsDropdown = (field, queryText) => {
    if (activeSuggestField !== field) return null
    const list = getSuggestionsFor(queryText)

    return (
      <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden max-h-56 overflow-y-auto">
        {field !== 'stop' && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              handleUseCurrentLocation(field)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100 border-b border-blue-100 transition-colors"
          >
            {locatingCurrent ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>Use My Current GPS Location</span>
          </button>
        )}

        {searchingPlace && (
          <div className="px-3 py-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Searching places...
          </div>
        )}

        {list.length === 0 && !searchingPlace ? (
          <div className="px-3 py-2 text-[11px] text-slate-400">
            No matching suggestions. You can click directly on the map!
          </div>
        ) : (
          list.map((item, idx) => (
            <button
              key={`${item.name}-${idx}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelectSuggestion(field, item)
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
            >
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 block truncate">
                  {item.name}
                </span>
                {item.sub && (
                  <span className="text-[10px] text-slate-400 block truncate">{item.sub}</span>
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-400 shrink-0">
                {item.lat.toFixed(3)}, {item.lng.toFixed(3)}
              </span>
            </button>
          ))
        )}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => {
          e.stopPropagation()
          setActiveSuggestField(null)
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              {editingRoute ? 'Edit Transit Route & Map Coordinates' : 'Create New Campus Route'}
            </h3>
            <p className="text-xs text-slate-500">
              Select from location suggestions, use your current GPS, or click on the map to pin coordinates.
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

        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Inputs & Stops List */}
          <div className="lg:col-span-5 space-y-4">
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

            {/* Origin with Suggestions & Current Location */}
            <div
              className="relative space-y-1.5 p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-emerald-900">
                  Origin (Start Point A) *
                </label>
                <div className="flex items-center gap-1.5">
                  {routeForm.startCoordinates?.lat != null && (
                    <span className="text-[10px] font-mono text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                      {routeForm.startCoordinates.lat.toFixed(4)}, {routeForm.startCoordinates.lng.toFixed(4)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation('origin')}
                    disabled={locatingCurrent}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white hover:bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs transition-colors"
                    title="Set Start Point to your current GPS location"
                  >
                    <LocateFixed className="h-3 w-3" />
                    Current Location
                  </button>
                </div>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Click for suggestions or type location..."
                  value={routeForm.startPoint}
                  onFocus={() => {
                    setPickMode('origin')
                    setActiveSuggestField('origin')
                  }}
                  onClick={() => setActiveSuggestField('origin')}
                  onChange={(e) => {
                    setRouteForm({ ...routeForm, startPoint: e.target.value })
                    setActiveSuggestField('origin')
                    triggerLocationSearch(e.target.value)
                  }}
                  required
                  className="bg-white"
                />
                {renderSuggestionsDropdown('origin', routeForm.startPoint)}
              </div>
            </div>

            {/* Destination with Suggestions */}
            <div
              className="relative space-y-1.5 p-3 rounded-xl border border-purple-200/80 bg-purple-50/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-purple-900">
                  Destination (End Point B) *
                </label>
                {routeForm.endCoordinates?.lat != null && (
                  <span className="text-[10px] font-mono text-purple-700 bg-white px-1.5 py-0.5 rounded border border-purple-200">
                    {routeForm.endCoordinates.lat.toFixed(4)}, {routeForm.endCoordinates.lng.toFixed(4)}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Click for suggestions or type destination..."
                  value={routeForm.endPoint}
                  onFocus={() => {
                    setPickMode('destination')
                    setActiveSuggestField('destination')
                  }}
                  onClick={() => setActiveSuggestField('destination')}
                  onChange={(e) => {
                    setRouteForm({ ...routeForm, endPoint: e.target.value })
                    setActiveSuggestField('destination')
                    triggerLocationSearch(e.target.value)
                  }}
                  required
                  className="bg-white"
                />
                {renderSuggestionsDropdown('destination', routeForm.endPoint)}
              </div>
            </div>

            {/* Intermediate Stops with Map Coordinates */}
            <div
              className="relative space-y-2 p-3 rounded-xl border border-slate-200 bg-slate-50/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  Intermediate Stops ({stopCoordinates.length})
                </label>
                <button
                  type="button"
                  onClick={() => setPickMode('stop')}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  + Pin on Map
                </button>
              </div>

              {stopCoordinates.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">
                  Select &ldquo;Add Stop Pin&rdquo; and click on the map, or search/type a stop below.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {stopCoordinates.map((stop, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200"
                    >
                      <span className="h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <Input
                        type="text"
                        value={stop.name}
                        onChange={(e) => handleRenameStop(idx, e.target.value)}
                        className="h-7 text-xs flex-1 border-slate-200"
                      />
                      <span className="text-[9px] font-mono text-slate-400 hidden sm:inline shrink-0">
                        {stop.lat.toFixed(3)},{stop.lng.toFixed(3)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStop(idx)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                        title="Delete Stop"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative flex items-center gap-1.5 pt-1">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Click for stop suggestions or type..."
                    value={manualStopName}
                    onFocus={() => setActiveSuggestField('stop')}
                    onClick={() => setActiveSuggestField('stop')}
                    onChange={(e) => {
                      setManualStopName(e.target.value)
                      setActiveSuggestField('stop')
                      triggerLocationSearch(e.target.value)
                    }}
                    className="h-8 text-xs bg-white"
                  />
                  {renderSuggestionsDropdown('stop', manualStopName)}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddManualStop}
                  className="h-8 px-2.5 text-xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Schedule Times</label>
                <Input
                  type="text"
                  placeholder="08:30 AM, 11:00 AM"
                  value={routeForm.scheduleTimes}
                  onChange={(e) => setRouteForm({ ...routeForm, scheduleTimes: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status</label>
                <select
                  value={routeForm.status}
                  onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-2xs outline-none focus:border-blue-600"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingRoute ? 'Save Route & Coordinates' : 'Create Route'}
              </Button>
            </div>
          </div>

          {/* Right Column: Interactive Map Picker */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
            <RoutePickerMap
              startCoordinates={routeForm.startCoordinates}
              endCoordinates={routeForm.endCoordinates}
              stopCoordinates={stopCoordinates}
              pickMode={pickMode}
              setPickMode={setPickMode}
              onMapPick={handleMapPick}
              height="440px"
            />
          </div>
        </form>
      </div>
    </div>
  )
}
