# Route Stop Associate Feature – Implementation Guide

This guide documents the complete architecture, data models, API endpoints, backend logic, and frontend components required to implement the **Route Stop Associate** feature on a dedicated branch.

---

## 1. Feature Overview

The **Route Stop Associate** module enables **Transportation Managers** and **Admins** to manage transit pathways across campus:
1. **Initial Destination (Start Point)** – The first pickup terminal.
2. **Intermediate Stops (`stops[]`)** – An ordered sequence of bus stops visited between the start and end terminals.
3. **Last Destination (End Point)** – The final drop-off terminal.
4. **Key Operations**:
   - Add new intermediate bus stops to an existing route.
   - Rename/update an existing bus stop.
   - Delete/remove a bus stop from a route.
   - Reorder stop sequence (move stop up/down or batch reorder).
   - Edit the initial and last destination terminal names.

---

## 2. Database Schema (`Route`)

In `Server/src/schema/route.schema.js`:

```javascript
import { Schema, model } from 'mongoose';

const routeSchema = new Schema(
  {
    routeName: {
      type: String,
      required: true,
      trim: true,
    },
    startPoint: {
      type: String,
      required: true,
      trim: true,
    },
    endPoint: {
      type: String,
      required: true,
      trim: true,
    },
    stops: {
      type: [String],
      default: [],
    },
    scheduleTimes: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const RouteModel = model('Route', routeSchema);
export default RouteModel;
```

---

## 3. Server Module Implementation

Directory: `Server/src/app/module/StopAssociated/`

### 3.1 Validation (`stopAssociated.validation.js`)

```javascript
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
```

---

### 3.2 Service (`stopAssociated.service.js`)

```javascript
import AppError from '../../errorHelpers/appError.js';
import { RouteModel, Bus } from '../../../schema/index.js';

const getAllRoutesWithStopsFromDB = async () => {
  const routes = await RouteModel.find().populate('createdBy', 'name email role').sort({ createdAt: -1 });

  return routes.map((route) => {
    const stopsList = Array.isArray(route.stops) ? route.stops : [];
    return {
      ...route.toObject(),
      initialDestination: route.startPoint,
      lastDestination: route.endPoint,
      totalStopsCount: stopsList.length,
      fullJourneySequence: [route.startPoint, ...stopsList, route.endPoint],
    };
  });
};

const getRouteStopsByIdFromDB = async (routeId) => {
  const route = await RouteModel.findById(routeId).populate('createdBy', 'name email role');
  if (!route) {
    throw new AppError(404, 'Route not found');
  }
  const assignedBuses = await Bus.find({ assignedRoute: routeId }).select('busNumber name licensePlate capacity status');

  const stopsList = Array.isArray(route.stops) ? route.stops : [];
  return {
    ...route.toObject(),
    initialDestination: route.startPoint,
    lastDestination: route.endPoint,
    totalStopsCount: stopsList.length,
    fullJourneySequence: [route.startPoint, ...stopsList, route.endPoint],
    assignedBuses,
  };
};

const addStopToRouteInDB = async (routeId, stopName) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  const cleanStop = stopName.trim();
  const currentStops = Array.isArray(route.stops) ? [...route.stops] : [];

  if (currentStops.some((s) => s.toLowerCase() === cleanStop.toLowerCase())) {
    throw new AppError(400, `Stop "${cleanStop}" is already associated with this route`);
  }

  currentStops.push(cleanStop);
  route.stops = currentStops;
  await route.save();
  return route;
};

const updateStopInRouteInDB = async (routeId, oldStopName, newStopName) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  const cleanOld = oldStopName.trim();
  const cleanNew = newStopName.trim();
  const currentStops = Array.isArray(route.stops) ? [...route.stops] : [];

  const index = currentStops.findIndex((s) => s.toLowerCase() === cleanOld.toLowerCase());
  if (index === -1) {
    throw new AppError(404, `Stop "${cleanOld}" not found on this route`);
  }

  currentStops[index] = cleanNew;
  route.stops = currentStops;
  await route.save();
  return route;
};

const removeStopFromRouteInDB = async (routeId, stopName) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  const cleanStop = stopName.trim();
  const currentStops = Array.isArray(route.stops) ? [...route.stops] : [];

  const updatedStops = currentStops.filter((s) => s.toLowerCase() !== cleanStop.toLowerCase());
  if (updatedStops.length === currentStops.length) {
    throw new AppError(404, `Stop "${cleanStop}" was not present in this route`);
  }

  route.stops = updatedStops;
  await route.save();
  return route;
};

const updateAllStopsInRouteInDB = async (routeId, stopsArray) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  route.stops = stopsArray.map((s) => s.trim()).filter(Boolean);
  await route.save();
  return route;
};

const updateRouteEndpointsInDB = async (routeId, startPoint, endPoint) => {
  const route = await RouteModel.findById(routeId);
  if (!route) {
    throw new AppError(404, 'Route not found');
  }

  route.startPoint = startPoint.trim();
  route.endPoint = endPoint.trim();
  await route.save();
  return route;
};

export const StopAssociatedService = {
  getAllRoutesWithStopsFromDB,
  getRouteStopsByIdFromDB,
  addStopToRouteInDB,
  updateStopInRouteInDB,
  removeStopFromRouteInDB,
  updateAllStopsInRouteInDB,
  updateRouteEndpointsInDB,
};

export default StopAssociatedService;
```

