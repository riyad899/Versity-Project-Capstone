import { z } from 'zod';

const dayEnum = z.enum([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]);

const statusEnum = z.enum(['active', 'inactive', 'delayed', 'completed', 'cancelled']);

const createScheduleValidationSchema = z.object({
  body: z.object({
    bus: z.string({ required_error: 'Bus ID is required' }).min(1),
    route: z.string({ required_error: 'Route ID is required' }).min(1),
    driver: z.string().optional().nullable(),
    departureTime: z.string({ required_error: 'Departure time is required' }).min(1),
    arrivalTime: z.string({ required_error: 'Arrival time is required' }).min(1),
    operatingDays: z.array(dayEnum).optional(),
    status: statusEnum.optional(),
    remarks: z.string().optional(),
  }),
});

const updateScheduleValidationSchema = z.object({
  body: z.object({
    bus: z.string().min(1).optional(),
    route: z.string().min(1).optional(),
    driver: z.string().optional().nullable(),
    departureTime: z.string().min(1).optional(),
    arrivalTime: z.string().min(1).optional(),
    operatingDays: z.array(dayEnum).optional(),
    status: statusEnum.optional(),
    remarks: z.string().optional(),
  }),
});

export const ScheduleValidation = {
  createScheduleValidationSchema,
  updateScheduleValidationSchema,
};

export default ScheduleValidation;
