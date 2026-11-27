import { z } from 'zod';

const startTripValidationSchema = z.object({
  body: z.object({
    busId: z.string().optional(),
    routeId: z.string().optional(),
    initialLatitude: z.number().optional(),
    initialLongitude: z.number().optional(),
    remarks: z.string().optional(),
  }),
});

const updateLocationValidationSchema = z.object({
  body: z.object({
    latitude: z.number({ required_error: 'Latitude is required' }),
    longitude: z.number({ required_error: 'Longitude is required' }),
    speed: z.number().optional(),
    heading: z.number().optional(),
  }),
});

const stopTripValidationSchema = z.object({
  body: z.object({
    remarks: z.string().optional(),
  }),
});

export const TripValidation = {
  startTripValidationSchema,
  updateLocationValidationSchema,
  stopTripValidationSchema,
};

export default TripValidation;
