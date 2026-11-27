import { z } from 'zod';

const coordSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const stopCoordSchema = z.object({
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

const createRouteValidationSchema = z.object({
  body: z.object({
    routeName: z.string({ required_error: 'Route name is required' }).min(1),
    startPoint: z.string({ required_error: 'Start point is required' }).min(1),
    startCoordinates: coordSchema.optional().nullable(),
    endPoint: z.string({ required_error: 'End point is required' }).min(1),
    endCoordinates: coordSchema.optional().nullable(),
    stops: z.array(z.string()).optional(),
    stopCoordinates: z.array(stopCoordSchema).optional(),
    scheduleTimes: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

const updateRouteValidationSchema = z.object({
  body: z.object({
    routeName: z.string().min(1).optional(),
    startPoint: z.string().min(1).optional(),
    startCoordinates: coordSchema.optional().nullable(),
    endPoint: z.string().min(1).optional(),
    endCoordinates: coordSchema.optional().nullable(),
    stops: z.array(z.string()).optional(),
    stopCoordinates: z.array(stopCoordSchema).optional(),
    scheduleTimes: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const RouteValidation = {
  createRouteValidationSchema,
  updateRouteValidationSchema,
};

export default RouteValidation;
