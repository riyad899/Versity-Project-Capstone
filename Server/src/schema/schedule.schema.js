import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const scheduleSchema = new Schema(
  {
    bus: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required'],
    },
    route: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route reference is required'],
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      trim: true,
    },
    arrivalTime: {
      type: String,
      required: [true, 'Arrival time is required'],
      trim: true,
    },
    operatingDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'delayed', 'completed', 'cancelled'],
      default: 'active',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'schedule',
  }
);

// Indexes for faster lookups
scheduleSchema.index({ bus: 1, route: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ departureTime: 1 });

export const Schedule = mongoose.models.Schedule || model('Schedule', scheduleSchema);
export default Schedule;
