import catchAsync from '../../shared/catchAsync.js';
import sendResponse from '../../shared/sendResponse.js';
import TripService from './trip.service.js';

const startTrip = catchAsync(async (req, res) => {
  const driverId = req.user.id || req.user._id;
  const result = await TripService.startTrip(driverId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Trip started successfully! Live location sharing is now active.',
    data: result,
  });
});

const stopTrip = catchAsync(async (req, res) => {
  const driverId = req.user.id || req.user._id;
  const { id: tripId } = req.params;
  const { remarks } = req.body || {};
  const userRole = req.user.role || 'driver';

  const result = await TripService.stopTrip(driverId, tripId, remarks, userRole);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Trip stopped and completed successfully!',
    data: result,
  });
});

const updateTripLocation = catchAsync(async (req, res) => {
  const driverId = req.user.id || req.user._id;
  const { id: tripId } = req.params;
  const userRole = req.user.role || 'driver';

  const result = await TripService.updateTripLocation(driverId, tripId, req.body, userRole);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bus location updated successfully!',
    data: result,
  });
});

const getActiveTrip = catchAsync(async (req, res) => {
  const driverId = req.user.id || req.user._id;
  const result = await TripService.getActiveTripForDriver(driverId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result ? 'Active trip fetched successfully!' : 'No active trip in progress.',
    data: result,
  });
});

const getAllLiveTrips = catchAsync(async (req, res) => {
  const result = await TripService.getAllLiveTrips();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All live trips and bus locations retrieved successfully!',
    data: result,
  });
});

const getLiveBusMapFeed = catchAsync(async (req, res) => {
  const result = await TripService.getLiveBusMapFeed();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Live interactive bus map feed retrieved successfully!',
    data: result,
  });
});

const getTripHistory = catchAsync(async (req, res) => {
  const driverId = req.user.role === 'driver' ? (req.user.id || req.user._id) : null;
  const result = await TripService.getTripHistory(req.query, driverId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Trip history retrieved successfully!',
    data: result,
  });
});

const updateTripDelay = catchAsync(async (req, res) => {
  const { id: tripId } = req.params;
  const result = await TripService.updateTripDelay(tripId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.delayMinutes > 0
      ? `Trip marked delayed by ${result.delayMinutes} minutes.`
      : 'Trip delay cleared! Trip is marked on time.',
    data: result,
  });
});

export const TripController = {
  startTrip,
  stopTrip,
  updateTripLocation,
  updateTripDelay,
  getActiveTrip,
  getAllLiveTrips,
  getLiveBusMapFeed,
  getTripHistory,
};

export default TripController;
