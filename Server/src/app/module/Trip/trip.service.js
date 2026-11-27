import AppError from '../../errorHelpers/appError.js';
import { Trip, Bus, RouteModel } from '../../../schema/index.js';

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null ||
    Number.isNaN(lat1) ||
    Number.isNaN(lng1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lng2)
  ) {
    return 0;
  }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return Math.round(((toDeg(Math.atan2(y, x)) + 360) % 360) * 10) / 10;
};

const calculatePathDistanceKm = (history = []) => {
  if (!Array.isArray(history) || history.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < history.length; i += 1) {
    total += calculateDistanceKm(
      Number(history[i - 1].latitude),
      Number(history[i - 1].longitude),
      Number(history[i].latitude),
      Number(history[i].longitude)
    );
  }
  return Math.round(total * 100) / 100;
};

const startTrip = async (driverId, payload) => {
  let bus = null;

  if (payload.busId) {
    bus = await Bus.findById(payload.busId);
  } else {
    bus = await Bus.findOne({ assignedDriver: driverId });
  }

  if (!bus) {
    throw new AppError(
      404,
      'No bus found for this driver! Please ensure a transportation manager has assigned a bus to your account.'
    );
  }

  // Verify bus has an assigned route
  const routeId = payload.routeId || bus.assignedRoute;
  if (!routeId) {
    throw new AppError(
      400,
      `Bus "${bus.name}" (#${bus.busNumber}) does not have an assigned route! Please assign a route before starting a trip.`
    );
  }

  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Assigned route does not exist!');
  }

  // Check if driver or bus already has an active trip in progress
  const existingTrip = await Trip.findOne({
    $or: [{ driver: driverId }, { bus: bus._id }],
    status: 'in_progress',
  }).populate('bus route driver');

  if (existingTrip) {
    throw new AppError(
      400,
      `An active trip is already in progress for Bus "${bus.name}"! Please stop the current trip before starting a new one.`
    );
  }

  const routeStartLat = route.startCoordinates?.lat;
  const routeStartLng = route.startCoordinates?.lng;
  const initialLat = payload.initialLatitude ?? routeStartLat ?? 23.8103;
  const initialLng = payload.initialLongitude ?? routeStartLng ?? 90.4125;

  const newTrip = await Trip.create({
    bus: bus._id,
    driver: driverId,
    route: route._id,
    status: 'in_progress',
    startTime: new Date(),
    currentLocation: {
      latitude: initialLat,
      longitude: initialLng,
      heading: 0,
      speed: 0,
      updatedAt: new Date(),
    },
    locationHistory: [
      {
        latitude: initialLat,
        longitude: initialLng,
        heading: 0,
        speed: 0,
        timestamp: new Date(),
      },
    ],
    remarks: payload.remarks || 'Trip started',
  });

  // Update bus status
  await Bus.findByIdAndUpdate(bus._id, {
    tripStatus: 'on_trip',
    currentTrip: newTrip._id,
    currentLocation: {
      latitude: initialLat,
      longitude: initialLng,
      heading: 0,
      speed: 0,
      updatedAt: new Date(),
    },
  });

  const populatedTrip = await Trip.findById(newTrip._id)
    .populate('bus', 'busNumber name licensePlate capacity status')
    .populate('route', 'routeName startPoint startCoordinates endPoint endCoordinates stops stopCoordinates')
    .populate('driver', 'name email role');

  return populatedTrip;
};

const stopTrip = async (driverId, tripId, remarks = '', userRole = 'driver') => {
  let query = { _id: tripId, status: 'in_progress' };
  if (userRole !== 'admin' && userRole !== 'transportation-manager') {
    query.driver = driverId;
  }

  const trip = await Trip.findOne(query);
  if (!trip) {
    throw new AppError(404, 'Active trip not found or already completed!');
  }

  trip.status = 'completed';
  trip.endTime = new Date();
  if (remarks) {
    trip.remarks = remarks;
  }
  await trip.save();

  // Reset bus state
  await Bus.findByIdAndUpdate(trip.bus, {
    tripStatus: 'idle',
    currentTrip: null,
  });

  const populatedTrip = await Trip.findById(trip._id)
    .populate('bus', 'busNumber name licensePlate')
    .populate('route', 'routeName startPoint endPoint stops')
    .populate('driver', 'name email');

  return populatedTrip;
};