---

### 3.3 Controller (`stopAssociated.controller.js`)

```javascript
import catchAsync from '../../shared/catchAsync.js';
import sendResponse from '../../shared/sendResponse.js';
import StopAssociatedService from './stopAssociated.service.js';

const getAllRoutesWithStops = catchAsync(async (req, res) => {
  const result = await StopAssociatedService.getAllRoutesWithStopsFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Routes with stop associations retrieved successfully',
    data: result,
  });
});

const getRouteStopsById = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const result = await StopAssociatedService.getRouteStopsByIdFromDB(routeId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Route stop details retrieved successfully',
    data: result,
  });
});

const addStopToRoute = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const { stopName } = req.body;
  const result = await StopAssociatedService.addStopToRouteInDB(routeId, stopName);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Stop "${stopName}" added successfully to route`,
    data: result,
  });
});

const updateStopInRoute = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const { oldStopName, newStopName } = req.body;
  const result = await StopAssociatedService.updateStopInRouteInDB(routeId, oldStopName, newStopName);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Stop updated successfully`,
    data: result,
  });
});

const removeStopFromRoute = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const stopName = req.params.stopName || req.body.stopName || req.query.stopName;
  const result = await StopAssociatedService.removeStopFromRouteInDB(routeId, stopName);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Stop "${stopName}" removed successfully from route`,
    data: result,
  });
});

const updateAllStopsInRoute = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const { stops } = req.body;
  const result = await StopAssociatedService.updateAllStopsInRouteInDB(routeId, stops);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Route stops updated successfully',
    data: result,
  });
});

const updateRouteEndpoints = catchAsync(async (req, res) => {
  const { routeId } = req.params;
  const { startPoint, endPoint } = req.body;
  const result = await StopAssociatedService.updateRouteEndpointsInDB(routeId, startPoint, endPoint);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Route origin and destination updated successfully',
    data: result,
  });
});

export const StopAssociatedController = {
  getAllRoutesWithStops,
  getRouteStopsById,
  addStopToRoute,
  updateStopInRoute,
  removeStopFromRoute,
  updateAllStopsInRoute,
  updateRouteEndpoints,
};

export default StopAssociatedController;
```

---

### 3.4 Routes (`stopAssociated.route.js`)

```javascript
import { Router } from 'express';
import checkAuth from '../../../middleware/checkAuth.js';
import validateReq from '../../../middleware/validateReq.js';
import StopAssociatedController from './stopAssociated.controller.js';
import StopAssociatedValidation from './stopAssociated.validation.js';

const router = Router();

router.get(
  '/',
  checkAuth('user', 'driver', 'transportation-manager', 'admin'),
  StopAssociatedController.getAllRoutesWithStops
);

router.get(
  '/:routeId',
  checkAuth('user', 'driver', 'transportation-manager', 'admin'),
  StopAssociatedController.getRouteStopsById
);

router.post(
  '/:routeId/stops',
  checkAuth('transportation-manager', 'admin'),
  validateReq(StopAssociatedValidation.addStopValidationSchema),
  StopAssociatedController.addStopToRoute
);

router.patch(
  '/:routeId/stops',
  checkAuth('transportation-manager', 'admin'),
  validateReq(StopAssociatedValidation.updateStopValidationSchema),
  StopAssociatedController.updateStopInRoute
);

