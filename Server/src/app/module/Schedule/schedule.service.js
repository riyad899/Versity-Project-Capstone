import AppError from '../../errorHelpers/appError.js';
import { Bus, RouteModel, Schedule, User } from '../../../schema/index.js';

const createScheduleIntoDB = async (payload, createdBy) => {
  // Validate bus existence
  const bus = await Bus.findById(payload.bus);
  if (!bus) {
    throw new AppError(404, 'Associated bus not found!');
  }

  // Validate route existence
  const route = await RouteModel.findById(payload.route);
  if (!route) {
    throw new AppError(404, 'Associated route not found!');
  }

  // Validate driver if provided, or fallback to bus assignedDriver
  let driverId = payload.driver || null;
  if (driverId) {
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      throw new AppError(400, 'Assigned user must be an active registered driver!');
    }
  } else if (bus.assignedDriver) {
    driverId = bus.assignedDriver;
  }

  // Prevent duplicate schedule creation (e.g. from double clicking)
  const departureTrimmed = payload.departureTime?.trim();
  const existingSchedule = await Schedule.findOne({
    bus: payload.bus,
    route: payload.route,
    departureTime: departureTrimmed,
  });

  if (existingSchedule) {
    // If created within the last 15 seconds, it's a double-click submission: safely return the existing record
    const isRecentDuplicate =
      Date.now() - new Date(existingSchedule.createdAt).getTime() < 15000;
    if (isRecentDuplicate) {
      return await Schedule.findById(existingSchedule._id)
        .populate('bus', 'busNumber name licensePlate capacity status')
        .populate('route', 'routeName startPoint endPoint stops status scheduleTimes')
        .populate('driver', 'name email image role')
        .populate('createdBy', 'name email role');
    }

    throw new AppError(
      400,
      `A schedule for this bus and route at departure time "${departureTrimmed}" already exists!`
    );
  }

  const schedule = await Schedule.create({
    ...payload,
    departureTime: departureTrimmed,
    arrivalTime: payload.arrivalTime?.trim(),
    driver: driverId,
    createdBy,
  });

  const populatedSchedule = await Schedule.findById(schedule._id)
    .populate('bus', 'busNumber name licensePlate capacity status')
    .populate('route', 'routeName startPoint endPoint stops status scheduleTimes')
    .populate('driver', 'name email image role')
    .populate('createdBy', 'name email role');

  return populatedSchedule;
};

const getAllSchedulesFromDB = async (query = {}) => {
  const filter = {};

  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  if (query.bus) {
    filter.bus = query.bus;
  }

  if (query.route) {
    filter.route = query.route;
  }

  if (query.driver) {
    filter.driver = query.driver;
  }

  if (query.day) {
    filter.operatingDays = { $in: [query.day] };
  }

  if (query.search) {
    const searchRegex = { $regex: query.search, $options: 'i' };

    // Find matching buses and routes for text search
    const [matchingBuses, matchingRoutes] = await Promise.all([
      Bus.find({
        $or: [{ busNumber: searchRegex }, { name: searchRegex }, { licensePlate: searchRegex }],
      }).select('_id'),
      RouteModel.find({
        $or: [{ routeName: searchRegex }, { startPoint: searchRegex }, { endPoint: searchRegex }],
      }).select('_id'),
    ]);

    const busIds = matchingBuses.map((b) => b._id);
    const routeIds = matchingRoutes.map((r) => r._id);

    filter.$or = [
      { remarks: searchRegex },
      { departureTime: searchRegex },
      { arrivalTime: searchRegex },
      { bus: { $in: busIds } },
      { route: { $in: routeIds } },
    ];
  }

  const schedules = await Schedule.find(filter)
    .populate('bus', 'busNumber name licensePlate capacity status')
    .populate('route', 'routeName startPoint endPoint stops status scheduleTimes')
    .populate('driver', 'name email image role')
    .populate('createdBy', 'name email role')
    .sort({ departureTime: 1, createdAt: -1 });

  return schedules;
};

const getScheduleByIdFromDB = async (id) => {
  const schedule = await Schedule.findById(id)
    .populate('bus', 'busNumber name licensePlate capacity status')
    .populate('route', 'routeName startPoint endPoint stops status scheduleTimes')
    .populate('driver', 'name email image role')
    .populate('createdBy', 'name email role');

  if (!schedule) {
    throw new AppError(404, 'Bus schedule not found!');
  }

  return schedule;
};

const updateScheduleIntoDB = async (id, payload) => {
  if (payload.bus) {
    const bus = await Bus.findById(payload.bus);
    if (!bus) {
      throw new AppError(404, 'Associated bus not found!');
    }
  }

  if (payload.route) {
    const route = await RouteModel.findById(payload.route);
    if (!route) {
      throw new AppError(404, 'Associated route not found!');
    }
  }

  if (payload.driver) {
    const driver = await User.findById(payload.driver);
    if (!driver || driver.role !== 'driver') {
      throw new AppError(400, 'Assigned user must be an active registered driver!');
    }
  }

  const updatedSchedule = await Schedule.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .populate('bus', 'busNumber name licensePlate capacity status')
    .populate('route', 'routeName startPoint endPoint stops status scheduleTimes')
    .populate('driver', 'name email image role')
    .populate('createdBy', 'name email role');

  if (!updatedSchedule) {
    throw new AppError(404, 'Bus schedule not found!');
  }

  return updatedSchedule;
};

const deleteScheduleFromDB = async (id) => {
  const schedule = await Schedule.findByIdAndDelete(id);
  if (!schedule) {
    throw new AppError(404, 'Bus schedule not found!');
  }

  return schedule;
};

export const ScheduleService = {
  createScheduleIntoDB,
  getAllSchedulesFromDB,
  getScheduleByIdFromDB,
  updateScheduleIntoDB,
  deleteScheduleFromDB,
};

export default ScheduleService;
