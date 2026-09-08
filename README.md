<div align="center">

# 📦 Swift Courier

### A Production-Grade Courier & Delivery Management Backend

**Built with Node.js · Express 5 · TypeScript · PostgreSQL (Prisma ORM) · Redis · Stripe**

---

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-6-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Stripe](https://img.shields.io/badge/Stripe-22-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)

**Author:** [Md. Hayder Ali](https://hayder4290.vercel.app) &nbsp;·&nbsp; 📧 [hayderbd4290@gmail.com](mailto:hayderbd4290@gmail.com) &nbsp;·&nbsp; 📱 [+8801771814597](tel:+8801771814597)

[🌐 Portfolio](https://hayder4290.vercel.app) · [💼 LinkedIn](https://www.linkedin.com/in/hayder-ali-bb9175349) · [🐙 GitHub](https://github.com/Hayder987)

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🏗️ Tech Stack](#️-tech-stack)
- [📋 Architecture Overview](#-architecture-overview)
- [🗄️ Data Model](#️-data-model)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🔐 Authentication & Authorization](#-authentication--authorization)
- [🌐 Complete API Reference](#-complete-api-reference)
  - [🔐 Authentication](#-authentication)
  - [👤 Users](#-users)
  - [📍 Location Services](#-location-services)
  - [📦 Shipments](#-shipments)
  - [🚚 Employee / Courier](#-employee--courier)
  - [🗺️ Zones](#️-zones)
  - [💳 Payments](#-payments)
  - [💰 Payroll](#-payroll)
  - [📋 Notification](#-notification)
  - [👑 Super Admin & Audit Logs](#-super-admin--audit-logs)
- [🧪 Demo / Test Credentials](#-demo--test-credentials)
- [🧭 API Workflow](#-api-workflow)
- [🛡️ Security](#️-security)
- [🧰 Development Tools](#-development-tools)
- [📜 License](#-license)
- [📬 Contact](#-contact)

---

## ✨ Features

- **Role-Based Access Control** — Four distinct roles (`SUPER_ADMIN`, `ADMIN`, `COURIER`, `CUSTOMER`) with granular route-level authorization.
- **JWT Authentication** — Secure access + refresh token flow, HTTP-only cookies, and Google OAuth sign-in.
- **Email Verification & OTP** — 6-digit OTP-based email verification, password reset, and OTP resend flows.
- **Shipment Lifecycle Management** — Full parcel tracking from creation through delivery with granular status transitions.
- **Automatic Courier Assignment** — Random assignment of available couriers in the pickup/delivery zone using raw SQL.
- **Geospatial Zones** — Circular geographic zones with GeoJSON polygon boundaries and point-in-polygon matching (Turf.js).
- **Real-Time Live Location** — Courier location sharing with status management and auto-expiry.
- **Stripe Payment Integration** — Checkout sessions and server-side webhook handling.
- **Payroll System** — Monthly payroll generation with basic salary, allowances, per-delivery earnings, deductions, and bonuses.
- **Salary For Courier Earnings** — Fixed or `BASE_PLUS_DELIVERY` compensation models.
- **Audit Logging** — Immutable audit trail for every significant operation (create, update, approve, pay, deliver, etc.).
- **Notification System** — Role-aware notifications with automatic expiration-based cleanup.
- **Cloudinary Media** — Image upload for profile photos, shipment items, resumes, and documents.
- **Redis-Backed Job Queue** — Asynchronous email delivery with a cron-based worker.
- **Transactional Email Templates** — EJS-rendered emails for registration, OTP, salary, and status updates.
- **Rate Limiting** — IP-based global API rate limit (100 requests / 10 min).
- **Request Logging** — Structured Winston logging for every HTTP request.

---

## 🏗️ Tech Stack

### Core

| Layer | Technology |
|-------|------------|
| **Language** | TypeScript (ESM, target ES2023) |
| **Runtime** | Node.js |
| **Framework** | Express 5 |
| **ORM** | Prisma ORM 7 (`pg` driver adapter) |
| **Database** | PostgreSQL (via `pg` / `@prisma/adapter-pg`) |
| **Caching / Queue** | Redis |
| **Validation** | Zod |
| **Schema** | Prisma multi-file schema (modular `*.prisma` parts) |

### Authentication & Security

| Purpose | Technology |
|---------|-----------|
| Password hashing | `bcryptjs` |
| Auth tokens | `jsonwebtoken` (access + refresh) |
| Google OAuth | `google-auth-library` |
| HTTP security headers | `helmet` |
| CORS | `cors` (with credentials) |
| Rate limiting | `express-rate-limit` |
| Cookies | `cookie-parser` |

### Integrations

| Purpose | Technology |
|---------|-----------|
| Payments | Stripe (checkout sessions + webhooks) |
| Image / media | Cloudinary (with Multer + Sharp) |
| Geocoding | Geoapify (forward + reverse) |
| Geospatial | Turf.js (point-in-polygon) |
| Email | Nodemailer + EJS templates |

### Utilities

| Purpose | Technology |
|---------|-----------|
| PDF generation | `pdfkit` |
| Logging | `winston` |
| Scheduled jobs | `node-cron` |
| Date handling | `date-fns` |
| HTTP status | `http-status` |
| Linting / formatting | Biome |

---

## 📋 Architecture Overview

The project follows a **layered modular-monolith** architecture. Each business domain lives in its own module under `src/app/modules/`, and each module is split into the classic **route → controller → service** pattern with dedicated validation, interface, and utility files.

```
swiftcourier-backend/
├── prisma/
│   ├── schema/                 # Modular Prisma schema (*.prisma files)
│   │   ├── schema.prisma       # Generator + datasource (PostgreSQL)
│   │   ├── enum.prisma         # 15 domain enums
│   │   ├── user.prisma         # User model
│   │   ├── customer.prisma     # Customer profile model
│   │   ├── employee.prisma     # Employee model
│   │   ├── courier.prisma      # Courier application model
│   │   ├── shipment.prisma     # Shipment model
│   │   ├── shipment-tracking.prisma
│   │   ├── zone.prisma         # Geospatial delivery zones
│   │   ├── payment.prisma
│   │   ├── notification.prisma
│   │   ├── live-location.prisma
│   │   ├── salary-structure.prisma
│   │   ├── payroll.prisma
│   │   ├── courier-earning.prisma
│   │   └── auditEmployeeLogs.prisma
│   └── migrations/             # 17 SQL migrations (from 2026-09-03)
│
└── src/
    ├── server.ts               # Application entry point / bootstrap
    ├── app.ts                  # Express app (middleware, routes)
    └── app/
        ├── config/             # Environment config loader
        ├── interfaces/         # Shared TypeScript interfaces
        ├── lib/                # Prisma, Redis, Nodemailer, Multer, Cloudinary, Google, Stripe clients
        ├── middleware/         # auth, validateRequest, error handlers, logger, rate limiter
        ├── routes/             # Route aggregator (prefix: /api/v1)
        ├── services/           # Email renderer + sender (EJS + Nodemailer)
        ├── templates/          # EJS email templates
        ├── utils/              # AppError, jwt, sendResponse, OTP, audit, geocoding, seeding, zone-utils, email queue/worker
        ├── jobs/               # Cron jobs (notification cleanup, salary email worker)
        └── modules/            # Feature modules
            ├── auth/
            ├── user/
            ├── employee/
            ├── shipment/
            ├── zone/
            ├── payment/
            ├── payroll/
            ├── notifications/
            ├── super-admin/
            └── live-locations/
```

### Request Flow

```
Client ──► Express App
             ├── helmet
             ├── requestLogger (Winston)
             ├── cors
             ├── Stripe webhook raw body (/api/v1/payments/webhook)
             ├── urlencoded / json body parser
             ├── cookieParser
             ├── apiRateLimiter (/api — 100 req / 10 min)
             ├── /api/v1 router ──► Module routes
             │                       ├── validateRequest (Zod)
             │                       └── auth(...roles) (JWT + role guard)
             │                            └── Controller
             │                                 └── Service (business logic, DB/Redis/external calls)
             ├── globalErrorHandler
             └── notFound (404)
```

### Service / Controller Relationship

Controllers are intentionally thin — they extract data, delegate to services, and format responses using the shared `sendResponse` util. All business logic, database access, and third-party integration calls live inside services.

---

## 🗄️ Data Model

14 models with a heavily indexed relational schema. Key relationships:

- **User** (1)—(0..1) **Customer**, (0..1) **Employee**, (0..1) **LiveLocation**, (0..n) **Notification**, (0..n) **Shipment**, (0..n) **ShipmentTracking**, (0..n) **AuditLog**
- **Employee** (1)—(0..1) **Courier**, (1)—(0..1) **SalaryStructure**, (0..n) **Payroll**
- **Courier** (0..n)—(0..1) **Zone**, (0..n) **CourierEarning**
- **Zone** (0..n)—(0..n) **Courier**, (0..n) **Shipment** (pickup / delivery)
- **Shipment** (1)—(0..n) **ShipmentTracking**, (1)—(0..1) **Payment**
- **Shipment** (0..1)—(0..n) **CourierEarning**
- **Notification** (0..1)—(0..1) **Shipment**

### Enumerations (15)

| Enum | Values |
|------|--------|
| `UserRole` | `SUPER_ADMIN`, `ADMIN`, `COURIER`, `CUSTOMER` |
| `UserStatus` | `ACTIVE`, `SUSPENDED`, `DELETED` |
| `ApplicationStatus` | `APPLIED`, `APPROVED`, `REJECTED` |
| `EmploymentStatus` | `APPLIED`, `ACTIVE`, `INACTIVE`, `ON_LEAVE`, `SUSPENDED`, `RESIGNED`, `TERMINATED` |
| `AuthMethod` | `CREDENTIALS`, `GOOGLE` |
| `LocationStatus` | `CREATED`, `ONGOING`, `EXPIRED` |
| `ShipmentStatus` | `CREATED`, `READY_FOR_PAYMENT`, `PENDING`, `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED`, `RETURNED`, `CANCELLED` |
| `ShipmentType` | `NEW`, `OLD` |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `CANCELLED` |
| `PaymentProvider` | `STRIPE`, `BKASH` |
| `PaymentMethod` | `CARD`, `BKASH`, `NAGAD`, `ROCKET`, `BANK` |
| `NotificationType` | `SHIPMENT`, `PAYMENT`, `GENERAL`, `APPLICATION` |
| `CourierAvailability` | `AVAILABLE`, `BUSY`, `OFFLINE` |
| `SalaryType` | `FIXED`, `BASE_PLUS_DELIVERY` |
| `EarningType` | `DELIVERY`, `BONUS`, `OTHER` |
| `PayrollStatus` | `PENDING`, `PAID`, `CANCELLED` |
| `AuditAction` | `CREATED`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `ASSIGN`, `ACCEPT`, `PICKUP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED`, `CANCEL`, `PAYMENT`, `PAYROLL` |
| `AuditResource` | `USER`, `EMPLOYEE`, `COURIER`, `CUSTOMER`, `SHIPMENT`, `ZONE`, `PAYMENT`, `PAYROLL`, `SALARY` |
| `AuditType` | `CURRENT`, `OLD` |

### Shipment Lifecycle

```
CREATED ──► READY_FOR_PAYMENT ──► PENDING ──► ASSIGNED ──► PICKED_UP
              │                    │            │             │
              │                    │            │             ├──► IN_TRANSIT ──► OUT_FOR_DELIVERY ──► DELIVERED
              │                    │            │             │                            │
              │                    │            │             └────── DELIVERY_FAILED ────────┘
              │                    └──────────► CANCELLED (by admin)
              └────────────────────► RETURNED (by admin)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** database
- **Redis** server
- A **Stripe** account (for payments)
- A **Cloudinary** account (for media)
- A **Geoapify** account (for geocoding)
- A **Gmail** account with an app password (for SMTP email)
- A **Google Cloud** OAuth client (for Google login)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Hayder987/swiftcourier-backend.git
cd swiftcourier-backend

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in your values
#    (see the Environment Configuration section below)
copy .env.local .env    # Windows
# cp .env.local .env     # macOS / Linux

# 4. Generate the Prisma client
npx prisma generate

# 5. Apply database migrations
npx prisma migrate deploy

# 6. Start the development server
npm run dev
```

> The server bootstraps automatically: connects to PostgreSQL and Redis, verifies the SMTP transporter, starts the salary email worker and notification cleanup cron, seeds the Super Admin / Test Admin / Test Courier (if absent), and listens on the configured port.

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with `tsx watch` |
| `npm run build` | Compile TypeScript to `./dist` |
| `npm start` | Run the compiled server (`dist/src/server.js`) |
| `npm run lint:check` | Check linting with Biome |
| `npm run lint:fix` | Auto-fix linting with Biome |
| `npm run format:check` | Check formatting with Biome |
| `npm run format:fix` | Auto-format with Biome |
| `npm run stripe:webhook` | Listen for Stripe webhooks and forward to `localhost:5000/api/v1/payments/webhook` |

---

## ⚙️ Environment Configuration

Copy `.env.local` to `.env` and fill in the values. **Never commit real secrets.**

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `your_database_connection_string` |
| `BACKEND_URL` | Backend base URL | `http://localhost:5000` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |
| `BCRYPT_SALT_ROUNDS` | Bcrypt hashing rounds | `10` |
| `JWT_ACCESS_SECRET` | Access token signing secret | `your_access_secret` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | `your_refresh_secret` |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime | `1d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `SUPER_ADMIN_NAME` | Seeded Super Admin name | — |
| `SUPER_ADMIN_EMAIL` | Seeded Super Admin email | — |
| `SUPER_ADMIN_PASSWORD` | Seeded Super Admin password | — |
| `SUPER_ADMIN_PHONE` | Seeded Super Admin phone | — |
| `TEST_ADMIN_NAME` | Seeded Test Admin name | — |
| `TEST_ADMIN_EMAIL` | Seeded Test Admin email | — |
| `TEST_ADMIN_PASSWORD` | Seeded Test Admin password | — |
| `TEST_ADMIN_PHONE` | Seeded Test Admin phone | — |
| `TEST_COURIER_DHA_ZONE_NAME` | Seeded Test Courier name | — |
| `TEST_COURIER_DHA_ZONE_EMAIL` | Seeded Test Courier email | — |
| `TEST_COURIER_DHA_ZONE_PASSWORD` | Seeded Test Courier password | — |
| `TEST_COURIER_DHA_ZONE_PHONE` | Seeded Test Courier phone | — |
| `REDIS_USER` | Redis username | — |
| `REDIS_PASSWORD` | Redis password | — |
| `REDIS_HOST` | Redis host | — |
| `REDIS_PORT` | Redis port | — |
| `SMTP_USER` | SMTP (Gmail) account | — |
| `SMTP_PASSWORD` | SMTP (Gmail app) password | — |
| `EMAIL_SENDER` | Sender display address | — |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | — |
| `GEOAPIFY_API_KEY` | Geoapify API key | — |
| `GEOAPIFY_URL` | Geoapify map base URL | `https://maps.geoapify.com` |
| `GEOAPIFY_GEOCODE_URL` | Geoapify geocode endpoint | `https://api.geoapify.com/v1/geocode/search` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `your_stripe_secret_key` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `your_stripe_webhook_secret` |

---

## 🔐 Authentication & Authorization

### JWT Strategy

- On login / email verification, the server issues a short-lived **access token** and a longer-lived **refresh token**.
- Tokens are returned in the response body and also set as **HTTP-only cookies** (respecting credentials).
- Use a **Bearer token** (`Authorization: Bearer <accessToken>`) for protected endpoints.
- Rotate to a fresh access token using `POST /auth/refresh-token` (reads the refresh token cookie).

### Role Access Matrix

| Endpoint Group | CUSTOMER | COURIER | ADMIN | SUPER_ADMIN | Public |
|----------------|:--------:|:-------:|:-----:|:-----------:|:------:|
| Auth (sign-up, verify, login, etc.) | — | — | — | — | ✅ |
| Users: `/me`, change-password, profile-image | ✅ | ✅ | ✅ | ✅ | |
| Users: `/all-user`, `/user/:id` | | | ✅ | ✅ | |
| Users: change status / delete | | | ✅ | | |
| Location: generate, delete | ✅ | ✅ | ✅ | ✅ | |
| Location: share (`/share/:id`) | | ✅ | | | |
| Shipment: create, my-shipments | ✅ | | | | |
| Shipment: admin status, assign | | | ✅ | | |
| Shipment: courier status | | ✅ | | | |
| Shipment: by id | | ✅ | ✅ | ✅ | |
| Shipments: all | | | ✅ | ✅ | |
| Employee: be-courier | ✅ | | | | |
| Employee: jobs (applicants) | | | ✅ | ✅ | |
| Employee: approve/reject | | | ✅ | | |
| Employee: all-employee, by id | | | ✅ | ✅ | |
| Zones: create / update / delete | | | ✅ | ✅ | |
| Zones: list / by id | — | — | — | — | ✅ |
| Payments: create | ✅ | | | | |
| Payments: webhook | — | — | — | — | ✅ (Stripe) |
| Payments: all | | | ✅ | ✅ | |
| Payroll: generate | | | ✅ | | |
| Payroll: my-salary | | ✅ | ✅ | ✅ | |
| Payroll: paid | | | ✅ | ✅ | |
| Payroll: pay | | | ✅ | ✅ | |
| Notifications: `/me` | ✅ | ✅ | | | |
| Notifications: `/admin` | | | ✅ | | |
| Super Admin: logs / create-employee / delete-admin | | | | ✅ | |

The `auth(...roles)` middleware verifies the JWT, loads the user, enforces role membership, and rejects **suspended** / **deleted** accounts (`403`).

---

## 🌐 Complete API Reference

> **Base URL:** All routes are mounted under `/api/v1`.
> Use `{{baseUrl}}` in Postman as `http://localhost:5000/api/v1` (adjust for your environment).

---

### 🔐 Authentication

#### Register Customer

`POST /auth/sign-up`

**Authentication:** Public

**Purpose:** Register a new customer account. Sends a 6-digit OTP email for email verification.

**Request Body**

```json
{
  "name": "hayder ali",
  "email": "customer@example.com",
  "password": "User@1234",
  "phone": "+8801700000000"
}
```

**Validation rules:** name 3–80 chars; email valid + max 255; password ≥8 with upper, lower, number and special char; phone in E.164 format (`+880...`).

---

#### Verify Email OTP

`POST /auth/verify-email`

**Authentication:** Public

**Purpose:** Verify a customer's email with the 6-digit OTP received. Returns `accessToken` and `refreshToken` (and sets them as cookies).

**Request Body**

```json
{
  "email": "customer@example.com",
  "otp": "115696"
}
```

---

#### Resend OTP Email Or Forgot

`POST /auth/resend-otp`

**Authentication:** Public

**Purpose:** Resend a verification OTP, or a forgot-password OTP, depending on the `emailVerifyOtp` flag.

**Request Body**

```json
{
  "email": "customer@example.com",
  "emailVerifyOtp": false
}
```

---

#### Login User Credentials

`POST /auth/login`

**Authentication:** Public

**Purpose:** Authenticate with email and password. Returns `data: { accessToken, refreshToken }` and sets both as cookies.

**Request Body**

```json
{
  "email": "customer@example.com",
  "password": "User@1234"
}
```

**Notable outcomes:** unknown email → `404` · suspended user → `403` · deleted account → `404` · Google-only account (no password) → `400` · wrong password → `401`.

---

#### Google Login

`POST /auth/google`

**Authentication:** Public

**Purpose:** Authenticate using a Google ID token (Google OAuth). Creates the account if it does not already exist.

**Request Body**

```json
{
  "idToken": "<google_id_token>"
}
```

---

#### RefreshToken To AccessToken

`POST /auth/refresh-token`

**Authentication:** Public (reads the refresh token cookie)

**Purpose:** Exchange the refresh token cookie for a fresh access token (and rotated refresh token).

---

#### Forgot Password

`POST /auth/forgot-password`

**Authentication:** Public

**Purpose:** Send a 6-digit OTP to the given email for use with **reset-password**. Expects `200`.

**Request Body**

```json
{
  "email": "customer@example.com"
}
```

---

#### Reset Password

`POST /auth/reset-password`

**Authentication:** Public

**Purpose:** Verify the OTP sent by **forgot-password** and update the account password. Expects `200`.

**Request Body**

```json
{
  "email": "customer@example.com",
  "newPassword": "User@1234",
  "otp": "123456"
}
```

---

#### Logout User

`POST /auth/logout`

**Authentication:** Public

**Purpose:** Clear the refresh token cookie and end the session.

---

### 👤 Users

#### Get My User Profile

`GET /users/me`

**Authentication:** Bearer Token (CUSTOMER, COURIER, ADMIN, SUPER_ADMIN)

**Purpose:** Retrieve the currently authenticated user's own profile.

---

#### Change My User Password

`PATCH /users/change-password`

**Authentication:** Bearer Token (CUSTOMER, COURIER, ADMIN, SUPER_ADMIN)

**Purpose:** Change the authenticated user's own password after verifying the current password.

**Request Body**

```json
{
  "currentPassword": "User@1234",
  "newPassword": "User@12345",
  "reEnterNewPassword": "User@12345"
}
```

---

#### Upload Profile Image

`PATCH /users/profile-image`

**Authentication:** Bearer Token (CUSTOMER, COURIER, ADMIN, SUPER_ADMIN)

**Purpose:** Upload a profile image (`multipart/form-data`) to Cloudinary and update the user's `imageUrl` / `imagePublicId`. The previous image is removed from Cloudinary if one existed.

**Body:** `multipart/form-data`

| Field | Type |
|-------|------|
| `profileImage` | File |

---

#### Get All Users By Admin

`GET /users/all-user`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Paginated list of all users with optional filters.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | default `1` |
| `limit` | number | default `15` |
| `sortBy` | string | e.g. `createdAt` |
| `sortOrder` | string | `asc` / `desc` |
| `role` | enum | `CUSTOMER`, `COURIER`, `ADMIN`, `SUPER_ADMIN` |
| `searchTerm` | string | free-text search |
| `authMethod` | enum | `CREDENTIALS`, `GOOGLE` |
| `userId` | uuid | filter by specific user |
| `status` | enum | `ACTIVE`, `SUSPENDED` |
| `isEmployee` | boolean | filter by employee flag |

---

#### Get User By Id

`GET /users/user/{userId}`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN, COURIER)

**Purpose:** Retrieve a single user by ID.

**Path Parameters:** `userId` — the target user's UUID.

---

#### User Soft Delete By Admin

`PATCH /users/user/{userId}`

**Authentication:** Bearer Token (ADMIN)

**Purpose:** Soft-delete a user (sets status/list of-deletion flags) by ID.

**Path Parameters:** `userId` — the target user's UUID.

---

#### Change User Status Suspend And Active By Admin

`PATCH /users/user/{userId}/status`

**Authentication:** Bearer Token (ADMIN)

**Purpose:** Suspend or activate a user.

**Path Parameters:** `userId` — the target user's UUID.

**Request Body**

```json
{
  "status": "SUSPENDED"
}
```

**Valid values:** `ACTIVE`, `SUSPENDED`.

---

### 📍 Location Services

#### Generate Live Location

`POST /location/generate`

**Authentication:** Bearer Token (CUSTOMER, COURIER, ADMIN, SUPER_ADMIN)

**Purpose:** Create or update the authenticated user's own live location record (reverse-geocodes coordinates to an address when possible).

**Request Body**

```json
{
  "latitude": "24.3715513",
  "longitude": "88.5921038"
}
```

---

#### Delete My Location

`DELETE /location/my-location`

**Authentication:** Bearer Token (CUSTOMER, COURIER, ADMIN, SUPER_ADMIN)

**Purpose:** Delete the authenticated user's own live location record.

---

#### Update Location Ongoing By Id

`PATCH /location/share/{locationId}`

**Authentication:** Bearer Token (COURIER)

**Purpose:** Mark a location record as `ONGOING` (i.e., actively sharing location) by ID.

**Path Parameters:** `locationId` — the live location record's UUID.

---

### 📦 Shipments

#### Create Shipment

`POST /shipments`

**Authentication:** Bearer Token (CUSTOMER)

**Purpose:** Create a new shipment (with optional item image + JSON data) via `multipart/form-data`. The pickup zone and pickup address are auto-resolved; the delivery zone is resolved from the delivery address.

**Body:** `multipart/form-data`

| Field | Type | Notes |
|-------|------|-------|
| `ItemsImage` | File | optional item image |
| `data` | Text | JSON string (see below) |

**`data` JSON fields**

```json
{
  "parcelName": "RTX 4090 Graphics Card",
  "description": "My used graphics card to sell",
  "parcelWeightGM": 1800,
  "pickupLat": 24.3636,
  "pickupLng": 88.6241,
  "deliveryAddress": "Mirpur 10, Dhaka"
}
```

---

#### Get All Shipment By Admin

`GET /shipments`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Paginated list of all shipments with filters.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | default `1` |
| `limit` | number | default `20` |
| `sortBy` | string | e.g. `createdAt` |
| `sortOrder` | string | `asc` / `desc` |
| `searchTerm` | string | free-text search |
| `status` | enum | `ShipmentStatus` |
| `pickupZoneId` | uuid | filter by pickup zone |
| `deliveryZoneId` | uuid | filter by delivery zone |
| `dateFilter` | string | e.g. `today`, `this_month`, `thisWeek` |
| `type` | enum | `NEW`, `OLD` |

---

#### Get Shipment By Id (Not Customer)

`GET /shipments/shipment/{shipmentId}`

**Authentication:** Bearer Token (ADMIN, COURIER, SUPER_ADMIN)

**Purpose:** Retrieve a single shipment with its full tracking history.

**Path Parameters:** `shipmentId` — the shipment's UUID.

---

#### Get My Shipments

`GET /shipments/my-shipments`

**Authentication:** Bearer Token (CUSTOMER)

**Purpose:** Paginated list of the authenticated customer's own shipments with filters.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | default `1` |
| `limit` | number | default `20` |
| `sortBy` | string | e.g. `createdAt` |
| `sortOrder` | string | `asc` / `desc` |
| `searchTerm` | string | free-text search |
| `status` | enum | `ShipmentStatus` |
| `pickupZoneId` | uuid | filter by pickup zone |
| `deliveryZoneId` | uuid | filter by delivery zone |
| `dateFilter` | string | e.g. `this_month` |
| `type` | enum | `NEW`, `OLD` |

---

#### Update Status By Admin

`PATCH /shipments/admin-status/{shipmentId}`

**Authentication:** Bearer Token (ADMIN)

**Purpose:** Advance a shipment's status through the admin-controlled states (approve for payment, mark in-transit / out-for-delivery, cancel, return, etc.). Writes tracking history and updates delivery fee/distance when applicable.

**Path Parameters:** `shipmentId` — the shipment's UUID.

**Request Body**

```json
{
  "status": "READY_FOR_PAYMENT",
  "note": "Shipment Approved Please Make Payment"
}
```

**Valid statuses:** `READY_FOR_PAYMENT`, `RETURNED`, `OUT_FOR_DELIVERY`, `IN_TRANSIT`, `ASSIGNED`, `CANCELLED`, `DELIVERY_FAILED`, `DELIVERED`.

---

#### Update Status By Courier

`PATCH /shipments/courier-status/{shipmentId}`

**Authentication:** Bearer Token (COURIER)

**Purpose:** Update shipment status from the courier's perspective (pick up, delivery failed, delivered). Writes tracking history.

**Path Parameters:** `shipmentId` — the shipment's UUID.

**Request Body**

```json
{
  "status": "PICKED_UP",
  "note": "Shipment Picked up"
}
```

**Valid statuses:** `PICKED_UP`, `DELIVERY_FAILED`, `DELIVERED`.

---

#### Assign Courier By Admin

`PATCH /shipments/assign/{shipmentId}`

**Authentication:** Bearer Token (ADMIN)

**Purpose:** Auto-assign random **available** couriers from the pickup and delivery zones to the shipment.

**Path Parameters:** `shipmentId` — the shipment's UUID.

---

### 🚚 Employee / Courier

#### Apply For Courier

`POST /employee/be-courier`

**Authentication:** Bearer Token (CUSTOMER)

**Purpose:** Apply to become a courier by submitting a resume, vehicle documents, national ID images, and profile data via `multipart/form-data`.

**Body:** `multipart/form-data`

| Field | Type | Notes |
|-------|------|-------|
| `resume` | File | single file |
| `vehicleDocuments` | File(s) | up to 5 files |
| `nationalidPic` | File(s) | up to 2 files |
| `data` | Text | JSON string (see below) |

**`data` JSON fields**

```json
{
  "permanentAddress": "pabna sadar, pabna, bangladesh",
  "permanentCity": "pabna",
  "vehicleLicenseNumber": "58698774585",
  "qualifications": "BBA"
}
```

---

#### Get All Employee Applicant By Admin

`GET /employee/jobs`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Paginated list of courier job applicants.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | default `1` |
| `limit` | number | default `15` |
| `sortBy` | string | e.g. `createdAt` |
| `sortOrder` | string | `asc` / `desc` |
| `searchTerm` | string | free-text search |

---

#### Approved Or Reject By Admin

`PATCH /employee/jobs/{jobId}`

**Authentication:** Bearer Token (ADMIN)

**Purpose:** Approve or reject a courier application. Approval upgrades the applicant to an employee + courier and sets up their salary structure.

**Path Parameters:** `jobId` — the applicant's UUID.

**Request Body**

```json
{
  "status": "REJECTED"
}
```

**Valid values:** `APPROVED`, `REJECTED`.

---

#### Get All Employees By Admin

`GET /employee/all-employee`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Paginated list of all employees.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | default `1` |
| `limit` | number | default `20` |
| `sortBy` | string | e.g. `createdAt` |
| `sortOrder` | string | `asc` / `desc` |
| `employeeStatus` | enum | `ACTIVE`, etc. |

---

#### Get Employee By Id (Admin)

`GET /employee/emp/{id}`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Retrieve a single employee by ID. *(Discovered from the backend implementation.)*

**Path Parameters:** `id` — the employee's UUID.

*(Note: The Postman collection's "Get Employee By Id" item points at `/employee/all-employee`; the actual backend route is `/employee/emp/:id`.)*

---

### 🗺️ Zones

#### Create Zone By Admin

`POST /zones`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Create a delivery/pickup zone. The address is forward-geocoded to coordinates, and a circular boundary GeoJSON polygon is generated using the given radius.

**Request Body**

```json
{
  "name": "Pabna",
  "code": "PAB",
  "address": "Pabna, Bangladesh",
  "radiusKm": 40
}
```

**Validation rules:** name ≥2 chars; code 2–20 chars, uppercase letters/numbers/hyphen; radius 1–500 KM integer.

---

#### Get All Zone Public

`GET /zones`

**Authentication:** Public

**Purpose:** List all zones.

---

#### Get Zone By Id Public

`GET /zones/{zoneId}`

**Authentication:** Public

**Purpose:** Retrieve a single zone by ID.

**Path Parameters:** `zoneId` — the zone's UUID.

---

#### Update Zone By Admin

`PATCH /zones/{zoneId}`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Update zone details. Changing the address/radius regenerates the boundary polygon.

**Path Parameters:** `zoneId` — the zone's UUID.

**Request Body**

```json
{
  "name": "Rangpur",
  "code": "RAN",
  "address": "Rangpur, Bangladesh",
  "radiusKm": 90
}
```

---

#### Delete Zone By Admin

`DELETE /zones/{zoneId}`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Delete a zone. Deletion is blocked if the zone still has associated couriers or shipments.

**Path Parameters:** `zoneId` — the zone's UUID.

---

### 💳 Payments

#### Create CheckOut Session

`POST /payments/create`

**Authentication:** Bearer Token (CUSTOMER)

**Purpose:** Create a Stripe Checkout session for an unpaid shipment. Returns the session (typically with a URL to redirect the customer to Stripe).

**Request Body**

```json
{
  "shipmentId": "d652e5e3-a5a5-403f-a4e1-458e09410c5d"
}
```

---

#### Stripe Webhook

`POST /payments/webhook`

**Authentication:** Public (Stripe-signed)

**Purpose:** Receive and handle Stripe webhook events. Uses the raw body with `express.raw({ type: "application/json" })` and verifies the signature with the webhook secret. On successful payment, the shipment transitions to `PAID` / eligible for courier assignment and notifications are sent.

---

#### Get All Payment

`GET /payments/all-payments`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Paginated list of all payments.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | default `1` |
| `limit` | number | default `20` |
| `sortBy` | string | e.g. `createdAt` |
| `sortOrder` | string | `asc` / `desc` |
| `createdAt` | string | e.g. `thisWeek` |

---

### 💰 Payroll

#### Generate Payroll Request

`POST /payroll/generate`

**Authentication:** Bearer Token (ADMIN)

**Purpose:** Generate payroll records for all active employees for a given month/year, computing allowances, deductions, delivery earnings, and gross/net salary. Emails are queued to Redis and processed by a cron worker.

**Request Body**

```json
{
  "month": 8,
  "year": 2026,
  "bonus": 0,
  "totalDeduction": 600
}
```

**Validation rules:** month 1–12; year 2020–(currentYear+1); bonus/deduction non-negative.

---

#### Get My Salary

`GET /payroll/my-salary`

**Authentication:** Bearer Token (COURIER, ADMIN, SUPER_ADMIN)

**Purpose:** Retrieve the authenticated user's salary records for a given month/year.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `month` | number | 1–12 |
| `year` | number | 2020–(currentYear+1) |

---

#### Get All Salary By Admin

`GET /payroll/paid`

**Authentication:** Bearer Token (ADMIN, SUPER_ADMIN)

**Purpose:** Paginated list of paid payrolls, optionally filtered by month/year.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | default `1` |
| `limit` | number | default `20` |
| `month` | number | 1–12 |
| `year` | number | 2020–(currentYear+1) |

---

#### Pay Salary By Super Admin

`PATCH /payroll/{payrollId}/pay`

**Authentication:** Bearer Token (SUPER_ADMIN, ADMIN)

**Purpose:** Mark a payroll record as paid and record the payment reference.

**Path Parameters:** `payrollId` — the payroll record's UUID.

**Request Body**

```json
{
  "paymentReference": "BANK-TXN-20260907-001"
}
```

---

### 📋 Notification

#### Get Admin Notifications

`GET /notifications/admin`

**Authentication:** Bearer Token (ADMIN)

**Purpose:** Retrieve the admin's notifications (typically `GENERAL` type). *(Path per backend implementation; the Postman collection also references `/notifications/admin/{userId}`.)*

---

#### Get My Notifications

`GET /notifications/me`

**Authentication:** Bearer Token (COURIER, CUSTOMER)

**Purpose:** Retrieve the authenticated courier/customer's own notifications.

---

#### Delete Notifications By Admin

`DELETE /notifications/admin/{id}`

**Authentication:** Bearer Token (ADMIN)

**Purpose:** Delete a specific admin notification.

**Path Parameters:** `id` — the notification's UUID.

---

#### Delete My Notifications

`DELETE /notifications/me/{notificationId}`

**Authentication:** Bearer Token (COURIER, CUSTOMER)

**Purpose:** Delete one of the authenticated user's own notifications.

**Path Parameters:** `notificationId` — the notification's UUID.

---

### 👑 Super Admin & Audit Logs

#### Get All Audit Logs

`GET /super/admin/logs`

**Authentication:** Bearer Token (SUPER_ADMIN)

**Purpose:** Paginated, filterable list of all audit logs.

**Query Parameters**

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | default `1` |
| `limit` | number | default `20` |
| `sortBy` | string | e.g. `createdAt` |
| `sortOrder` | string | `asc` / `desc` |
| `type` | enum | `CURRENT`, `OLD` |
| `action` | enum | `AuditAction` |
| `resource` | enum | `AuditResource` |
| `createdAt` | string | e.g. `thisWeek` |

---

#### Create Employee User Admin & Courier

`POST /super/admin/create-employee`

**Authentication:** Bearer Token (SUPER_ADMIN)

**Purpose:** Create an employee directly — either an `ADMIN` or a `COURIER` — along with their salary structure and (for a courier) courier record.

**Request Body**

```json
{
  "name": "hayder dev",
  "email": "employee@example.com",
  "phone": "+8801711111111",
  "password": "User@1234",
  "role": "COURIER",
  "permanentAddress": "Pabna Sadar, Pabna",
  "permanentCity": "Pabna",
  "vehicleLicenseNumber": "TRX-5836d9df2dx5",
  "qualifications": "Bsc",
  "basicSalary": 15000,
  "houseAllowance": 5000,
  "medicalAllowance": 2000,
  "transportAllowance": 4000,
  "perDeliveryAmount": 0
}
```

**Role values:** `ADMIN`, `COURIER`.

---

#### Delete Admin User Soft

`PATCH /super/admin/{userId}`

**Authentication:** Bearer Token (SUPER_ADMIN)

**Purpose:** Soft-delete an admin user.

**Path Parameters:** `userId` — the admin user's UUID.

---

---

## 🧪 Demo / Test Credentials

The following accounts are **seeded automatically on server startup** and are intended for **local / demo testing only**:

> ⚠️ These credentials are intended for local/demo testing only. Never use demo credentials in production.

**Super Admin**

| Field | Value |
|-------|-------|
| Email | `superadmin@swift.com` |
| Password | `Swift@Admin123` |

**Test Admin**

| Field | Value |
|-------|-------|
| Email | `testadmin@swift.com` |
| Password | `Swift@Admin123` |

**Test Courier**

| Field | Value |
|-------|-------|
| Email | `testcourierdhaka@swift.com` |
| Password | `Swift@User123` |

> These records are created from environment variables (`SUPER_ADMIN_*`, `TEST_ADMIN_*`, `TEST_COURIER_DHA_ZONE_*`) if they do not already exist. The seeded Super Admin is created with a **FIXED** salary structure, the Test Admin with **FIXED** salary, and the Test Courier with a **BASE_PLUS_DELIVERY** salary structure assigned to the Dhaka zone.

---

## 🧭 API Workflow

A typical end-to-end shipment flow:

1. **Register** a customer (`POST /auth/sign-up`) → **verify email** (`POST /auth/verify-email`) → receives `accessToken` / `refreshToken`.
2. **Create a shipment** (`POST /shipments`) — auto-resolves pickup/delivery zones.
3. **Admin approves** for payment (`PATCH /shipments/admin-status/:id` → `READY_FOR_PAYMENT`).
4. **Pay** via Stripe (`POST /payments/create`) → Stripe webhook marks the shipment paid.
5. **Admin assigns** couriers (`PATCH /shipments/assign/:id`) — auto-picks available couriers in the zones.
6. **Courier updates** status through pickup, transit, and delivery (`PATCH /shipments/courier-status/:id`).
7. **Payroll** — Admin generates monthly payroll (`POST /payroll/generate`); Super Admin pays (`PATCH /payroll/:id/pay`).
8. **Audit** — every step is recorded in the audit log (Super Admin views via `GET /super/admin/logs`).

---

## 🛡️ Security

- Passwords hashed with **bcrypt** (configurable salt rounds).
- **JWT** access + refresh tokens; refresh token rotated and stored in an HTTP-only cookie.
- Google OAuth **ID-token** verification.
- **Helmet** sets secure HTTP headers; **CORS** restricted to the configured frontend origin with credentials.
- **Rate limiting** (100 requests / 10 min per IP) protects the whole `/api` surface.
- Stripe webhook signatures **verified** with a signing secret.
- Suspended / deleted accounts are rejected at the auth middleware.
- Global error handler suppresses internal error details in production.
- Environment secrets are loaded from `.env` and **never** committed; `.env` and `src/generated` are gitignored.

---

## 🧰 Development Tools

### Linting & Formatting (Biome)

```bash
npm run lint:check     # lint without changes
npm run lint:fix       # auto-fix lint issues
npm run format:check   # check formatting
npm run format:fix     # auto-format
```

### Prisma Workflows

```bash
npx prisma generate            # regenerate the client into src/generated
npx prisma migrate dev         # create + apply a migration in development
npx prisma migrate deploy      # apply migrations for deployments
npx prisma studio              # open the database browser UI
```

### Stripe Local Webhook

```bash
npm run stripe:webhook         # stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

### Postman

A complete Postman collection is included:

`Swift_Courier_System_Management.postman_collection.json`

- **Environment variables:** `baseUrl`, `accessToken`, `refreshToken`.
- The `accessToken` / `refreshToken` variables are automatically set by the test scripts on **Verify Email OTP** and **Login**.
- Import the collection, create an environment with `baseUrl = http://localhost:5000/api/v1`, and you are ready to exercise every endpoint.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 📬 Contact

**Md. Hayder Ali**

- 📧 **Email:** [hayderbd4290@gmail.com](mailto:hayderbd4290@gmail.com)
- 📱 **Phone / WhatsApp:** [+8801771814597](tel:+8801771814597)
- 🌐 **Portfolio:** [https://hayder4290.vercel.app](https://hayder4290.vercel.app)
- 💼 **LinkedIn:** [https://www.linkedin.com/in/hayder-ali-bb9175349](https://www.linkedin.com/in/hayder-ali-bb9175349)
- 🐙 **GitHub:** [https://github.com/Hayder987](https://github.com/Hayder987)

---

<div align="center">

**Swift Courier** — Built with ❤️ by [Md. Hayder Ali](https://hayder4290.vercel.app)

*Production-grade courier & delivery management backend*

</div>
