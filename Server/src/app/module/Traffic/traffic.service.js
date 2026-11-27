import AppError from '../../errorHelpers/appError.js';
import { RouteModel, Trip } from '../../../schema/index.js';

// In-memory store for driver/manager live traffic incident reports (keyed by routeId)
const reportedTrafficStore = new Map();

/**
 * Haversine distance in kilometers between two lat/lng points
 */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Fetch real road routes & alternatives from OSRM (Open Source Routing Machine)
 */
const fetchOSRMRoutes = async (waypoints) => {
  if (!waypoints || waypoints.length < 2) return [];
  const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&alternatives=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (data?.code !== 'Ok' || !Array.isArray(data.routes)) return [];

    return data.routes.map((r) => ({
      distanceKm: Number((r.distance / 1000).toFixed(2)),
      durationMin: Math.max(1, Math.round(r.duration / 60)),
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      geometry: (r.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]),
    }));
  } catch {
    return [];
  }
};

/**
 * Compute traffic level based on live bus speed, reported incidents, and Dhaka peak-hour heuristics
 */
const computeTrafficCondition = (routeId, liveTrips = []) => {
  const now = new Date();
  const hour = now.getHours();

  // Check if a driver/manager explicitly reported traffic on this route within last 30 mins
  const report = reportedTrafficStore.get(String(routeId));
  const isReportFresh = report && Date.now() - report.timestamp < 30 * 60 * 1000;

  let level = 'clear';
  let congestionScore = 20;
  let avgSpeedKmh = 36;
  let source = 'Route Telemetry & Time-of-Day Model';

  // Peak campus/Dhaka traffic hours
  const isMorningPeak = hour >= 8 && hour <= 10;
  const isAfternoonPeak = hour >= 13 && hour <= 14;
  const isEveningPeak = hour >= 17 && hour <= 20;

  if (isMorningPeak || isEveningPeak) {
    level = 'heavy';
    congestionScore = 78;
    avgSpeedKmh = 14;
  } else if (isAfternoonPeak) {
    level = 'moderate';
    congestionScore = 52;
    avgSpeedKmh = 24;
  }

  // Factor in live bus speed if an active trip is running on this route
  const activeTripOnRoute = liveTrips.find(
    (t) => String(t.route?._id || t.route) === String(routeId)
  );
  if (activeTripOnRoute?.currentLocation?.speed != null) {
    const liveSpeed = Number(activeTripOnRoute.currentLocation.speed);
    if (liveSpeed > 0) {
      avgSpeedKmh = liveSpeed;
      if (liveSpeed < 15) {
        level = 'heavy';
        congestionScore = 85;
      } else if (liveSpeed < 28) {
        level = 'moderate';
        congestionScore = 55;
      } else {
        level = 'clear';
        congestionScore = 18;
      }
      source = `Live Bus GPS (${liveSpeed} km/h)`;
    }
  }

  // Override with explicit driver/manager report if present
  if (isReportFresh) {
    level = report.level;
    congestionScore = level === 'heavy' ? 88 : level === 'moderate' ? 56 : 15;
    avgSpeedKmh = level === 'heavy' ? 12 : level === 'moderate' ? 23 : 38;
    source = `Reported by ${report.reportedBy || 'Driver'}`;
  }

  return {
    level, // 'clear' | 'moderate' | 'heavy'
    congestionScore,
    avgSpeedKmh,
    source,
    note: isReportFresh ? report.note : '',
    updatedAt: isReportFresh ? new Date(report.timestamp) : now,
  };
};

const buildWaypointsFromRoute = (route) => {
  const waypoints = [];
  if (route.startCoordinates?.lat != null && route.startCoordinates?.lng != null) {
    waypoints.push({
      name: route.startPoint,
      lat: Number(route.startCoordinates.lat),
      lng: Number(route.startCoordinates.lng),
    });
  }
  if (Array.isArray(route.stopCoordinates)) {
    route.stopCoordinates.forEach((s) => {
      if (s?.lat != null && s?.lng != null) {
        waypoints.push({ name: s.name, lat: Number(s.lat), lng: Number(s.lng) });
      }
    });
  }
  if (route.endCoordinates?.lat != null && route.endCoordinates?.lng != null) {
    waypoints.push({
      name: route.endPoint,
      lat: Number(route.endCoordinates.lat),
      lng: Number(route.endCoordinates.lng),
    });
  }
  return waypoints;
};

