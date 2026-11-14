# 🚌 Versity Project Capstone - Complete Project & API Documentation

> **University Campus Transportation & Fleet Management System**  
> A full-stack, role-based platform designed for university students, faculty, bus drivers, transportation managers, and system administrators to manage, monitor, and coordinate campus transit operations.

---

## 📑 Table of Contents

1. [Project Overview & Key Objectives](#1-project-overview--key-objectives)
2. [System Architecture & Tech Stack](#2-system-architecture--tech-stack)
3. [User Roles & Permissions Matrix](#3-user-roles--permissions-matrix)
4. [File Structure](#4-file-structure)
5. [Frontend Client Routes (`Clint`)](#5-frontend-client-routes-clint)
6. [Backend API Documentation (`Server`)](#6-backend-api-documentation-server)
   - [Authentication & Common Endpoints (`/api/v1/auth`)](#61-authentication-module-apiv1auth)
   - [Passenger / User Endpoints (`/api/v1/users`)](#62-passenger--user-module-apiv1users)
   - [Driver Endpoints (`/api/v1/drivers`)](#63-driver-module-apiv1drivers)
   - [Transportation Manager Endpoints (`/api/v1/transportation-managers`)](#64-transportation-manager-module-apiv1transportation-managers)
   - [Bus Fleet Management (`/api/v1/buses`)](#65-bus-fleet-management-apiv1buses)
   - [Route Management (`/api/v1/routes`)](#66-route-management-apiv1routes)
   - [Stop Associated Module (`/api/v1/stop-associated`)](#67-stop-associated-module-apiv1stop-associated--apiv1route-stops)
   - [Bus Schedule Management (`/api/v1/schedules`)](#68-bus-schedule-management-apiv1schedules)
   - [Admin Management & Analytics (`/api/v1/admin`)](#69-admin-management--analytics-apiv1admin)
7. [Database Schemas & Data Models](#7-database-schemas--data-models)
8. [Setup, Environment Variables & Execution Guide](#8-setup-environment-variables--execution-guide)

---

## 1. Project Overview & Key Objectives

The **Versity Project Capstone** is an end-to-end university transportation solution. It solves real-world campus transit challenges by offering:

- **Passenger Portal**: Real-time lookup of available campus buses, active routes, designated stops, and departure schedules.
- **Driver Portal**: Dedicated workspace for assigned drivers to review their scheduled routes, assigned vehicles, and shift info.
- **Transportation Manager Portal**: Full operational control to add/edit/retire buses, define routes and stops, assign drivers to vehicles, and promote qualified users to drivers.
- **Administrator Hub**: High-level platform governance, including user lifecycle management, role promotions/demotions, account suspension (ban/unban), and real-time fleet analytics.

---

## 2. System Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│                   Client (Frontend)                    │
│   React 19 • Vite • Tailwind CSS 4 • React Router 7    │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / Bearer Auth / Cookies
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Server (Backend)                     │
│    Node.js (ESM) • Express.js • Better-Auth • Zod      │
└──────────────────────────┬─────────────────────────────┘
                           │ Mongoose Driver / Native Client
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Database Layer                       │
│             MongoDB Atlas (Cloud Cluster)              │
└────────────────────────────────────────────────────────┘
```

### Frontend (`Clint`)
- **Core Library**: React 19 + Vite 8
- **Routing**: `react-router` (v7/v8) with declarative layout and protected route guards.
- **Styling**: Tailwind CSS v4, Lucide React icons, and accessible UI components (custom Radix/Tailwind components).
- **HTTP Client**: Axios with automatic Bearer token interceptor and cookie support (`withCredentials: true`).
- **State Management**: React Context (`AuthProvider`) persisting user sessions across browser reloads.

### Backend (`Server`)
- **Runtime & Framework**: Node.js v25+ (ES Modules) with Express.js v4.
- **Authentication**: **Better-Auth** (MongoDB adapter, bearer plugin, admin plugin) coupled with custom JWT-compatible session resolution.
- **Validation**: Zod schema validation middleware (`validateReq`).
- **Database & ODM**: MongoDB Atlas connected via Mongoose v8.
- **Error Handling**: Custom `AppError`, `catchAsync` controller wrappers, and centralized `globalErrorHandeler`.

---

## 3. User Roles & Permissions Matrix

| Capability / Resource | Passenger (`user`) | Driver (`driver`) | Transport Manager (`transportation-manager`) | Admin (`admin`) |
| :--- | :---: | :---: | :---: | :---: |
| Browse Routes & Schedules | ✅ | ✅ | ✅ | ✅ |
| Browse Bus Fleet & Status | ✅ | ✅ | ✅ | ✅ |
| View Assigned Bus/Routes | ❌ | ✅ | ✅ | ✅ |
| Create / Edit / Delete Buses | ❌ | ❌ | ✅ | ✅ |
| Assign Driver / Route to Bus | ❌ | ❌ | ✅ | ✅ |
| Create / Edit / Delete Routes | ❌ | ❌ | ✅ | ✅ |
| Promote Users to Drivers | ❌ | ❌ | ✅ | ✅ |
| View Dashboard Stats | ❌ | ❌ | ❌ | ✅ |
| Manage User Roles (All Roles) | ❌ | ❌ | ❌ | ✅ |
| Ban / Unban Users | ❌ | ❌ | ❌ | ✅ |
| Delete User Accounts | ❌ | ❌ | ❌ | ✅ |

---

## 4. File Structure

```text
versity-project-capstone/
├── package.json                   # Monorepo runner (concurrently dev script)
├── .gitignore                     # Excludes node_modules & .env across all folders
├── README.md                      # Quickstart guide
├── PROJECT_DOCUMENTATION.md       # Comprehensive system & API documentation
│
├── Clint/                         # Frontend Application (React + Vite)
│   ├── .env.example               # Frontend environment template
│   ├── index.html                 # App entry HTML
│   ├── vite.config.js             # Vite configuration
│   └── src/
│       ├── main.jsx               # Application bootstrap
│       ├── Root.jsx               # Top-level shell (Navbar + Outlet + Footer)
│       ├── Router/
│       │   └── Router.jsx         # Client-side route declarations
│       ├── Hooks/
│       │   ├── Axios.jsx          # Axios instance with interceptors
│       │   ├── AuthContext.jsx    # React Auth Context definition
│       │   ├── ContextApi.jsx     # AuthProvider with login, signup, logout
│       │   └── useAuth.jsx        # Custom hook for consuming auth
│       ├── Components/
│       │   ├── ProtectedRoute.jsx # Role-based route guard
│       │   ├── DashboardRedirect.jsx # Smart role-based dashboard router
│       │   ├── MsgModal.jsx       # Modal dialog for confirmation
│       │   └── Dashboard/
│       │       └── DashboardShell.jsx # Common layout for dashboards
│       └── Pages/
│           ├── Home.jsx           # Public landing page
│           ├── Login.jsx          # Authentication sign-in
│           ├── Signup.jsx         # New user registration
│           ├── Navbar.jsx & Footer.jsx
│           ├── Admin/
│           │   └── AdminDashboard.jsx
│           ├── Manager/
│           │   └── ManagerDashboard.jsx
│           ├── Driver/
│           │   └── DriverDashboard.jsx
│           └── Passenger/
│               └── PassengerDashboard.jsx
│
└── Server/                        # Backend REST API (Node.js + Express)
    ├── .env.example               # Backend environment template
    ├── src/
    │   ├── server.js              # Server entry point & DB connection
    │   ├── app.js                 # Express app config, CORS, & route mounting
    │   ├── config/
    │   │   └── env.js             # Environment variable validation
    │   ├── middleware/
    │   │   ├── checkAuth.js       # Role-based authorization & token verification
    │   │   ├── validateReq.js     # Zod payload validator middleware
    │   │   ├── globalErrorHandeler.js # Centralized API error response handler
    │   │   └── notFound.js        # 404 handler
    │   ├── schema/                # Mongoose Database Models
    │   │   ├── user.schema.js     # User model (name, email, role, ban status)
    │   │   ├── bus.schema.js      # Bus model (busNumber, capacity, driver, route)
    │   │   └── route.schema.js    # Route model (routeName, start, end, stops, times)
    │   └── app/
    │       ├── lib/auth.js        # Better-Auth initialization & MongoDB adapter
    │       ├── routes/index.js    # Central router aggregator
    │       └── module/
    │           ├── Auth/          # Auth controllers, routes, schemas
    │           ├── User/          # Passenger controllers & routes
    │           ├── Driver/        # Driver-specific controllers & routes
    │           ├── TransportationManager/ # Manager controllers & routes
    │           ├── Bus/           # Bus fleet controllers & routes
    │           ├── Route/         # Route controllers & routes
    │           └── Admin/         # Admin analytics & user control
```

---

## 5. Frontend Client Routes (`Clint`)

Defined in [Router.jsx](file:///Users/riyadussalehin/Desktop/versity%20Proejct/Clint/src/Router/Router.jsx):

| Path | Component / Page | Access Control | Description |
| :--- | :--- | :--- | :--- |
| `/` | `<Home />` | **Public** | Landing page featuring Hero banner, campus bus service highlights, fleet preview, and FAQ section. |
| `/login` | `<Login />` | **Public** | User authentication page. Supports login for all roles. Stores auth token in `localStorage`. |
| `/signup` | `<Signup />` | **Public** | Registration page for new campus passengers/users. |
| `/dashboard` | `<DashboardRedirect />` | **Authenticated** | Smart redirection route. Detects the logged-in user's role and navigates automatically to `/admin`, `/manager`, `/driver`, or `/passenger`. |
| `/admin` | `<AdminDashboard />` | **Role: `admin`** | Analytics counters, search & filter all users, update roles, promote to driver/manager, ban/unban users with reason, delete accounts. |
| `/manager` | `<ManagerDashboard />` | **Roles: `transportation-manager`, `admin`** | 4-in-1 Workspace: **Users tab** (promote to driver), **Bus Infos tab** (CRUD buses), **Driver Assign tab** (assign driver & route), and **Route Stop Associate tab** (manage and reorder bus stops between start & end terminals). |
| `/driver` | `<DriverDashboard />` | **Roles: `driver`, `admin`** | Driver workspace: My Buses tab (filtered by driver ID), assigned route details, schedule times, and full bus fleet view. |
| `/passenger` | `<PassengerDashboard />` | **Roles: `user`, `admin`** | Passenger transit board: Search buses by name/number/stop, filter by status, view route schedule timings and pickup points. |

---

## 6. Backend API Documentation (`Server`)

- **Base URL**: `http://localhost:5009/api/v1`
- **Standard Response Format**:
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Operation description",
    "data": { ... }
  }
  ```
- **Authentication**: Include the session token in the request header:
  ```http
  Authorization: Bearer <session_token>
  ```
  *(Or via HTTP-only cookie automatically set on login)*

---

### 6.1. Authentication Module (`/api/v1/auth`)

Mounted at `/api/v1/auth`. Powered by Better-Auth with convenience endpoints.

#### 1. Register User
- **Method & Route**: `POST /api/v1/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "password": "Password123",
    "role": "user" // optional: 'user' | 'driver' | 'transportation-manager' | 'admin'
  }
  ```
- **Response**: `201 Created` with created user and session token.

#### 2. Login User
- **Method & Route**: `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@campus.edu",
    "password": "Password123"
  }
  ```
- **Response**: `200 OK` with user data, role, and Bearer token.

#### 3. Get Current User Session
- **Method & Route**: `GET /api/v1/auth/me`
- **Access**: Authenticated (`user`, `driver`, `transportation-manager`, `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with verified user document and role.

---

### 6.2. Passenger / User Module (`/api/v1/users`)

#### 1. Passenger Signup
- **Method & Route**: `POST /api/v1/users/signup`
- **Access**: Public
- **Request Body**: `{ "name": "...", "email": "...", "password": "..." }`

#### 2. Passenger Login
- **Method & Route**: `POST /api/v1/users/login`
- **Access**: Public
- **Request Body**: `{ "email": "...", "password": "..." }`

#### 3. Get My Profile
- **Method & Route**: `GET /api/v1/users/me`
- **Access**: Protected (`user`, `admin`)

#### 4. Update My Profile
- **Method & Route**: `PATCH /api/v1/users/update-me`
- **Access**: Protected (`user`, `admin`)
- **Request Body**:
  ```json
  {
    "name": "Updated Name",
    "image": "https://example.com/avatar.jpg"
  }
  ```

---

### 6.3. Driver Module (`/api/v1/drivers`)

#### 1. Driver Signup
- **Method & Route**: `POST /api/v1/drivers/signup`
- **Access**: Public

#### 2. Driver Login
- **Method & Route**: `POST /api/v1/drivers/login`
- **Access**: Public

#### 3. Get Driver Profile
- **Method & Route**: `GET /api/v1/drivers/me`
- **Access**: Protected (`driver`, `admin`)

#### 4. Update Driver Profile
- **Method & Route**: `PATCH /api/v1/drivers/update-me`
- **Access**: Protected (`driver`, `admin`)
- **Request Body**: `{ "name": "...", "image": "..." }`

---

### 6.4. Transportation Manager Module (`/api/v1/transportation-managers`)

#### 1. Manager Signup & Login
- **Signup**: `POST /api/v1/transportation-managers/signup`
- **Login**: `POST /api/v1/transportation-managers/login`

#### 2. Manager Profile
- **Get Profile**: `GET /api/v1/transportation-managers/me` (Protected: `transportation-manager`, `admin`)
- **Update Profile**: `PATCH /api/v1/transportation-managers/update-me`

#### 3. Get All Drivers
- **Method & Route**: `GET /api/v1/transportation-managers/drivers`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Response**: List of all registered users whose role is `driver`.

#### 4. Get All Users (for Driver Promotion)
- **Method & Route**: `GET /api/v1/transportation-managers/users`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Query Params**: `?search=name_or_email`

#### 5. Promote User to Driver
- **Method & Route**: `PATCH /api/v1/transportation-managers/users/:id/make-driver`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Response**: `200 OK` with updated user role set to `driver`.

---

### 6.5. Bus Fleet Management (`/api/v1/buses`)

#### 1. Add New Bus
- **Method & Route**: `POST /api/v1/buses`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**:
  ```json
  {
    "busNumber": "B-101",
    "name": "Campus Express 1",
    "licensePlate": "DHK-METRO-1122",
    "capacity": 45,
    "status": "active", // 'active' | 'maintenance' | 'inactive'
    "assignedDriver": "65123456789abcdef0123456", // Optional User ObjectId
    "assignedRoute": "65123456789abcdef0123457"   // Optional Route ObjectId
  }
  ```

#### 2. Get All Buses
- **Method & Route**: `GET /api/v1/buses`
- **Access**: Authenticated (`user`, `driver`, `transportation-manager`, `admin`)
- **Query Params**: `?status=active&search=express`
- **Note**: Populates `assignedDriver` and `assignedRoute` models automatically.

#### 3. Get Single Bus by ID
- **Method & Route**: `GET /api/v1/buses/:id`
- **Access**: Authenticated (`user`, `driver`, `transportation-manager`, `admin`)

#### 4. Update Bus Info
- **Method & Route**: `PATCH /api/v1/buses/:id`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**: Any editable fields (`busNumber`, `name`, `licensePlate`, `capacity`, `status`).

#### 5. Assign / Unassign Driver to Bus
- **Method & Route**: `PATCH /api/v1/buses/:id/assign-driver`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**:
  ```json
  {
    "driverId": "65123456789abcdef0123456" // Send null to unassign
  }
  ```

#### 6. Assign / Unassign Route to Bus
- **Method & Route**: `PATCH /api/v1/buses/:id/assign-route`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**:
  ```json
  {
    "routeId": "65123456789abcdef0123457" // Send null to unassign
  }
  ```

#### 7. Delete Bus
- **Method & Route**: `DELETE /api/v1/buses/:id`
- **Access**: Protected (`transportation-manager`, `admin`)

---

### 6.6. Route Management (`/api/v1/routes`)

#### 1. Create Route
- **Method & Route**: `POST /api/v1/routes`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**:
  ```json
  {
    "routeName": "North Campus Shuttle",
    "startPoint": "Main Gate",
    "endPoint": "Science Complex",
    "stops": ["Library", "Cafeteria", "Hostel 3", "Sports Arena"],
    "scheduleTimes": ["08:00 AM", "10:30 AM", "01:15 PM", "04:45 PM"],
    "status": "active" // 'active' | 'inactive'
  }
  ```

#### 2. Get All Routes
- **Method & Route**: `GET /api/v1/routes`
- **Access**: Authenticated (`user`, `driver`, `transportation-manager`, `admin`)

#### 3. Get Route by ID
- **Method & Route**: `GET /api/v1/routes/:id`
- **Access**: Authenticated (`user`, `driver`, `transportation-manager`, `admin`)

#### 4. Update Route
- **Method & Route**: `PATCH /api/v1/routes/:id`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**: Editable route fields (`routeName`, `startPoint`, `endPoint`, `stops`, `scheduleTimes`, `status`).

#### 5. Delete Route
- **Method & Route**: `DELETE /api/v1/routes/:id`
- **Access**: Protected (`transportation-manager`, `admin`)

---

### 6.7. Stop Associated Module (`/api/v1/stop-associated` & `/api/v1/route-stops`)

This module manages intermediate bus pickup/dropoff stations situated between a route's **initial destination** (`startPoint`) and **last destination** (`endPoint`).

#### 1. Get All Routes with Associated Stops
- **Method & Route**: `GET /api/v1/stop-associated` *(or `GET /api/v1/route-stops`)*
- **Access**: Authenticated (`user`, `driver`, `transportation-manager`, `admin`)
- **Query Params**: `?search=library&status=active`
- **Response**: List of routes enriched with `initialDestination`, `lastDestination`, `intermediateStops`, `fullStopChain`, `totalStopsCount`, and assigned `busesCount`.

#### 2. Get Route Stops Details by ID
- **Method & Route**: `GET /api/v1/stop-associated/:routeId`
- **Access**: Authenticated (`user`, `driver`, `transportation-manager`, `admin`)

#### 3. Add Stop to Route
- **Method & Route**: `POST /api/v1/stop-associated/:routeId/stops`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**:
  ```json
  {
    "stopName": "Central Library West Gate",
    "position": 2 // Optional: 0-indexed position to insert
  }
  ```

#### 4. Update / Rename a Stop
- **Method & Route**: `PATCH /api/v1/stop-associated/:routeId/stops`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**:
  ```json
  {
    "oldStopName": "Old Stop Name",
    "newStopName": "New Verified Stop Name"
  }
  ```

#### 5. Remove a Stop from Route
- **Method & Route**: `DELETE /api/v1/stop-associated/:routeId/stops/:stopName`
- **Access**: Protected (`transportation-manager`, `admin`)

#### 6. Batch Reorder / Replace All Stops
- **Method & Route**: `PUT /api/v1/stop-associated/:routeId/stops`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**:
  ```json
  {
    "stops": ["Stop 1", "Stop 2", "Stop 3", "Stop 4"]
  }
  ```

#### 7. Update Initial & Final Terminals
- **Method & Route**: `PATCH /api/v1/stop-associated/:routeId/endpoints`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**:
  ```json
  {
    "startPoint": "Main University Gate",
    "endPoint": "Science Complex Terminal"
  }
  ```

---

### 6.8. Bus Schedule Management (`/api/v1/schedules`)

Enables Transportation Managers and Admins to create, update, browse, and delete bus schedules with departure/arrival times, operating days, status, and driver assignments.

#### 1. Create Bus Schedule
- **Method & Route**: `POST /api/v1/schedules`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**:
  ```json
  {
    "bus": "65123456789abcdef0123456",
    "route": "65123456789abcdef0123457",
    "driver": "65123456789abcdef0123458", // Optional
    "departureTime": "08:00 AM",
    "arrivalTime": "08:45 AM",
    "operatingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "status": "active", // 'active' | 'inactive' | 'delayed' | 'completed' | 'cancelled'
    "remarks": "Morning express peak shuttle"
  }
  ```

#### 2. Get All Bus Schedules
- **Method & Route**: `GET /api/v1/schedules`
- **Access**: Authenticated (`user`, `driver`, `transportation-manager`, `admin`)
- **Query Params**: `?status=active&day=Monday&search=express`
- **Response**: List of schedules with populated `bus`, `route`, `driver`, and `createdBy` details.

#### 3. Get Bus Schedule by ID
- **Method & Route**: `GET /api/v1/schedules/:id`
- **Access**: Authenticated (`user`, `driver`, `transportation-manager`, `admin`)

#### 4. Update Bus Schedule
- **Method & Route**: `PATCH /api/v1/schedules/:id`
- **Access**: Protected (`transportation-manager`, `admin`)
- **Request Body**: Editable schedule fields (`departureTime`, `arrivalTime`, `operatingDays`, `status`, `remarks`, `bus`, `route`, `driver`).

#### 5. Delete Bus Schedule
- **Method & Route**: `DELETE /api/v1/schedules/:id`
- **Access**: Protected (`transportation-manager`, `admin`)

---

### 6.9. Admin Management & Analytics (`/api/v1/admin`)

#### 1. Admin Signup & Login
- **Signup**: `POST /api/v1/admin/signup`
- **Login**: `POST /api/v1/admin/login`

#### 2. Get Dashboard Statistics
- **Method & Route**: `GET /api/v1/admin/stats`
- **Access**: Protected (`admin`)
- **Response Sample**:
  ```json
  {
    "success": true,
    "data": {
      "totalUsers": 128,
      "totalPassengers": 110,
      "totalDrivers": 12,
      "totalManagers": 4,
      "totalAdmins": 2,
      "totalBuses": 15,
      "activeBuses": 11,
      "maintenanceBuses": 3,
      "inactiveBuses": 1,
      "totalRoutes": 8
    }
  }
  ```

#### 3. User Account Management
- **List All Users**: `GET /api/v1/admin/users?role=user&search=alice`
- **Get User By ID**: `GET /api/v1/admin/users/:id`
- **Update User**: `PATCH /api/v1/admin/users/:id`
- **Update Role**: `PATCH /api/v1/admin/users/:id/role`
  - Body: `{ "role": "user" | "driver" | "transportation-manager" | "admin" }`
- **Convenience Role Promoters**:
  - `PATCH /api/v1/admin/users/:id/make-driver`
  - `PATCH /api/v1/admin/users/:id/make-transportation-manager`
  - `PATCH /api/v1/admin/users/:id/make-user`
  - `PATCH /api/v1/admin/users/:id/make-admin`
- **Ban / Unban User**: `PATCH /api/v1/admin/users/:id/ban`
  - Body:
    ```json
    {
      "banned": true,
      "banReason": "Violation of campus transit conduct guidelines"
    }
    ```
- **Delete User Account**: `DELETE /api/v1/admin/users/:id`

---

## 7. Database Schemas & Data Models

### 7.1. User Schema (`user`)
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  emailVerified: { type: Boolean, default: false },
  image: { type: String, default: null },
  role: {
    type: String,
    enum: ['user', 'admin', 'driver', 'transportation-manager'],
    default: 'user'
  },
  banned: { type: Boolean, default: false },
  banReason: { type: String, default: null },
  banExpires: { type: Date, default: null },
  createdAt: Date,
  updatedAt: Date
}
```

### 7.2. Bus Schema (`bus`)
```javascript
{
  busNumber: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  licensePlate: { type: String, required: true, unique: true, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  assignedDriver: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  assignedRoute: { type: Schema.Types.ObjectId, ref: 'Route', default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: Date,
  updatedAt: Date
}
```

### 7.3. Route Schema (`route`)
```javascript
{
  routeName: { type: String, required: true, unique: true, trim: true },
  startPoint: { type: String, required: true, trim: true },
  endPoint: { type: String, required: true, trim: true },
  stops: [{ type: String }],
  scheduleTimes: [{ type: String }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: Date,
  updatedAt: Date
}
```

### 7.4. Bus Schedule Schema (`schedule`)
```javascript
{
  bus: { type: Schema.Types.ObjectId, ref: 'Bus', required: true },
  route: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
  driver: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  departureTime: { type: String, required: true, trim: true },
  arrivalTime: { type: String, required: true, trim: true },
  operatingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'delayed', 'completed', 'cancelled'],
    default: 'active'
  },
  remarks: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 8. Setup, Environment Variables & Execution Guide

### 8.1. Environment Configuration

#### Frontend (`Clint/.env`):
```ini
VITE_API_URL=http://localhost:5009/
```

#### Backend (`Server/.env`):
```ini
PORT=5009
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_uri
BCRYPT_SALT_ROUNDS=12
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
BETTER_AUTH_SECRET=your_better_auth_secret
```

---

### 8.2. Commands

#### 1. Install All Dependencies:
```bash
npm run install:all
```

#### 2. Run Both Client & Server Concurrently:
```bash
npm run dev
```

#### 3. Separate Execution:
- Client only: `npm run dev:client`
- Server only: `npm run dev:server`
- Client build: `npm run build`

---

*Documentation prepared for Versity Project Capstone.*

