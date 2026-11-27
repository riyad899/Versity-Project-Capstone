import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const tripSchema = new Schema(
  {
    bus: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required'],
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver reference is required'],
    },
    route: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route reference is required'],
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'cancelled'],
      default: 'in_progress',
    },
    delayMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Delay cannot be negative'],
    },
    delayReason: {
      type: String,
      trim: true,
      default: '',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    currentLocation: {
      latitude: { type: Number, default: 23.8103 },
      longitude: { type: Number, default: 90.4125 },
      heading: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
    },
    locationHistory: [
      {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        heading: { type: Number, default: 0 },
        speed: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'trip',
  }
);

export const Trip = mongoose.models.Trip || model('Trip', tripSchema);
export default Trip;
