import AppError from '../../errorHelpers/appError.js';
import { RouteModel, Bus } from '../../../schema/index.js';

const getAllRoutesWithStopsFromDB = async () => {
  const routes = await RouteModel.find().populate('createdBy', 'name email role').sort({ createdAt: -1 });

  const routeIds = routes.map((r) => r._id);
  const buses = await Bus.find({ assignedRoute: { $in: routeIds } })
    .populate('assignedDriver', 'name email image role')
    .select('busNumber name licensePlate capacity status assignedRoute assignedDriver');

  const busMap = {};
  buses.forEach((b) => {
    if (b.assignedRoute) {
      const rid = b.assignedRoute.toString();
      if (!busMap[rid]) busMap[rid] = [];
      busMap[rid].push(b);
    }
  });

  return routes.map((route) => {
    const stopsList = Array.isArray(route.stops) ? route.stops : [];
    return {
      ...route.toObject(),
      initialDestination: route.startPoint,
      lastDestination: route.endPoint,
      totalStopsCount: stopsList.length,
      fullJourneySequence: [route.startPoint, ...stopsList, route.endPoint],
      assignedBuses: busMap[route._id.toString()] || [],
    };
  });
};

const getRouteStopsByIdFromDB = async (routeId) => {
  const route = await RouteModel.findById(routeId).populate('createdBy', 'name email role');
  if (!route) {
    throw new AppError(404, 'Route not found');
  }
  const assignedBuses = await Bus.find({ assignedRoute: routeId }).select('busNumber name licensePlate capacity status');

  const stopsList = Array.isArray(route.stops) ? route.stops : [];
  return {
    ...route.toObject(),
    initialDestination: route.startPoint,
    lastDestination: route.endPoint,
    totalStopsCount: stopsList.length,
    fullJourneySequence: [route.startPoint, ...stopsList, route.endPoint],
    assignedBuses,
  };
};

const addStopToRouteInDB = async (routeId, stopName, lat = null, lng = null) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  const cleanStop = stopName.trim();
  const currentStops = Array.isArray(route.stops) ? [...route.stops] : [];

  if (currentStops.some((s) => s.toLowerCase() === cleanStop.toLowerCase())) {
    throw new AppError(400, `Stop "${cleanStop}" is already associated with this route`);
  }

  currentStops.push(cleanStop);
  route.stops = currentStops;

  // Keep stopCoordinates in sync
  const currentStopCoords = Array.isArray(route.stopCoordinates) ? [...route.stopCoordinates] : [];
  if (lat != null && lng != null) {
    currentStopCoords.push({ name: cleanStop, lat: Number(lat), lng: Number(lng) });
  } else {
    const baseLat = route.startCoordinates?.lat ?? 23.8103;
    const baseLng = route.startCoordinates?.lng ?? 90.4125;
    currentStopCoords.push({
      name: cleanStop,
      lat: Number((baseLat + 0.002 * currentStops.length).toFixed(6)),
      lng: Number((baseLng + 0.002 * currentStops.length).toFixed(6)),
    });
  }
  route.stopCoordinates = currentStopCoords;

  await route.save();
  return route;
};

const updateStopInRouteInDB = async (routeId, oldStopName, newStopName, lat = null, lng = null) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  const cleanOld = oldStopName.trim();
  const cleanNew = newStopName.trim();
  const currentStops = Array.isArray(route.stops) ? [...route.stops] : [];

  const index = currentStops.findIndex((s) => s.toLowerCase() === cleanOld.toLowerCase());
  if (index === -1) {
    throw new AppError(404, `Stop "${cleanOld}" not found on this route`);
  }

  currentStops[index] = cleanNew;
  route.stops = currentStops;

  // Sync stopCoordinates
  const currentStopCoords = Array.isArray(route.stopCoordinates) ? [...route.stopCoordinates] : [];
  const coordIndex = currentStopCoords.findIndex((s) => s.name?.toLowerCase() === cleanOld.toLowerCase());
  if (coordIndex !== -1) {
    currentStopCoords[coordIndex].name = cleanNew;
    if (lat != null && lng != null) {
      currentStopCoords[coordIndex].lat = Number(lat);
      currentStopCoords[coordIndex].lng = Number(lng);
    }
    route.stopCoordinates = currentStopCoords;
  }

  await route.save();
  return route;
};

const removeStopFromRouteInDB = async (routeId, stopName) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  const cleanStop = stopName.trim();
  const currentStops = Array.isArray(route.stops) ? [...route.stops] : [];

  const updatedStops = currentStops.filter((s) => s.toLowerCase() !== cleanStop.toLowerCase());
  if (updatedStops.length === currentStops.length) {
    throw new AppError(404, `Stop "${cleanStop}" was not present in this route`);
  }

  route.stops = updatedStops;
  if (Array.isArray(route.stopCoordinates)) {
    route.stopCoordinates = route.stopCoordinates.filter(
      (s) => s.name?.toLowerCase() !== cleanStop.toLowerCase()
    );
  }
  await route.save();
  return route;
};

const updateAllStopsInRouteInDB = async (routeId, stopsArray) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  const cleanStops = stopsArray.map((s) => s.trim()).filter(Boolean);
  route.stops = cleanStops;

  // Reorder stopCoordinates to match cleanStops
  if (Array.isArray(route.stopCoordinates) && route.stopCoordinates.length > 0) {
    const reorderedCoords = [];
    cleanStops.forEach((name, idx) => {
      const match = route.stopCoordinates.find((c) => c.name?.toLowerCase() === name.toLowerCase());
      if (match) {
        reorderedCoords.push(match);
      } else {
        const baseLat = route.startCoordinates?.lat ?? 23.8103;
        const baseLng = route.startCoordinates?.lng ?? 90.4125;
        reorderedCoords.push({
          name,
          lat: Number((baseLat + 0.002 * (idx + 1)).toFixed(6)),
          lng: Number((baseLng + 0.002 * (idx + 1)).toFixed(6)),
        });
      }
    });
    route.stopCoordinates = reorderedCoords;
  }

  await route.save();
  return route;
};

const updateRouteEndpointsInDB = async (routeId, startPoint, endPoint, startCoordinates = null, endCoordinates = null) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  route.startPoint = startPoint.trim();
  route.endPoint = endPoint.trim();
  if (startCoordinates && startCoordinates.lat != null && startCoordinates.lng != null) {
    route.startCoordinates = { lat: Number(startCoordinates.lat), lng: Number(startCoordinates.lng) };
  }
  if (endCoordinates && endCoordinates.lat != null && endCoordinates.lng != null) {
    route.endCoordinates = { lat: Number(endCoordinates.lat), lng: Number(endCoordinates.lng) };
  }
  await route.save();
  return route;
};

export const StopAssociatedService = {
  getAllRoutesWithStopsFromDB,
  getRouteStopsByIdFromDB,
  addStopToRouteInDB,
  updateStopInRouteInDB,
  removeStopFromRouteInDB,
  updateAllStopsInRouteInDB,
  updateRouteEndpointsInDB,
};

export default StopAssociatedService;