router.delete(
  '/:routeId/stops/:stopName',
  checkAuth('transportation-manager', 'admin'),
  StopAssociatedController.removeStopFromRoute
);

router.delete(
  '/:routeId/stops',
  checkAuth('transportation-manager', 'admin'),
  StopAssociatedController.removeStopFromRoute
);

router.put(
  '/:routeId/stops',
  checkAuth('transportation-manager', 'admin'),
  validateReq(StopAssociatedValidation.updateAllStopsValidationSchema),
  StopAssociatedController.updateAllStopsInRoute
);

router.patch(
  '/:routeId/endpoints',
  checkAuth('transportation-manager', 'admin'),
  validateReq(StopAssociatedValidation.updateEndpointsValidationSchema),
  StopAssociatedController.updateRouteEndpoints
);

export default router;
```

---

### 3.5 Register in `Server/src/app/routes/index.js`

```javascript
import StopAssociatedRoutes from '../module/StopAssociated/stopAssociated.route.js';

const moduleRoutes = [
  // ...other routes...
  {
    path: '/stop-associated',
    route: StopAssociatedRoutes,
  },
];
```

---

## 4. Client Module Implementation

### 4.1 Modals to Add in `Clint/src/Pages/Manager/components/`

#### `EditStopModal.jsx`
```jsx
import { X } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'

export default function EditStopModal({
  isOpen,
  onClose,
  editStopModal,
  setEditStopModal,
  onSubmit,
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Rename Bus Stop</h3>
            <p className="text-xs text-slate-500">Route: {editStopModal.routeName}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Stop Name *</label>
            <Input
              type="text"
              value={editStopModal.newStopName}
              onChange={(e) =>
                setEditStopModal({ ...editStopModal, newStopName: e.target.value })
              }
              placeholder="e.g. Science Building, Main Library"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Stop Name</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

#### `EditTerminalModal.jsx`
```jsx
import { X } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'

export default function EditTerminalModal({
  isOpen,
  onClose,
  editTerminalModal,
  setEditTerminalModal,
  onSubmit,
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Edit Route Destinations</h3>
            <p className="text-xs text-slate-500">Route: {editTerminalModal.routeName}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Initial Destination (Start Point) *
            </label>
            <Input
              type="text"
              value={editTerminalModal.startPoint}
              onChange={(e) =>
                setEditTerminalModal({ ...editTerminalModal, startPoint: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Last Destination (End Point) *
            </label>
            <Input
              type="text"
              value={editTerminalModal.endPoint}
              onChange={(e) =>
                setEditTerminalModal({ ...editTerminalModal, endPoint: e.target.value })
              }
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Destinations</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

### 4.2 Interactive Tab Component (`ManagerRouteStopAssociateTab.jsx`)

When implemented, `ManagerRouteStopAssociateTab` renders each route card with:
- Origin Station badge & Destination Station badge.
- List of intermediate stop pills with reorder arrows (`<ArrowLeft />`, `<ArrowRight />`), rename button (`<Pencil />`), and delete button (`<Trash2 />`).
- An inline "Add Stop" form (`<Input />` + `<Button>Add Stop</Button>`) that invokes `POST /api/v1/stop-associated/:routeId/stops`.
- A button to edit terminals that opens `EditTerminalModal`.

---

## 5. Branch Implementation Steps

1. Create and switch to a new branch:
   ```bash
   git checkout -b feature/route-stop-associate
   ```
2. Create the backend files in `Server/src/app/module/StopAssociated/`:
   - `stopAssociated.validation.js`
   - `stopAssociated.service.js`
   - `stopAssociated.controller.js`
   - `stopAssociated.route.js`
3. Mount the route in `Server/src/app/routes/index.js`:
   ```javascript
   import StopAssociatedRoutes from '../module/StopAssociated/stopAssociated.route.js';
   // add to moduleRoutes: { path: '/stop-associated', route: StopAssociatedRoutes }
   ```
4. Create the frontend modal files in `Clint/src/Pages/Manager/components/`:
   - `EditStopModal.jsx`
   - `EditTerminalModal.jsx`
5. Update `ManagerRouteStopAssociateTab.jsx` with the interactive route-card view and wire the API calls (`apiClient.post`, `apiClient.patch`, `apiClient.delete`).
6. Verify with:
   ```bash
   npm run build --prefix Server
   npm run build --prefix Clint
   ```

