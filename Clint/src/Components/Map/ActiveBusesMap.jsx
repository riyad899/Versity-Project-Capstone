import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Maximize2,
  LocateFixed,
  Layers,
  Route as RouteIcon,
  Activity,
  Compass,
} from 'lucide-react'
import {
  buildRouteNodes,
  calculateBearing,
  getCompassDirection,
  formatRelativeTime,
} from '@/lib/geoUtils'

const DEFAULT_CENTER = [23.8769, 90.3202] // Campus / DSC default fallback

const TILE_LAYERS = {
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
  clean: {
    label: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
  },
}

function buildBusMarkerHtml(item, isSelected, resolvedHeading) {
  const isOnTrip = item.tripStatus === 'on_trip'
  const speed = Math.round(Number(item.currentLocation?.speed) || 0)
  const isMoving = isOnTrip && (item.isMoving || speed > 1)
  const busNumber = item.bus?.busNumber || 'BUS'

  const bgGradient = isOnTrip
    ? isMoving
      ? 'linear-gradient(135deg, #059669 0%, #2563EB 100%)'
      : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
    : 'linear-gradient(135deg, #64748B 0%, #475569 100%)'

  const size = isSelected ? 40 : 34
  const ringBorder = isSelected ? '#FACC15' : '#FFFFFF'
  const ringWidth = isSelected ? 3.5 : 2.5

  const pulseRing = isOnTrip
    ? `<span style="
        position:absolute;
        inset:-7px;
        border-radius:9999px;
        border:2px solid ${isMoving ? 'rgba(16, 185, 129, 0.55)' : 'rgba(37, 99, 235, 0.45)'};
        background:${isMoving ? 'rgba(16, 185, 129, 0.14)' : 'rgba(37, 99, 235, 0.1)'};
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        pointer-events:none;
      "></span>`
    : ''

  const headingArrow = isOnTrip
    ? `<div style="
        position:absolute;
        top:50%;
        left:50%;
        width:${size + 18}px;
        height:${size + 18}px;
        transform:translate(-50%, -50%) rotate(${resolvedHeading}deg);
        pointer-events:none;
        transition:transform 0.4s ease-out;
      ">
        <div style="
          position:absolute;
          top:-3px;
          left:50%;
          transform:translateX(-50%);
          width:0;
          height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-bottom:10px solid ${isSelected ? '#EAB308' : '#059669'};
          filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));
        "></div>
      </div>`
    : ''

  const speedTag = isOnTrip
    ? isMoving
      ? `<span style="color:#34D399;margin-left:4px;">• ${speed} km/h</span>`
      : '<span style="color:#93C5FD;margin-left:4px;">• Live</span>'
    : '<span style="color:#CBD5E1;margin-left:4px;">• Idle</span>'

  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${pulseRing}
        ${headingArrow}
        <div style="
          position:relative;
          width:${size}px;
          height:${size}px;
          border-radius:9999px;
          background:${bgGradient};
          border:${ringWidth}px solid ${ringBorder};
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 6px 16px rgba(15, 23, 42, 0.35);
          font-size:${isSelected ? 17 : 15}px;
          color:#FFFFFF;
          z-index:2;
        ">🚌</div>
      </div>
      <div style="
        margin-top:4px;
        background:rgba(15, 23, 42, 0.92);
        color:#FFFFFF;
        padding:2px 7px;
        border-radius:9999px;
        font-family:system-ui, sans-serif;
        font-size:10px;
        font-weight:700;
        white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        border:1px solid rgba(255,255,255,0.2);
      ">
        #${busNumber}${speedTag}
      </div>
    </div>
  `
}

function buildBusPopupHtml(item, resolvedHeading) {
  const lat = Number(item.currentLocation?.latitude || 0)
  const lng = Number(item.currentLocation?.longitude || 0)
  const speed = Math.round(Number(item.currentLocation?.speed) || 0)
  const isOnTrip = item.tripStatus === 'on_trip'
  const dir = getCompassDirection(resolvedHeading)
  const updatedStr = formatRelativeTime(item.currentLocation?.updatedAt)

  return `
    <div style="font-family:system-ui, sans-serif;min-width:210px;padding:2px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <strong style="color:#0F172A;font-size:13px;">🚌 ${item.bus?.name || 'Campus Bus'} (#${item.bus?.busNumber || 'N/A'})</strong>
        <span style="
          font-size:10px;
          font-weight:700;
          padding:2px 7px;
          border-radius:9999px;
          background:${isOnTrip ? '#DCFCE7' : '#F1F5F9'};
          color:${isOnTrip ? '#166534' : '#475569'};
        ">${isOnTrip ? (speed > 1 ? 'MOVING' : 'ON TRIP') : 'STANDBY'}</span>
      </div>
      <div style="font-size:11px;color:#475569;line-height:1.55;">
        <div><strong>Route:</strong> ${item.route?.routeName || 'Unassigned'}</div>
        ${
          item.route
            ? `<div style="color:#64748B;">${item.route.startPoint} → ${item.route.endPoint}</div>`
            : ''
        }
        <div><strong>Speed:</strong> <span style="color:#2563EB;font-weight:700;">${speed} km/h</span> • <strong>Heading:</strong> ${dir} (${Math.round(resolvedHeading)}°)</div>
        <div><strong>Plate:</strong> ${item.bus?.licensePlate || 'N/A'}${item.driverName ? ` • <strong>Driver:</strong> ${item.driverName}` : ''}</div>
        <div style="color:#64748B;font-size:10px;margin-top:4px;border-top:1px solid #E2E8F0;padding-top:4px;">
          GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} • Updated ${updatedStr}
        </div>
      </div>
    </div>
  `
}

export default function ActiveBusesMap({
  buses = [],
  selectedBusId = 'all',
  onSelectBus,
  trafficSegments = [],
  selectedAlternative = null,
  height = '500px',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const tileLayerRef = useRef(null)

  // Map<busId, { marker, animId, lastLat, lastLng, lastHeading, sig }>
  const busMarkersRef = useRef(new Map())
  // Array of Leaflet trail layers
  const trailLayersRef = useRef([])
  // Array of Leaflet route/stop layers
  const routeLayersRef = useRef([])
  const hasInitialFitRef = useRef(false)
  const prevSelectedIdRef = useRef(selectedBusId)
  const onSelectBusRef = useRef(onSelectBus)
  onSelectBusRef.current = onSelectBus

  const [leafletReady, setLeafletReady] = useState(Boolean(typeof window !== 'undefined' && window.L))
  const [mapStyle, setMapStyle] = useState('street')
  const [followSelected, setFollowSelected] = useState(true)
  const [showTrails, setShowTrails] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)

  // Load Leaflet CSS & JS dynamically
  useEffect(() => {
    if (window.L) {
      setLeafletReady(true)
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
      script.onload = () => setLeafletReady(true)
      document.head.appendChild(script)
    } else {
      const existing = document.getElementById('leaflet-js')
      existing.addEventListener('load', () => setLeafletReady(true))
    }
  }, [])

  // Initialize map instance once
  useEffect(() => {
    if (!leafletReady || !window.L || !containerRef.current || mapRef.current) return

    const firstBus = buses[0]
    const initCenter =
      firstBus?.currentLocation?.latitude != null
        ? [Number(firstBus.currentLocation.latitude), Number(firstBus.currentLocation.longitude)]
        : DEFAULT_CENTER

    const map = window.L.map(containerRef.current, {
      center: initCenter,
      zoom: 13,
      zoomControl: true,
    })

    const layerCfg = TILE_LAYERS[mapStyle] || TILE_LAYERS.street
    tileLayerRef.current = window.L.tileLayer(layerCfg.url, {
      maxZoom: 19,
      attribution: layerCfg.attribution,
    }).addTo(map)

    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 150)

    return () => {
      busMarkersRef.current.forEach((entry) => {
        if (entry.animId) cancelAnimationFrame(entry.animId)
      })
      busMarkersRef.current.clear()
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      hasInitialFitRef.current = false
    }
  }, [leafletReady])

  // Switch tile style cleanly
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }
    const cfg = TILE_LAYERS[mapStyle] || TILE_LAYERS.street
    tileLayerRef.current = window.L.tileLayer(cfg.url, {
      maxZoom: 19,
      attribution: cfg.attribution,
    }).addTo(map)
  }, [mapStyle])

  // Fit bounds helper for all visible buses + their route coordinates
  const handleFitAllBuses = useCallback(() => {
    const map = mapRef.current
    if (!map || !window.L) return

    const points = []
    buses.forEach((item) => {
      if (item.currentLocation?.latitude != null && item.currentLocation?.longitude != null) {
        points.push([Number(item.currentLocation.latitude), Number(item.currentLocation.longitude)])
      }
      if (item.route) {
        buildRouteNodes(item.route).forEach((n) => points.push([n.lat, n.lng]))
      }
    })

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true })
    } else if (points.length > 1) {
      map.fitBounds(window.L.latLngBounds(points), { padding: [55, 55], maxZoom: 15 })
    } else {
      map.setView(DEFAULT_CENTER, 13, { animate: true })
    }
  }, [buses])

  // Animate marker smoothly between coordinates
  const animateMarkerTo = useCallback((entry, targetLat, targetLng, durationMs = 850) => {
    if (entry.animId) {
      cancelAnimationFrame(entry.animId)
      entry.animId = null
    }

    const startLatLng = entry.marker.getLatLng()
    const startLat = startLatLng.lat
    const startLng = startLatLng.lng
    const dLat = targetLat - startLat
    const dLng = targetLng - startLng

    // Skip animation if negligible or huge jump (> ~50km)
    if (Math.abs(dLat) < 0.000005 && Math.abs(dLng) < 0.000005) {
      return
    }
    if (Math.abs(dLat) > 0.5 || Math.abs(dLng) > 0.5) {
      entry.marker.setLatLng([targetLat, targetLng])
      return
    }

    const startTime = performance.now()
    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      entry.marker.setLatLng([startLat + dLat * eased, startLng + dLng * eased])
      if (progress < 1) {
        entry.animId = requestAnimationFrame(step)
      } else {
        entry.animId = null
      }
    }
    entry.animId = requestAnimationFrame(step)
  }, [])

  // Sync Bus Markers, Movement Trails, and Route Layers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.L) return

    const activeIds = new Set(buses.map((b) => b.id))

    // Remove stale markers
    for (const [id, entry] of busMarkersRef.current.entries()) {
      if (!activeIds.has(id)) {
        if (entry.animId) cancelAnimationFrame(entry.animId)
        map.removeLayer(entry.marker)
        busMarkersRef.current.delete(id)
      }
    }

    // Add or update active bus markers
    buses.forEach((item) => {
      const targetLat = Number(item.currentLocation?.latitude)
      const targetLng = Number(item.currentLocation?.longitude)
      if (Number.isNaN(targetLat) || Number.isNaN(targetLng)) return

      const isSelected = selectedBusId === item.id
      const existing = busMarkersRef.current.get(item.id)

      let resolvedHeading = Number(item.currentLocation?.heading) || 0
      if (!resolvedHeading && existing) {
        const movedEnough =
          Math.abs(targetLat - existing.lastLat) > 0.00002 ||
          Math.abs(targetLng - existing.lastLng) > 0.00002
        if (movedEnough) {
          resolvedHeading = calculateBearing(existing.lastLat, existing.lastLng, targetLat, targetLng)
        } else {
          resolvedHeading = existing.lastHeading || 0
        }
      } else if (!resolvedHeading && Array.isArray(item.locationHistory) && item.locationHistory.length >= 2) {
        const prevPt = item.locationHistory[item.locationHistory.length - 2]
        resolvedHeading = calculateBearing(prevPt.latitude, prevPt.longitude, targetLat, targetLng)
      }

      const speed = Math.round(Number(item.currentLocation?.speed) || 0)
      const sig = `${isSelected}-${item.tripStatus}-${item.isMoving}-${Math.round(resolvedHeading)}-${speed}-${item.bus?.busNumber}`

      const icon = window.L.divIcon({
        className: 'active-bus-marker-icon',
        html: buildBusMarkerHtml(item, isSelected, resolvedHeading),
        iconSize: [110, 64],
        iconAnchor: [55, 22],
      })

      const popupHtml = buildBusPopupHtml(item, resolvedHeading)

      if (!existing) {
        const marker = window.L.marker([targetLat, targetLng], {
          icon,
          zIndexOffset: isSelected ? 1000 : item.tripStatus === 'on_trip' ? 500 : 100,
        })
          .addTo(map)
          .bindPopup(popupHtml, { offset: [0, -14] })

        marker.on('click', () => {
          if (onSelectBusRef.current) onSelectBusRef.current(item.id)
        })

        busMarkersRef.current.set(item.id, {
          marker,
          animId: null,
          lastLat: targetLat,
          lastLng: targetLng,
          lastHeading: resolvedHeading,
          sig,
        })
      } else {
        animateMarkerTo(existing, targetLat, targetLng, 850)
        if (existing.sig !== sig) {
          existing.marker.setIcon(icon)
          existing.sig = sig
        }
        existing.marker.setZIndexOffset(isSelected ? 1000 : item.tripStatus === 'on_trip' ? 500 : 100)
        existing.marker.setPopupContent(popupHtml)
        existing.lastLat = targetLat
        existing.lastLng = targetLng
        existing.lastHeading = resolvedHeading
      }
    })

    // Clear and re-render movement trails
    trailLayersRef.current.forEach((layer) => map.removeLayer(layer))
    trailLayersRef.current = []

    if (showTrails) {
      buses.forEach((item) => {
        const isSelected = selectedBusId === item.id
        if (selectedBusId !== 'all' && !isSelected) return

        const historyPts = Array.isArray(item.locationHistory) ? item.locationHistory : []
        const coords = historyPts
          .filter((pt) => pt?.latitude != null && pt?.longitude != null)
          .map((pt) => [Number(pt.latitude), Number(pt.longitude)])

        if (item.currentLocation?.latitude != null && item.currentLocation?.longitude != null) {
          coords.push([Number(item.currentLocation.latitude), Number(item.currentLocation.longitude)])
        }

        if (coords.length >= 2) {
          const trailColor = isSelected ? '#10B981' : '#0EA5E9'
          const trailLine = window.L.polyline(coords, {
            color: trailColor,
            weight: isSelected ? 5 : 3.5,
            opacity: isSelected ? 0.9 : 0.7,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map)
          trailLayersRef.current.push(trailLine)

          // Start breadcrumb dot
          const startMarker = window.L.circleMarker(coords[0], {
            radius: 5,
            color: '#FFFFFF',
            weight: 2,
            fillColor: trailColor,
            fillOpacity: 1,
          })
            .bindPopup(
              `<strong>Trip Start Point</strong><br/><span style="font-size:11px;color:#64748B;">Bus #${item.bus?.busNumber || ''}</span>`
            )
            .addTo(map)
          trailLayersRef.current.push(startMarker)
        }
      })
    }

    // Clear and re-render route paths & stop pins
    routeLayersRef.current.forEach((layer) => map.removeLayer(layer))
    routeLayersRef.current = []

    if (showRoutes) {
      const renderedRouteIds = new Set()
      const targetBuses =
        selectedBusId !== 'all'
          ? buses.filter((b) => b.id === selectedBusId)
          : buses

      targetBuses.forEach((item) => {
        const route = item.route
        if (!route) return
        const routeKey = route._id || route.id || route.routeName
        if (renderedRouteIds.has(routeKey)) return
        renderedRouteIds.add(routeKey)

        const nodes = buildRouteNodes(route)
        if (nodes.length === 0) return

        const pathCoords = nodes.map((n) => [n.lat, n.lng])
        if (pathCoords.length > 1) {
          if (Array.isArray(trafficSegments) && trafficSegments.length > 0 && selectedBusId !== 'all') {
            const colorMap = { clear: '#10B981', moderate: '#F59E0B', heavy: '#EF4444' }
            trafficSegments.forEach((seg) => {
              if (Array.isArray(seg.coords) && seg.coords.length > 1) {
                const tLine = window.L.polyline(seg.coords, {
                  color: colorMap[seg.level] || '#3B82F6',
                  weight: 5,
                  opacity: 0.85,
                })
                  .bindPopup(`<strong>Traffic: ${seg.level.toUpperCase()}</strong>`)
                  .addTo(map)
                routeLayersRef.current.push(tLine)
              }
            })
          } else {
            const routeLine = window.L.polyline(pathCoords, {
              color: '#3B82F6',
              weight: selectedBusId !== 'all' ? 4 : 2.5,
              opacity: selectedBusId !== 'all' ? 0.7 : 0.45,
              dashArray: '7, 7',
            }).addTo(map)
            routeLayersRef.current.push(routeLine)
          }
        }

        if (selectedAlternative?.geometry?.length > 1 && selectedBusId !== 'all') {
          const altLine = window.L.polyline(selectedAlternative.geometry, {
            color: '#06B6D4',
            weight: 5,
            opacity: 0.95,
            dashArray: '10, 6',
          })
            .bindPopup(`<strong>Alternative: ${selectedAlternative.name}</strong>`)
            .addTo(map)
          routeLayersRef.current.push(altLine)
        }

        // Only draw detailed stop badges when focusing a bus or when few routes exist
        if (selectedBusId !== 'all' || renderedRouteIds.size <= 3) {
          nodes.forEach((node) => {
            const stopIcon = window.L.divIcon({
              className: 'route-stop-pin',
              html: `
                <div style="
                  background:${node.color};
                  color:#FFFFFF;
                  width:22px;
                  height:22px;
                  border-radius:9999px;
                  border:2px solid #FFFFFF;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:10px;
                  font-weight:800;
                  box-shadow:0 2px 6px rgba(0,0,0,0.3);
                ">${node.label}</div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            })
            const stopMarker = window.L.marker([node.lat, node.lng], { icon: stopIcon })
              .bindPopup(
                `<div style="font-family:system-ui,sans-serif;font-size:12px;">
                  <strong>${node.name}</strong><br/>
                  <span style="color:#64748B;font-size:11px;">${route.routeName} • ${
                    node.type === 'origin'
                      ? 'Origin Terminal'
                      : node.type === 'destination'
                      ? 'Destination Terminal'
                      : 'Bus Stop'
                  }</span>
                </div>`
              )
              .addTo(map)
            routeLayersRef.current.push(stopMarker)
          })
        }
      })
    }

    // Camera tracking
    const selectionChanged = prevSelectedIdRef.current !== selectedBusId
    prevSelectedIdRef.current = selectedBusId

    if (selectedBusId !== 'all' && followSelected) {
      const focused = buses.find((b) => b.id === selectedBusId)
      if (focused?.currentLocation?.latitude != null && focused?.currentLocation?.longitude != null) {
        map.panTo(
          [Number(focused.currentLocation.latitude), Number(focused.currentLocation.longitude)],
          { animate: true, duration: 0.7 }
        )
      }
    } else if ((!hasInitialFitRef.current || selectionChanged) && buses.length > 0) {
      hasInitialFitRef.current = true
      handleFitAllBuses()
    }
  }, [leafletReady, buses, selectedBusId, showTrails, showRoutes, followSelected, animateMarkerTo, handleFitAllBuses, trafficSegments, selectedAlternative])

  return (
    <div className="space-y-2.5">
      {/* Interactive Map Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleFitAllBuses}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 shadow-2xs transition-colors hover:border-blue-300 hover:text-blue-600 cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Fit All Buses
          </button>

          {selectedBusId !== 'all' && (
            <button
              type="button"
              onClick={() => setFollowSelected((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-semibold transition-all cursor-pointer ${
                followSelected
                  ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LocateFixed className="h-3.5 w-3.5" />
              Follow Bus
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTrails((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-semibold transition-all cursor-pointer ${
              showTrails
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Movement Trail
          </button>

          <button
            type="button"
            onClick={() => setShowRoutes((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-semibold transition-all cursor-pointer ${
              showRoutes
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <RouteIcon className="h-3.5 w-3.5" />
            Route & Stops
          </button>
        </div>

        {/* Tile Layer Style Selector */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
          <Layers className="ml-1.5 h-3.5 w-3.5 text-slate-400" />
          {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMapStyle(key)}
              className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                mapStyle === key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        <div ref={containerRef} style={{ height }} className="w-full z-0" />

        {!leafletReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 text-xs font-semibold text-slate-500">
            Loading interactive map tiles...
          </div>
        )}

        {/* Map Legend Overlay */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[400] hidden sm:flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/90 bg-white/92 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-md backdrop-blur-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200" />
            Moving / On Trip
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            Standby
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-emerald-500" />
            Movement Trail
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-blue-500" />
            Route Path
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <Compass className="h-3 w-3 text-emerald-600" />
            Arrow = Direction
          </span>
        </div>
      </div>
    </div>
  )
}