const getRouteTrafficAnalysis = async (routeId) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  const liveTrips = await Trip.find({ status: 'in_progress' }).select('route currentLocation');
  const traffic = computeTrafficCondition(routeId, liveTrips);
  const waypoints = buildWaypointsFromRoute(route);

  // Compute primary route distance & road geometry via OSRM or fallback
  let primaryGeometry = waypoints.map((w) => [w.lat, w.lng]);
  let distanceKm = 0;
  let baseDurationMin = 15;
  let osrmAlternatives = [];

  if (waypoints.length >= 2) {
    const osrmResults = await fetchOSRMRoutes(waypoints);
    if (osrmResults.length > 0) {
      primaryGeometry = osrmResults[0].geometry;
      distanceKm = osrmResults[0].distanceKm;
      baseDurationMin = osrmResults[0].durationMin;
      osrmAlternatives = osrmResults.slice(1);
    } else {
      for (let i = 0; i < waypoints.length - 1; i++) {
        distanceKm += haversineKm(
          waypoints[i].lat,
          waypoints[i].lng,
          waypoints[i + 1].lat,
          waypoints[i + 1].lng
        );
      }
      distanceKm = Number(distanceKm.toFixed(2));
      baseDurationMin = Math.max(5, Math.round((distanceKm / 30) * 60));
    }

    // If OSRM didn't return alternatives with intermediate stops, query direct start -> end for bypass routes
    if (osrmAlternatives.length === 0 && waypoints.length > 2) {
      const directResults = await fetchOSRMRoutes([waypoints[0], waypoints[waypoints.length - 1]]);
      if (directResults.length > 0) {
        osrmAlternatives = directResults;
      }
    }
  }

  // Split primaryGeometry into colored traffic segments for map visualization
  const trafficSegments = [];
  if (primaryGeometry.length >= 2) {
    const third = Math.max(1, Math.floor(primaryGeometry.length / 3));
    const seg1 = primaryGeometry.slice(0, third + 1);
    const seg2 = primaryGeometry.slice(third, third * 2 + 1);
    const seg3 = primaryGeometry.slice(third * 2);

    if (traffic.level === 'heavy') {
      if (seg1.length >= 2) trafficSegments.push({ level: 'moderate', coords: seg1 });
      if (seg2.length >= 2) trafficSegments.push({ level: 'heavy', coords: seg2 });
      if (seg3.length >= 2) trafficSegments.push({ level: 'heavy', coords: seg3 });
    } else if (traffic.level === 'moderate') {
      if (seg1.length >= 2) trafficSegments.push({ level: 'clear', coords: seg1 });
      if (seg2.length >= 2) trafficSegments.push({ level: 'moderate', coords: seg2 });
      if (seg3.length >= 2) trafficSegments.push({ level: 'clear', coords: seg3 });
    } else {
      trafficSegments.push({ level: 'clear', coords: primaryGeometry });
    }
  }

  const delayMultiplier = traffic.level === 'heavy' ? 1.65 : traffic.level === 'moderate' ? 1.28 : 1.0;
  const estimatedDurationMin = Math.round(baseDurationMin * delayMultiplier);
  const estimatedDelayMin = Math.max(0, estimatedDurationMin - baseDurationMin);

  // Build Alternative Route Suggestions
  const alternativeRoutes = [];

  osrmAlternatives.forEach((alt, idx) => {
    const altMinutes = Math.max(3, Math.round(alt.durationMin * 1.05));
    const timeSaved = Math.max(2, estimatedDurationMin - altMinutes);
    alternativeRoutes.push({
      id: `osrm-alt-${idx + 1}`,
      name:
        idx === 0
          ? `Express Bypass (${route.startPoint} → ${route.endPoint})`
          : `Secondary Detour #${idx + 1}`,
      distanceKm: alt.distanceKm,
      estimatedMinutes: altMinutes,
      timeSavedMinutes: traffic.level === 'clear' ? 0 : timeSaved,
      trafficLevel: 'clear',
      reason:
        traffic.level === 'heavy'
          ? `Bypasses heavy congestion; saves ~${timeSaved} mins`
          : 'Direct low-traffic corridor with fewer stops',
      geometry: alt.geometry,
    });
  });

  // Also generate a geometric bypass alternative if OSRM returned none but route has waypoints
  if (alternativeRoutes.length === 0 && waypoints.length >= 2) {
    const start = waypoints[0];
    const end = waypoints[waypoints.length - 1];
    const midLat = (start.lat + end.lat) / 2 + 0.008;
    const midLng = (start.lng + end.lng) / 2 - 0.008;
    const bypassDist = Number(
      (haversineKm(start.lat, start.lng, midLat, midLng) + haversineKm(midLat, midLng, end.lat, end.lng)).toFixed(2)
    );
    const altMinutes = Math.max(4, Math.round((bypassDist / 34) * 60));
    const timeSaved = Math.max(3, estimatedDurationMin - altMinutes);

    alternativeRoutes.push({
      id: 'campus-bypass-1',
      name: `Outer Ring Bypass (${route.startPoint} → ${route.endPoint})`,
      distanceKm: bypassDist,
      estimatedMinutes: altMinutes,
      timeSavedMinutes: traffic.level === 'clear' ? 0 : timeSaved,
      trafficLevel: 'clear',
      reason:
        traffic.level === 'heavy'
          ? `Avoids main corridor congestion; saves ~${timeSaved} mins`
          : 'Alternative low-congestion bypass corridor',
      geometry: [
        [start.lat, start.lng],
        [midLat, midLng],
        [end.lat, end.lng],
      ],
    });
  }

  // Also check other active routes in DB as potential alternative campus routes
  const otherRoutes = await RouteModel.find({
    _id: { $ne: routeId },
    status: 'active',
  }).limit(3);

  otherRoutes.forEach((other) => {
    const otherWaypoints = buildWaypointsFromRoute(other);
    if (otherWaypoints.length >= 2) {
      const otherTraffic = computeTrafficCondition(other._id, liveTrips);
      if (otherTraffic.level !== 'heavy') {
        alternativeRoutes.push({
          id: `db-route-${other._id}`,
          name: `Campus Route: ${other.routeName}`,
          distanceKm: distanceKm || 8.5,
          estimatedMinutes: Math.max(5, Math.round(estimatedDurationMin * 0.85)),
          timeSavedMinutes: traffic.level === 'clear' ? 0 : Math.max(2, Math.round(estimatedDelayMin * 0.6)),
          trafficLevel: otherTraffic.level,
          reason: `Active alternative corridor (${other.startPoint} → ${other.endPoint})`,
          geometry: otherWaypoints.map((w) => [w.lat, w.lng]),
        });
      }
    }
  });

  return {
    routeId: route._id,
    routeName: route.routeName,
    startPoint: route.startPoint,
    endPoint: route.endPoint,
    distanceKm,
    baseDurationMin,
    estimatedDurationMin,
    estimatedDelayMin,
    traffic,
    shouldSuggestAlternative: traffic.level === 'heavy' || traffic.level === 'moderate',
    trafficSegments,
    alternativeRoutes,
  };
};

const reportTrafficCondition = async (routeId, { level, note = '' }, reporterName = 'Driver') => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  reportedTrafficStore.set(String(routeId), {
    level,
    note,
    reportedBy: reporterName,
    timestamp: Date.now(),
  });

  return await getRouteTrafficAnalysis(routeId);
};

const getTrafficOverview = async () => {
  const routes = await RouteModel.find({ status: 'active' }).sort({ createdAt: -1 });
  const liveTrips = await Trip.find({ status: 'in_progress' }).select('route currentLocation');

  return routes.map((r) => {
    const traffic = computeTrafficCondition(r._id, liveTrips);
    return {
      routeId: r._id,
      routeName: r.routeName,
      startPoint: r.startPoint,
      endPoint: r.endPoint,
      traffic,
      needsAlternative: traffic.level === 'heavy' || traffic.level === 'moderate',
    };
  });
};

export const TrafficService = {
  getRouteTrafficAnalysis,
  reportTrafficCondition,
  getTrafficOverview,
};

export default TrafficService;
