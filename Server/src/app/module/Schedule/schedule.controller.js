import catchAsync from '../../shared/catchAsync.js';
import sendResponse from '../../shared/sendResponse.js';
import ScheduleService from './schedule.service.js';

const createSchedule = catchAsync(async (req, res) => {
  const createdBy = req.user.id || req.user._id;
  const result = await ScheduleService.createScheduleIntoDB(req.body, createdBy);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Bus schedule created successfully!',
    data: result,
  });
});

const getAllSchedules = catchAsync(async (req, res) => {
  const result = await ScheduleService.getAllSchedulesFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All bus schedules fetched successfully!',
    data: result,
  });
});

const getScheduleById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ScheduleService.getScheduleByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bus schedule details fetched successfully!',
    data: result,
  });
});

const updateSchedule = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ScheduleService.updateScheduleIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bus schedule updated successfully!',
    data: result,
  });
});

const deleteSchedule = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ScheduleService.deleteScheduleFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bus schedule deleted successfully!',
    data: result,
  });
});

export const ScheduleController = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
};

export default ScheduleController;