const updateTripLocation = async (driverId, tripId, locationData, userRole = 'driver') => {
  const { latitude, longitude, speed = 0, heading = 0 } = locationData;
  const newLat = Number(latitude);
  const newLng = Number(longitude);

  let query = { _id: tripId, status: 'in_progress' };
  if (userRole !== 'admin' && userRole !== 'transportation-manager') {
    query.driver = driverId;
  }

  const trip = await Trip.findOne(query);
  if (!trip) {
    throw new AppError(404, 'Active trip not found or already completed! Start a trip before updating location.');
  }

  const prevLoc = trip.currentLocation;
  const now = new Date();
  let resolvedHeading = Number(heading) || 0;
  let resolvedSpeed = Number(speed) || 0;

  if (prevLoc && prevLoc.latitude != null && prevLoc.longitude != null) {
    const distKm = calculateDistanceKm(prevLoc.latitude, prevLoc.longitude, newLat, newLng);
    if (distKm > 0.002) {
      if (!resolvedHeading) {
        resolvedHeading = calculateBearing(prevLoc.latitude, prevLoc.longitude, newLat, newLng);
      }
      if (!resolvedSpeed && prevLoc.updatedAt) {
        const diffSec = (now.getTime() - new Date(prevLoc.updatedAt).getTime()) / 1000;
        if (diffSec >= 0.5 && diffSec <= 120) {
          const estKmh = Math.round(distKm / (diffSec / 3600));
          if (estKmh > 0 && estKmh <= 110) {
            resolvedSpeed = estKmh;
          }
        }
      }
    } else if (!resolvedHeading && prevLoc.heading) {
      resolvedHeading = prevLoc.heading;
    }
  }

  const updatedLocation = {
    latitude: newLat,
    longitude: newLng,
    speed: resolvedSpeed,
    heading: resolvedHeading,
    updatedAt: now,
  };

  trip.currentLocation = updatedLocation;
  trip.locationHistory.push({
    latitude: newLat,
    longitude: newLng,
    speed: resolvedSpeed,
    heading: resolvedHeading,
    timestamp: now,
  });

  if (trip.locationHistory.length > 300) {
    trip.locationHistory = trip.locationHistory.slice(-300);
  }

  await trip.save();

  // Sync with Bus model
  await Bus.findByIdAndUpdate(trip.bus, {
    currentLocation: updatedLocation,
  });

  return {
    tripId: trip._id,
    currentLocation: updatedLocation,
    status: trip.status,
  };
};

const getActiveTripForDriver = async (driverId) => {
  const trip = await Trip.findOne({ driver: driverId, status: 'in_progress' })
    .populate('bus', 'busNumber name licensePlate capacity status tripStatus')
    .populate('route', 'routeName startPoint startCoordinates endPoint endCoordinates stops stopCoordinates scheduleTimes')
    .populate('driver', 'name email role');

  return trip;
};

const getAllLiveTrips = async () => {
  const liveTrips = await Trip.find({ status: 'in_progress' })
    .populate('bus', 'busNumber name licensePlate capacity status tripStatus')
    .populate('route', 'routeName startPoint startCoordinates endPoint endCoordinates stops stopCoordinates scheduleTimes')
    .populate('driver', 'name email role')
    .sort({ updatedAt: -1 });

  return liveTrips.map((t) => {
    const obj = t.toObject();
    const recentHistory = Array.isArray(obj.locationHistory) ? obj.locationHistory.slice(-80) : [];
    return {
      ...obj,
      locationHistory: recentHistory,
      distanceTraveledKm: calculatePathDistanceKm(recentHistory),
    };
  });
};

