import { Router } from 'express';
import checkAuth from '../../../middleware/checkAuth.js';
import validateReq from '../../../middleware/validateReq.js';
import StopAssociatedController from './stopAssociated.controller.js';
import StopAssociatedValidation from './stopAssociated.validation.js';

const router = Router();

router.get(
  '/',
  checkAuth('user', 'driver', 'transportation-manager', 'admin'),
  StopAssociatedController.getAllRoutesWithStops
);

router.get(
  '/:routeId',
  checkAuth('user', 'driver', 'transportation-manager', 'admin'),
  StopAssociatedController.getRouteStopsById
);

router.post(
  '/:routeId/stops',
  checkAuth('transportation-manager', 'admin'),
  validateReq(StopAssociatedValidation.addStopValidationSchema),
  StopAssociatedController.addStopToRoute
);

router.patch(
  '/:routeId/stops',
  checkAuth('transportation-manager', 'admin'),
  validateReq(StopAssociatedValidation.updateStopValidationSchema),
  StopAssociatedController.updateStopInRoute
);

router.delete(
  '/:routeId/stops/:stopName',
  checkAuth('transportation-manager', 'admin'),
  StopAssociatedController.removeStopFromRoute
);

router.delete(
  '/:routeId/stops',
  checkAuth('transportation-manager', 'admin'),
  StopAssociatedController.removeStopFromRoute
);

router.put(
  '/:routeId/stops',
  checkAuth('transportation-manager', 'admin'),
  validateReq(StopAssociatedValidation.updateAllStopsValidationSchema),
  StopAssociatedController.updateAllStopsInRoute
);

router.patch(
  '/:routeId/endpoints',
  checkAuth('transportation-manager', 'admin'),
  validateReq(StopAssociatedValidation.updateEndpointsValidationSchema),
  StopAssociatedController.updateRouteEndpoints
);

export const StopAssociatedRoutes = router;
export default router;
