const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI

export function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null ||
    Number.isNaN(Number(lat1)) ||
    Number.isNaN(Number(lng1)) ||
    Number.isNaN(Number(lat2)) ||
    Number.isNaN(Number(lng2))
  ) {
    return 0
  }

  const R = 6371
  const dLat = toRad(Number(lat2) - Number(lat1))
  const dLng = toRad(Number(lng2) - Number(lng1))
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(lat1))) *
      Math.cos(toRad(Number(lat2))) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = toRad(Number(lng2) - Number(lng1))
  const y = Math.sin(dLng) * Math.cos(toRad(Number(lat2)))
  const x =
    Math.cos(toRad(Number(lat1))) * Math.sin(toRad(Number(lat2))) -
    Math.sin(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) * Math.cos(dLng)
  return Math.round(((toDeg(Math.atan2(y, x)) + 360) % 360) * 10) / 10
}

export function getCompassDirection(heading = 0) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const normalized = ((Number(heading) % 360) + 360) % 360
  return dirs[Math.round(normalized / 45) % 8]
}

export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Just now'
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(dateInput).getTime()) / 1000))
  if (diffSec < 5) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h ago`
}

export function formatDuration(startTime) {
  if (!startTime) return '00:00'
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000))
  const hrs = Math.floor(diffSec / 3600)
  const mins = Math.floor((diffSec % 3600) / 60)
  const secs = diffSec % 60
  if (hrs > 0) {
    return `${hrs}h ${String(mins).padStart(2, '0')}m`
  }
  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
}

export function buildRouteNodes(route) {
  if (!route) return []
  const nodes = []

  if (route.startCoordinates?.lat != null && route.startCoordinates?.lng != null) {
    nodes.push({
      key: 'origin',
      name: route.startPoint || 'Origin Terminal',
      lat: Number(route.startCoordinates.lat),
      lng: Number(route.startCoordinates.lng),
      type: 'origin',
      label: 'A',
      color: '#10B981',
    })
  }

  const stopCoords = Array.isArray(route.stopCoordinates) ? route.stopCoordinates : []
  stopCoords.forEach((s, idx) => {
    if (s?.lat != null && s?.lng != null) {
      nodes.push({
        key: `stop-${idx}`,
        name: s.name || `Stop ${idx + 1}`,
        lat: Number(s.lat),
        lng: Number(s.lng),
        type: 'stop',
        label: `${idx + 1}`,
        color: '#F59E0B',
      })
    }
  })

  if (route.endCoordinates?.lat != null && route.endCoordinates?.lng != null) {
    nodes.push({
      key: 'destination',
      name: route.endPoint || 'Destination Terminal',
      lat: Number(route.endCoordinates.lat),
      lng: Number(route.endCoordinates.lng),
      type: 'destination',
      label: 'B',
      color: '#8B5CF6',
    })
  }

  return nodes
}

export function findNearestRouteStop(location, route) {
  if (!location || location.latitude == null || location.longitude == null) return null
  const nodes = buildRouteNodes(route)
  if (nodes.length === 0) return null

  let nearest = null
  let minKm = Infinity

  nodes.forEach((node, idx) => {
    const dist = calculateDistanceKm(location.latitude, location.longitude, node.lat, node.lng)
    if (dist < minKm) {
      minKm = dist
      nearest = { ...node, index: idx, distanceKm: Math.round(dist * 100) / 100 }
    }
  })

  const dest = nodes[nodes.length - 1]
  const distToDestKm = dest
    ? Math.round(calculateDistanceKm(location.latitude, location.longitude, dest.lat, dest.lng) * 100) / 100
    : null

  const speedKmh = Number(location.speed) > 2 ? Number(location.speed) : 25
  const etaMinutes = distToDestKm != null ? Math.max(1, Math.round((distToDestKm / speedKmh) * 60)) : null

  return {
    nearest,
    distToDestKm,
    etaMinutes,
    nodesCount: nodes.length,
  }
}
