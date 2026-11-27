import catchAsync from '../../shared/catchAsync.js';
import sendResponse from '../../shared/sendResponse.js';
import TrafficService from './traffic.service.js';

const getRouteTraffic = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const result = await TrafficService.getRouteTrafficAnalysis(routeId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Route traffic conditions and alternative routes retrieved successfully!',
    data: result,
  });
});

const reportTraffic = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const reporterName = req.user?.name || req.user?.role || 'Driver';
  const result = await TrafficService.reportTrafficCondition(routeId, req.body, reporterName);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Traffic condition updated to "${req.body.level}"`,
    data: result,
  });
});

const getTrafficOverview = catchAsync(async (req, res) => {
  const result = await TrafficService.getTrafficOverview();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Campus traffic overview retrieved successfully!',
    data: result,
  });
});

export const TrafficController = {
  getRouteTraffic,
  reportTraffic,
  getTrafficOverview,
};

export default TrafficController;
