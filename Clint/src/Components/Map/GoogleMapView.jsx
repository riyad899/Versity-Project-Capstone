import { useEffect, useRef, useState, useCallback } from 'react'
import { Layers, AlertCircle, CheckCircle2 } from 'lucide-react'

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCPoKvZckwNWs33M6XwP4T1Z1feEqYMm9I'

// Default Dhaka University / Campus coordinates
const DEFAULT_CENTER = { lat: 23.8103, lng: 90.4125 }

export default function GoogleMapView({
  busLocation, // { latitude, longitude, heading, speed }
  busInfo, // { busNumber, name, licensePlate }
  routeInfo, // { routeName, startPoint, endPoint, stops }
  height = '440px',
  onLocationPick = null,
}) {
  const [mapEngine, setMapEngine] = useState('leaflet') // default to 'leaflet' for guaranteed rendering
  const [googleAuthFailed, setGoogleAuthFailed] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [leafletReady, setLeafletReady] = useState(false)
  const [googleLoaded, setGoogleLoaded] = useState(false)

  // Leaflet refs
  const leafletContainerRef = useRef(null)
  const leafletMapRef = useRef(null)
  const leafletBusMarkerRef = useRef(null)
  const leafletStopMarkersRef = useRef([])
  const leafletPolylineRef = useRef(null)

  // Google Maps refs
  const googleContainerRef = useRef(null)
  const googleMapRef = useRef(null)
  const googleBusMarkerRef = useRef(null)
  const googleStopMarkersRef = useRef([])
  const googlePolylineRef = useRef(null)

  // 1. Listen for Google Maps Auth Failure (billing / unauthorized / not activated)
  useEffect(() => {
    const prevAuthFailure = window.gm_authFailure
    window.gm_authFailure = () => {
      console.warn('Google Maps API authentication failed. Auto-switching to OpenStreetMap engine.')
      setGoogleAuthFailed(true)
      setMapEngine('leaflet')
      if (typeof prevAuthFailure === 'function') prevAuthFailure()
    }

    return () => {
      window.gm_authFailure = prevAuthFailure
    }
  }, [])

  // 2. Dynamically load Leaflet assets
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true)
      return
    }

    // Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Leaflet JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => setLeafletLoaded(true)
      document.head.appendChild(script)
    } else {
      const existing = document.getElementById('leaflet-js')
      existing.addEventListener('load', () => setLeafletLoaded(true))
    }
  }, [])

  // 3. Dynamically load Google Maps SDK
  useEffect(() => {
    if (mapEngine !== 'google' || googleAuthFailed) return
    if (window.google?.maps) {
      setGoogleLoaded(true)
      return
    }

    if (!document.getElementById('google-maps-script')) {
      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`
      script.async = true
      script.defer = true
      script.onload = () => setGoogleLoaded(true)
      script.onerror = () => {
        setGoogleAuthFailed(true)
        setMapEngine('leaflet')
      }
      document.head.appendChild(script)
    } else {
      const existing = document.getElementById('google-maps-script')
      existing.addEventListener('load', () => setGoogleLoaded(true))
    }
  }, [mapEngine, googleAuthFailed])

  // Current Coordinates
  const currentLat = Number(busLocation?.latitude) || DEFAULT_CENTER.lat
  const currentLng = Number(busLocation?.longitude) || DEFAULT_CENTER.lng

  // -------------------------------------------------------------
  // LEAFLET ENGINE IMPLEMENTATION
  // -------------------------------------------------------------
  const initLeafletMap = useCallback(() => {
    if (!leafletLoaded || !window.L || !leafletContainerRef.current) return
    if (leafletMapRef.current) return

    try {
      const map = window.L.map(leafletContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 14,
        zoomControl: true,
      })

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      leafletMapRef.current = map
      setLeafletReady(true)

      if (onLocationPick) {
        map.on('click', (e) => {
          onLocationPick({
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
          })
        })
      }
    } catch (err) {
      console.error('Leaflet init error:', err)
    }
  }, [leafletLoaded, currentLat, currentLng, onLocationPick])

  useEffect(() => {
    if (mapEngine === 'leaflet') {
      initLeafletMap()
    }
  }, [mapEngine, initLeafletMap])

  // Update Leaflet Bus Marker & Route
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !leafletReady || !leafletMapRef.current || !window.L) return
    const map = leafletMapRef.current

    const busIconHtml = `
      <div style="
        background: #2563EB;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(37,99,235,0.5);
        font-size: 15px;
        animation: pulse 2s infinite;
      ">🚌</div>
    `

    const busIcon = window.L.divIcon({
      className: 'leaflet-bus-custom-pin',
      html: busIconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    const popupHtml = `
      <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
        <strong style="color: #0f172a; font-size: 13px;">🚌 ${busInfo?.name || 'Campus Bus'} (${busInfo?.busNumber || 'N/A'})</strong>
        <div style="color: #64748b; margin-top: 4px; line-height: 1.4;">
          Plate: <strong>${busInfo?.licensePlate || 'N/A'}</strong><br/>
          Est. Speed: <strong style="color: #2563eb;">${busLocation?.speed || 0} km/h</strong><br/>
          GPS: ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}
        </div>
      </div>
    `

    if (!leafletBusMarkerRef.current) {
      const marker = window.L.marker([currentLat, currentLng], { icon: busIcon })
        .addTo(map)
        .bindPopup(popupHtml)
      leafletBusMarkerRef.current = marker
    } else {
      leafletBusMarkerRef.current.setLatLng([currentLat, currentLng])
      leafletBusMarkerRef.current.setPopupContent(popupHtml)
    }

    map.panTo([currentLat, currentLng], { animate: true })

    // Render Stops and Polyline
    leafletStopMarkersRef.current.forEach((m) => map.removeLayer(m))
    leafletStopMarkersRef.current = []
    if (leafletPolylineRef.current) {
      map.removeLayer(leafletPolylineRef.current)
    }

    // Build stopsList using exact saved coordinates if available, otherwise fallback to offsets
    const hasExactOrigin = routeInfo?.startCoordinates?.lat != null && routeInfo?.startCoordinates?.lng != null
    const hasExactDest = routeInfo?.endCoordinates?.lat != null && routeInfo?.endCoordinates?.lng != null
    const savedStopCoords = Array.isArray(routeInfo?.stopCoordinates) ? routeInfo.stopCoordinates : []

    const originNode = {
      name: routeInfo?.startPoint || 'Origin Terminal',
      isTerminal: true,
      lat: hasExactOrigin ? Number(routeInfo.startCoordinates.lat) : currentLat + 0.012,
      lng: hasExactOrigin ? Number(routeInfo.startCoordinates.lng) : currentLng - 0.015,
      color: '#10B981',
      label: 'A',
    }

    const intermediateNodes = (
      savedStopCoords.length > 0
        ? savedStopCoords.map((s, idx) => ({
            name: s.name,
            isTerminal: false,
            lat: Number(s.lat),
            lng: Number(s.lng),
            color: '#F59E0B',
            label: `${idx + 1}`,
          }))
        : (routeInfo?.stops || []).map((stopName, idx) => ({
            name: stopName,
            isTerminal: false,
            lat: currentLat + 0.005 * (idx % 2 === 0 ? 1 : -1) * (idx + 1) * 0.6,
            lng: currentLng + 0.005 * (idx + 1) * (idx % 2 === 0 ? -1 : 1),
            color: '#F59E0B',
            label: `${idx + 1}`,
          }))
    )

    const destNode = {
      name: routeInfo?.endPoint || 'Destination Terminal',
      isTerminal: true,
      lat: hasExactDest ? Number(routeInfo.endCoordinates.lat) : currentLat - 0.012,
      lng: hasExactDest ? Number(routeInfo.endCoordinates.lng) : currentLng + 0.015,
      color: '#8B5CF6',
      label: 'B',
    }

    const stopsList = [originNode, ...intermediateNodes, destNode]

    const pathPoints = []
    stopsList.forEach((stop) => {
      const sLat = stop.lat
      const sLng = stop.lng
      pathPoints.push([sLat, sLng])

      const stopIcon = window.L.divIcon({
        className: 'leaflet-stop-pin',
        html: `
          <div style="
            background: ${stop.color};
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${stop.label}</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const stopMarker = window.L.marker([sLat, sLng], { icon: stopIcon })
        .addTo(map)
        .bindPopup(`<strong>${stop.name}</strong><br/><span style="font-size:11px; color:#64748b;">${stop.isTerminal ? 'Terminal' : 'Intermediate Stop'}</span>`)

      leafletStopMarkersRef.current.push(stopMarker)
    })

    if (pathPoints.length > 1) {
      const polyline = window.L.polyline(pathPoints, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.75,
        dashArray: '6, 6',
      }).addTo(map)
      leafletPolylineRef.current = polyline
    }
  }, [mapEngine, leafletReady, currentLat, currentLng, busInfo, busLocation, routeInfo])

  // -------------------------------------------------------------
  // GOOGLE MAPS ENGINE IMPLEMENTATION
  // -------------------------------------------------------------
  const initGoogleMap = useCallback(() => {
    if (!googleLoaded || !window.google?.maps || !googleContainerRef.current) return
    if (googleMapRef.current) return

    try {
      const map = new window.google.maps.Map(googleContainerRef.current, {
        center: { lat: currentLat, lng: currentLng },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
      googleMapRef.current = map

      if (onLocationPick) {
        map.addListener('click', (e) => {
          onLocationPick({
            latitude: e.latLng.lat(),
            longitude: e.latLng.lng(),
          })
        })
      }
    } catch (err) {
      console.error('Google Maps init error:', err)
      setGoogleAuthFailed(true)
      setMapEngine('leaflet')
    }
  }, [googleLoaded, currentLat, currentLng, onLocationPick])

  useEffect(() => {
    if (mapEngine === 'google' && !googleAuthFailed) {
      initGoogleMap()
    }
  }, [mapEngine, googleAuthFailed, initGoogleMap])

  // Update Google Maps Marker
  useEffect(() => {
    if (mapEngine !== 'google' || !googleMapRef.current || !window.google?.maps) return
    const map = googleMapRef.current
    const pos = { lat: currentLat, lng: currentLng }

    if (!googleBusMarkerRef.current) {
      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        title: busInfo?.name || 'Bus',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
      })
      googleBusMarkerRef.current = marker
    } else {
      googleBusMarkerRef.current.setPosition(pos)
    }
    map.panTo(pos)
  }, [mapEngine, currentLat, currentLng, busInfo])

  return (
    <div className="space-y-2">
      {/* Engine Switcher & Status Bar */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Layers className="h-3.5 w-3.5 text-blue-600" />
          <span>Map Provider:</span>
          <span className="font-bold text-slate-800">
            {mapEngine === 'leaflet' ? 'OpenStreetMap (100% Free & Active)' : 'Google Maps Platform'}
          </span>
          {googleAuthFailed && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              Google key unverified / billing required; using OpenStreetMap
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMapEngine('leaflet')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              mapEngine === 'leaflet'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🗺️ OpenStreetMap
          </button>
          <button
            type="button"
            onClick={() => setMapEngine('google')}
            disabled={googleAuthFailed}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              mapEngine === 'google'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'
            }`}
          >
            🌐 Google Maps
          </button>
        </div>
      </div>

      {/* Map Display Container */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-slate-100">
        {/* LEAFLET MAP CONTAINER */}
        <div
          ref={leafletContainerRef}
          style={{ height, display: mapEngine === 'leaflet' ? 'block' : 'none' }}
          className="w-full z-0"
        />

        {/* GOOGLE MAP CONTAINER */}
        <div
          ref={googleContainerRef}
          style={{ height, display: mapEngine === 'google' ? 'block' : 'none' }}
          className="w-full z-0"
        />
      </div>
    </div>
  )
}
