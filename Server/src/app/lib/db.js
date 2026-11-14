import dns from 'node:dns';
import mongoose from 'mongoose';
import envVars from '../../config/env.js';

export const connectDB = async () => {
  try {
    try {
      dns.setDefaultResultOrder('ipv4first');
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    } catch {
      // Ignore if DNS servers already set
    }

    const conn = await mongoose.connect(envVars.databaseUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
