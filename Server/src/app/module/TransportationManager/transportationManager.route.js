import { Router } from 'express';
import checkAuth from '../../../middleware/checkAuth.js';
import validateReq from '../../../middleware/validateReq.js';
import BusController from '../Bus/bus.controller.js';
import BusValidation from '../Bus/bus.validation.js';
import TransportationManagerController from './transportationManager.controller.js';
import TransportationManagerValidation from './transportationManager.validation.js';

const router = Router();

// Public Auth endpoints
router.post(
  '/signup',
  validateReq(TransportationManagerValidation.managerSignupValidationSchema),
  TransportationManagerController.signupManager
);

router.post(
  '/login',
  validateReq(TransportationManagerValidation.managerLoginValidationSchema),
  TransportationManagerController.loginManager
);

// Protected Manager Profile endpoints
router.get(
  '/me',
  checkAuth('transportation-manager', 'admin'),
  TransportationManagerController.getManagerProfile
);

router.patch(
  '/update-me',
  checkAuth('transportation-manager', 'admin'),
  validateReq(TransportationManagerValidation.managerUpdateProfileValidationSchema),
  TransportationManagerController.updateManagerProfile
);

// Protected Driver list for Manager
router.get(
  '/drivers',
  checkAuth('transportation-manager', 'admin'),
  TransportationManagerController.getAllDrivers
);

// Protected User list for Manager
router.get(
  '/users',
  checkAuth('transportation-manager', 'admin'),
  TransportationManagerController.getAllUsers
);

// Protected Promote User to Driver
router.patch(
  '/users/:id/make-driver',
  checkAuth('transportation-manager', 'admin'),
  TransportationManagerController.makeUserDriver
);

// Protected Bus Assignment Aliases (Assign Driver / Assign Route)
router.patch(
  '/buses/:id/assign-driver',
  checkAuth('transportation-manager', 'admin'),
  validateReq(BusValidation.assignDriverValidationSchema),
  BusController.assignDriver
);

router.patch(
  '/buses/:id/assign-route',
  checkAuth('transportation-manager', 'admin'),
  validateReq(BusValidation.assignRouteValidationSchema),
  BusController.assignRoute
);

export const TransportationManagerRoutes = router;
export default TransportationManagerRoutes;
