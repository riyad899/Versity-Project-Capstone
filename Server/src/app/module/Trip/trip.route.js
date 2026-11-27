import { Router } from 'express';
import checkAuth from '../../../middleware/checkAuth.js';
import validateReq from '../../../middleware/validateReq.js';
import TripController from './trip.controller.js';
import TripValidation from './trip.validation.js';

const router = Router();

// Public sanitized interactive live bus map feed (shows active buses & movement)
router.get('/live-map', TripController.getLiveBusMapFeed);

// Public / Authenticated Live Trips query (Passenger, Driver, Manager, Admin)
router.get(
  '/live',
  checkAuth('user', 'driver', 'transportation-manager', 'admin'),
  TripController.getAllLiveTrips
);

// Get current driver's active trip
router.get(
  '/active',
  checkAuth('driver', 'admin'),
  TripController.getActiveTrip
);

// Get trip history
router.get(
  '/history',
  checkAuth('driver', 'transportation-manager', 'admin'),
  TripController.getTripHistory
);

// Start a new trip (Drivers & Admin)
router.post(
  '/start',
  checkAuth('driver', 'admin'),
  validateReq(TripValidation.startTripValidationSchema),
  TripController.startTrip
);

// Update live location for an ongoing trip (Drivers & Admin)
router.post(
  '/:id/location',
  checkAuth('driver', 'admin'),
  validateReq(TripValidation.updateLocationValidationSchema),
  TripController.updateTripLocation
);

// Update delay for an ongoing trip (Transportation Manager & Admin)
router.patch(
  '/:id/delay',
  checkAuth('transportation-manager', 'admin'),
  TripController.updateTripDelay
);

// Stop / complete an active trip (Drivers, Transportation Manager, Admin)
router.patch(
  '/:id/stop',
  checkAuth('driver', 'transportation-manager', 'admin'),
  validateReq(TripValidation.stopTripValidationSchema),
  TripController.stopTrip
);

export const TripRoutes = router;
export default TripRoutes;
