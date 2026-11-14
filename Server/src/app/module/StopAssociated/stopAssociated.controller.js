import catchAsync from '../../shared/catchAsync.js';
import sendResponse from '../../shared/sendResponse.js';
import StopAssociatedService from './stopAssociated.service.js';

const getAllRoutesWithStops = catchAsync(async (req, res) => {
  const result = await StopAssociatedService.getAllRoutesWithStopsFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Routes with stop associations retrieved successfully',
    data: result,
  });
});

const getRouteStopsById = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const result = await StopAssociatedService.getRouteStopsByIdFromDB(routeId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Route stop details retrieved successfully',
    data: result,
  });
});

const addStopToRoute = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const { stopName } = req.body;
  const result = await StopAssociatedService.addStopToRouteInDB(routeId, stopName);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Stop "${stopName}" added successfully to route`,
    data: result,
  });
});

const updateStopInRoute = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const { oldStopName, newStopName } = req.body;
  const result = await StopAssociatedService.updateStopInRouteInDB(routeId, oldStopName, newStopName);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Stop updated successfully`,
    data: result,
  });
});

const removeStopFromRoute = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const stopName = req.params.stopName || req.body?.stopName || req.query?.stopName;
  const result = await StopAssociatedService.removeStopFromRouteInDB(routeId, stopName);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Stop "${stopName}" removed successfully from route`,
    data: result,
  });
});

const updateAllStopsInRoute = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const { stops } = req.body;
  const result = await StopAssociatedService.updateAllStopsInRouteInDB(routeId, stops);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Route stops updated successfully',
    data: result,
  });
});

const updateRouteEndpoints = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const { startPoint, endPoint } = req.body;
  const result = await StopAssociatedService.updateRouteEndpointsInDB(routeId, startPoint, endPoint);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Route origin and destination updated successfully',
    data: result,
  });
});

export const StopAssociatedController = {
  getAllRoutesWithStops,
  getRouteStopsById,
  addStopToRoute,
  updateStopInRoute,
  removeStopFromRoute,
  updateAllStopsInRoute,
  updateRouteEndpoints,
};

export default StopAssociatedController;
