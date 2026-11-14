import { z } from 'zod';

const addStopValidationSchema = z.object({
  body: z.object({
    stopName: z.string({ required_error: 'Stop name is required' }).min(1, 'Stop name cannot be empty').trim(),
  }),
});

const updateStopValidationSchema = z.object({
  body: z.object({
    oldStopName: z.string({ required_error: 'Old stop name is required' }).trim(),
    newStopName: z.string({ required_error: 'New stop name is required' }).min(1).trim(),
  }),
});

const updateAllStopsValidationSchema = z.object({
  body: z.object({
    stops: z.array(z.string().trim()).min(0),
  }),
});

const updateEndpointsValidationSchema = z.object({
  body: z.object({
    startPoint: z.string({ required_error: 'Start point is required' }).min(1).trim(),
    endPoint: z.string({ required_error: 'End point is required' }).min(1).trim(),
  }),
});

export const StopAssociatedValidation = {
  addStopValidationSchema,
  updateStopValidationSchema,
  updateAllStopsValidationSchema,
  updateEndpointsValidationSchema,
};

export default StopAssociatedValidation;
