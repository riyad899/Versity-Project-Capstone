import { Router } from 'express';
import checkAuth from '../../../middleware/checkAuth.js';
import validateReq from '../../../middleware/validateReq.js';
import ScheduleController from './schedule.controller.js';
import ScheduleValidation from './schedule.validation.js';

const router = Router();

// Create new schedule (Transportation Manager & Admin)
router.post(
  '/',
  checkAuth('transportation-manager', 'admin'),
  validateReq(ScheduleValidation.createScheduleValidationSchema),
  ScheduleController.createSchedule
);

// Get all schedules (Accessible by all authenticated users: passengers, drivers, managers, admins)
router.get(
  '/',
  checkAuth('user', 'driver', 'transportation-manager', 'admin'),
  ScheduleController.getAllSchedules
);

// Get single schedule by ID
router.get(
  '/:id',
  checkAuth('user', 'driver', 'transportation-manager', 'admin'),
  ScheduleController.getScheduleById
);

// Update schedule (Transportation Manager & Admin)
router.patch(
  '/:id',
  checkAuth('transportation-manager', 'admin'),
  validateReq(ScheduleValidation.updateScheduleValidationSchema),
  ScheduleController.updateSchedule
);

// Delete schedule (Transportation Manager & Admin)
router.delete(
  '/:id',
  checkAuth('transportation-manager', 'admin'),
  ScheduleController.deleteSchedule
);

export const ScheduleRoutes = router;
export default ScheduleRoutes;
