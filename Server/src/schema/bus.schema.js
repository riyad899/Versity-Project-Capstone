import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const busSchema = new Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Bus number is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Bus name is required'],
      trim: true,
    },
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active',
    },
    tripStatus: {
      type: String,
      enum: ['idle', 'on_trip'],
      default: 'idle',
    },
    currentTrip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    currentLocation: {
      latitude: { type: Number, default: 23.8103 },
      longitude: { type: Number, default: 90.4125 },
      heading: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
    },
    assignedDriver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedRoute: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'bus',
  }
);

export const Bus = mongoose.models.Bus || model('Bus', busSchema);
export default Bus;
