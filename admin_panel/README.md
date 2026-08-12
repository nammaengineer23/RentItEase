# RentItEase Admin Panel

React + TypeScript + Vite foundation for the RentItEase administrator application.

## Current foundation

- Admin login
- JWT access-token storage
- `/auth/me` session validation
- ADMIN-role enforcement in the UI
- Protected dashboard route
- Admin dashboard connected to `GET /api/v1/admin/dashboard`
- Responsive sidebar/layout
- Foundation ready for user, property, review/visit, payment and membership modules

## Backend API

The existing backend uses:

```text
http://localhost:3000/api/v1
```

The admin endpoints already present in the backend include:

```text
GET    /admin/dashboard
GET    /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id/activate
PATCH  /admin/users/:id/deactivate
DELETE /admin/users/:id

GET    /admin/properties
GET    /admin/properties/:id
PATCH  /admin/properties/:id/hide
PATCH  /admin/properties/:id/unhide
DELETE /admin/properties/:id

GET    /admin/reviews
DELETE /admin/reviews/:id

GET    /admin/visits
PATCH  /admin/visits/:id/approve
PATCH  /admin/visits/:id/reject
PATCH  /admin/visits/:id/complete

GET    /admin/analytics
```

## Run

From the `admin_panel` directory:

```bash
npm install
copy .env.example .env
npm run dev
```

For a production build:

```bash
npm run build
```

The frontend expects the backend to be running at:

```text
http://localhost:3000
```

CORS must allow the Vite development origin (`http://localhost:5173`) in the NestJS backend.
