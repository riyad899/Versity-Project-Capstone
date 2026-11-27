import AppError from '../../errorHelpers/appError.js';
import { Trip, Bus, RouteModel } from '../../../schema/index.js';

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

  const initialLat = payload.initialLatitude ?? 23.8103;
  const initialLng = payload.initialLongitude ?? 90.4125;

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

  let query = { _id: tripId, status: 'in_progress' };
  if (userRole !== 'admin' && userRole !== 'transportation-manager') {
    query.driver = driverId;
  }

  const trip = await Trip.findOne(query);
  if (!trip) {
    throw new AppError(404, 'Active trip not found or already completed! Start a trip before updating location.');
  }

  const updatedLocation = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    speed: Number(speed),
    heading: Number(heading),
    updatedAt: new Date(),
  };

  trip.currentLocation = updatedLocation;
  trip.locationHistory.push({
    latitude: Number(latitude),
    longitude: Number(longitude),
    speed: Number(speed),
    heading: Number(heading),
    timestamp: new Date(),
  });

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

  return liveTrips;
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
  getTripHistory,
};

export default TripService;
