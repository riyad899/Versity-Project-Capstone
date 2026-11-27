import { useEffect, useRef, useState } from 'react'
import { Navigation, MapPin, Flag } from 'lucide-react'

const DEFAULT_CENTER = [23.8103, 90.4125] // Dhaka

export default function RoutePickerMap({
  startCoordinates,
  endCoordinates,
  stopCoordinates = [],
  pickMode,
  setPickMode,
  onMapPick,
  height = '360px',
  lockedMode = null, // optional: 'origin' | 'stop' | 'destination'
  instructionText = null,
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  // Keep latest pickMode and callback in refs for Leaflet click listener
  const pickModeRef = useRef(pickMode)
  const onMapPickRef = useRef(onMapPick)
  useEffect(() => {
    pickModeRef.current = pickMode
    onMapPickRef.current = onMapPick
  }, [pickMode, onMapPick])

  // Load Leaflet CSS & JS
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true)
      return
    }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => setLeafletLoaded(true)
      document.head.appendChild(script)
    } else {
      document.getElementById('leaflet-js').addEventListener('load', () => setLeafletLoaded(true))
    }
  }, [])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !window.L || !mapContainerRef.current || mapRef.current) return

    const initialCenter =
      startCoordinates?.lat && startCoordinates?.lng
        ? [startCoordinates.lat, startCoordinates.lng]
        : DEFAULT_CENTER

    const map = window.L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: true,
    })

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    map.on('click', async (e) => {
      const lat = Number(e.latlng.lat.toFixed(6))
      const lng = Number(e.latlng.lng.toFixed(6))
      let placeName = ''

      setGeocoding(true)
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
              ''
          }
        }
      } catch {
        // Silent fallback if offline or rate-limited
      } finally {
        setGeocoding(false)
      }

      if (onMapPickRef.current) {
        onMapPickRef.current(pickModeRef.current, { lat, lng, placeName })
      }
    })

    mapRef.current = map

    // Fix Leaflet resize issue inside modal
    setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [leafletLoaded])

  // Keep track of last centered coordinate / bounds
  const lastCenterRef = useRef(null)
  const hasFittedBoundsRef = useRef(false)

  // Render Markers & Polyline whenever coordinates change
  useEffect(() => {
    if (!mapRef.current || !window.L) return
    const map = mapRef.current

    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
      polylineRef.current = null
    }

    const path = []

    const addPin = (lat, lng, label, color, title) => {
      const icon = window.L.divIcon({
        className: 'route-picker-pin',
        html: `<div style="
          background:${color};
          color:#fff;
          width:26px;
          height:26px;
          border-radius:50%;
          border:2.5px solid #fff;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:11px;
          font-weight:800;
          box-shadow:0 3px 8px rgba(0,0,0,0.35);
        ">${label}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })
      const marker = window.L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${title}</strong><br/><span style="font-size:10px;color:#64748b">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`)
      markersRef.current.push(marker)
      path.push([lat, lng])
    }

    if (startCoordinates?.lat != null && startCoordinates?.lng != null) {
      addPin(startCoordinates.lat, startCoordinates.lng, 'A', '#10B981', 'Origin (Start Point)')
    }

    stopCoordinates.forEach((stop, idx) => {
      if (stop?.lat != null && stop?.lng != null) {
        addPin(stop.lat, stop.lng, `${idx + 1}`, '#F59E0B', stop.name || `Stop #${idx + 1}`)
      }
    })

    if (endCoordinates?.lat != null && endCoordinates?.lng != null) {
      addPin(endCoordinates.lat, endCoordinates.lng, 'B', '#8B5CF6', 'Destination (End Point)')
    }

    if (path.length > 1) {
      polylineRef.current = window.L.polyline(path, {
        color: '#2563EB',
        weight: 4,
        opacity: 0.8,
      }).addTo(map)

      if (!hasFittedBoundsRef.current) {
        hasFittedBoundsRef.current = true
        map.fitBounds(window.L.latLngBounds(path), { padding: [40, 40], maxZoom: 15 })
      }
    } else if (startCoordinates?.lat != null && startCoordinates?.lng != null) {
      const key = `${startCoordinates.lat},${startCoordinates.lng}`
      if (lastCenterRef.current !== key) {
        lastCenterRef.current = key
        map.panTo([startCoordinates.lat, startCoordinates.lng], { animate: true })
      }
    }
  }, [startCoordinates, endCoordinates, stopCoordinates])

  const activeMode = lockedMode || pickMode

  return (
    <div className="space-y-2.5">
      {/* Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!lockedMode ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPickMode('origin')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeMode === 'origin'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
              }`}
            >
              <Navigation className="h-3.5 w-3.5" />
              Set Origin (A)
            </button>

            <button
              type="button"
              onClick={() => setPickMode('stop')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeMode === 'stop'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Add Stop Pin
            </button>

            <button
              type="button"
              onClick={() => setPickMode('destination')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeMode === 'destination'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              Set Destination (B)
            </button>
          </div>
        ) : (
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-500" />
            Route Map View
          </span>
        )}

        {geocoding && (
          <span className="text-[11px] font-medium text-blue-600 animate-pulse">
            Fetching place name...
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        {instructionText || (
          <>
            Click anywhere on the map to set the{' '}
            <strong className="text-slate-800">
              {activeMode === 'origin'
                ? 'Origin (Start Point)'
                : activeMode === 'destination'
                ? 'Destination (End Point)'
                : 'Intermediate Stop'}
            </strong>{' '}
            coordinates.
          </>
        )}
      </p>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{ height }}
        className="w-full rounded-xl border border-slate-200 shadow-inner bg-slate-100 cursor-crosshair z-0"
      />
    </div>
  )
}
