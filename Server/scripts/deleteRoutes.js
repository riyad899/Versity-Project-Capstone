import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import { RouteModel, Bus } from '../src/schema/index.js';

async function deleteRoutes() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully.');

    // Remove route reference from all assigned buses
    const busUpdate = await Bus.updateMany({}, { assignedRoute: null });
    console.log(`Unassigned routes from ${busUpdate.modifiedCount} buses.`);

    // Delete all routes
    const routeDelete = await RouteModel.deleteMany({});
    console.log(`Successfully deleted ${routeDelete.deletedCount} routes.`);

    await mongoose.disconnect();
    console.log('Finished and disconnected from MongoDB.');
  } catch (error) {
    console.error('Error deleting routes:', error);
    process.exit(1);
  }
}

deleteRoutes();