const getLiveBusMapFeed = async () => {
  const [liveTrips, activeFleetBuses, activeRoutes] = await Promise.all([
    Trip.find({ status: 'in_progress' })
      .populate('bus', 'busNumber name licensePlate capacity status tripStatus currentLocation')
      .populate('route', 'routeName startPoint startCoordinates endPoint endCoordinates stops stopCoordinates scheduleTimes')
      .populate('driver', 'name')
      .sort({ updatedAt: -1 }),
    Bus.find({ status: 'active' })
      .populate('assignedRoute', 'routeName startPoint startCoordinates endPoint endCoordinates stops stopCoordinates scheduleTimes')
      .populate('assignedDriver', 'name')
      .sort({ busNumber: 1 }),
    RouteModel.find({ status: 'active' })
      .select('routeName startPoint startCoordinates endPoint endCoordinates stops stopCoordinates scheduleTimes')
      .sort({ routeName: 1 }),
  ]);

  const nowMs = Date.now();
  const activeTripBusIds = new Set();
  const mappedLiveTrips = [];

  for (const tripDoc of liveTrips) {
    const trip = tripDoc.toObject();
    if (!trip.bus?._id) continue;

    const busIdStr = trip.bus._id.toString();
    activeTripBusIds.add(busIdStr);

    const recentHistory = Array.isArray(trip.locationHistory) ? trip.locationHistory.slice(-80) : [];
    const lastUpdatedMs = trip.currentLocation?.updatedAt
      ? new Date(trip.currentLocation.updatedAt).getTime()
      : nowMs;
    const isFresh = nowMs - lastUpdatedMs < 120000;
    const isMoving = (Number(trip.currentLocation?.speed) || 0) > 1 && isFresh;

    mappedLiveTrips.push({
      id: busIdStr,
      tripId: trip._id.toString(),
      tripStatus: 'on_trip',
      isMoving,
      startTime: trip.startTime,
      remarks: trip.remarks || '',
      distanceTraveledKm: calculatePathDistanceKm(recentHistory),
      currentLocation: trip.currentLocation,
      locationHistory: recentHistory,
      bus: {
        _id: busIdStr,
        busNumber: trip.bus.busNumber,
        name: trip.bus.name,
        licensePlate: trip.bus.licensePlate,
        capacity: trip.bus.capacity,
        status: trip.bus.status,
        tripStatus: 'on_trip',
      },
      route: trip.route || null,
      driverName: trip.driver?.name || 'Assigned Driver',
    });
  }

  const mappedStandbyBuses = [];
  for (const busDoc of activeFleetBuses) {
    const bus = busDoc.toObject();
    const busIdStr = bus._id.toString();
    if (activeTripBusIds.has(busIdStr)) continue;

    const hasCustomLocation =
      bus.currentLocation?.latitude != null &&
      bus.currentLocation?.longitude != null &&
      !(
        Math.abs(bus.currentLocation.latitude - 23.8103) < 0.0001 &&
        Math.abs(bus.currentLocation.longitude - 90.4125) < 0.0001
      );

    const fallbackStart = bus.assignedRoute?.startCoordinates;
    const resolvedLoc = hasCustomLocation
      ? bus.currentLocation
      : fallbackStart?.lat != null && fallbackStart?.lng != null
      ? {
          latitude: Number(fallbackStart.lat),
          longitude: Number(fallbackStart.lng),
          heading: 0,
          speed: 0,
          updatedAt: bus.updatedAt || nowMs,
        }
      : {
          latitude: Number(bus.currentLocation?.latitude ?? 23.8103),
          longitude: Number(bus.currentLocation?.longitude ?? 90.4125),
          heading: 0,
          speed: 0,
          updatedAt: bus.currentLocation?.updatedAt || bus.updatedAt || nowMs,
        };

    mappedStandbyBuses.push({
      id: busIdStr,
      tripId: null,
      tripStatus: 'idle',
      isMoving: false,
      startTime: null,
      remarks: '',
      distanceTraveledKm: 0,
      currentLocation: resolvedLoc,
      locationHistory: [],
      bus: {
        _id: busIdStr,
        busNumber: bus.busNumber,
        name: bus.name,
        licensePlate: bus.licensePlate,
        capacity: bus.capacity,
        status: bus.status,
        tripStatus: 'idle',
      },
      route: bus.assignedRoute || null,
      driverName: bus.assignedDriver?.name || null,
    });
  }

  return {
    liveTripsCount: mappedLiveTrips.length,
    standbyBusesCount: mappedStandbyBuses.length,
    activeBusesCount: mappedLiveTrips.length + mappedStandbyBuses.length,
    buses: [...mappedLiveTrips, ...mappedStandbyBuses],
    routes: activeRoutes,
    serverTime: new Date().toISOString(),
  };
};

const getTripHistory = async (query = {}, driverId = null) => {
  const filter = {};
  if (driverId) {
    filter.driver = driverId;
  }
  if (query.busId) {
    filter.bus = query.busId;
  }
  if (query.routeId) {
    filter.route = query.routeId;
  }
  if (query.status) {
    filter.status = query.status;
  }

  const trips = await Trip.find(filter)
    .populate('bus', 'busNumber name licensePlate')
    .populate('route', 'routeName startPoint endPoint')
    .populate('driver', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);

  return trips;
};

export const TripService = {
  startTrip,
  stopTrip,
  updateTripLocation,
  getActiveTripForDriver,
  getAllLiveTrips,
  getLiveBusMapFeed,
  getTripHistory,
};

export default TripService;
