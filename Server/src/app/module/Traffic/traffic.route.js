import { Router } from 'express';
import { z } from 'zod';
import checkAuth from '../../../middleware/checkAuth.js';
import validateReq from '../../../middleware/validateReq.js';
import TrafficController from './traffic.controller.js';

const router = Router();

const reportTrafficSchema = z.object({
  body: z.object({
    level: z.enum(['clear', 'moderate', 'heavy']),
    note: z.string().optional(),
  }),
});

router.get(
  '/overview',
  checkAuth('user', 'driver', 'transportation-manager', 'admin'),
  TrafficController.getTrafficOverview
);

router.get(
  '/route/:routeId',
  checkAuth('user', 'driver', 'transportation-manager', 'admin'),
  TrafficController.getRouteTraffic
);

router.post(
  '/route/:routeId/report',
  checkAuth('driver', 'transportation-manager', 'admin'),
  validateReq(reportTrafficSchema),
  TrafficController.reportTraffic
);

export const TrafficRoutes = router;
export default TrafficRoutes;
