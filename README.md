# 10Pearls LMS & Training Portal

A dark-themed internal learning management system for managing employee training, certifications, and progress — built for 10Pearls.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, React Context |
| Backend | Node.js + Express 5, REST API |
| Database | PostgreSQL 16 |
| Auth | JWT (8-hour expiry) |
| Testing (server) | Jest + Supertest |
| Testing (client) | Vitest + React Testing Library |
| CI | GitHub Actions |

---

## Quick Start

### 1. Start the database

```bash
docker compose up -d
```

This runs Postgres 16 on **port 5433** (intentionally offset to avoid macOS AirPlay conflicts).

Or manually:

```bash
createdb lms_db
```

### 2. Configure the server

Create `server/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lms_db
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

### 3. Install, migrate, and seed

```bash
cd server
npm install
npm run migrate   # applies schema.sql
npm run seed      # inserts test users, trainings, assignments
npm run dev       # starts on port 5000
```

### 4. Start the client

```bash
cd client
npm install
npm run dev       # starts on port 5173
```

Open [http://localhost:5173](http://localhost:5173).

---

## Seed Credentials

Pre-seeded test accounts (shown on the login page in development):

| Role | Email | Password |
|---|---|---|
| Admin | admin@10pearls.com | Admin@123 |
| Instructor | instructor@10pearls.com | Instructor@123 |
| Manager | manager@10pearls.com | Manager@123 |
| Employee | employee@10pearls.com | Employee@123 |

---

## Project Structure

```
/
├── .github/workflows/
│   └── ci.yml               # lint + test on every PR
├── client/
│   └── src/
│       ├── api/             # axios instance + per-resource functions
│       ├── components/
│       │   ├── ui/          # Button, Card, Badge, Input, Table, Modal
│       │   └── layout/      # AppShell, Sidebar
│       ├── context/         # AuthContext, ToastContext, NotificationsContext
│       ├── pages/           # one file per route
│       └── hooks/
└── server/
    └── src/
        ├── routes/          # auth, users, trainings, assignments, dashboard,
        │                    # reports, certifications, feedback, notifications
        ├── middleware/      # authenticate (JWT), authorize(...roles), errorHandler
        ├── db/              # pool.js, migrate.js, schema.sql, seed.js
        ├── utils/           # notify.js (fire-and-forget notifications)
        └── __tests__/
            ├── integration/ # supertest route tests
            └── unit/        # middleware unit tests
```

---

## Available Scripts

### Server (`cd server`)

```bash
npm run dev            # nodemon dev server (port 5000)
npm run migrate        # apply schema.sql to the database
npm run seed           # seed test data
npm run lint           # ESLint
npm run test           # Jest
npm run test:coverage  # Jest with coverage report
```

### Client (`cd client`)

```bash
npm run dev            # Vite dev server (port 5173)
npm run build          # production build
npm run lint           # ESLint
npm run test           # Vitest
npm run test:coverage  # Vitest with v8 coverage
```

---

## Role-Based Access Control

JWT payload: `{ userId, role, name, email }`

Two middleware layers on every protected route:
- `authenticate` — validates the JWT
- `authorize(...roles)` — per-route role allowlist

| Action | Admin | Instructor | Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| Create / edit trainings | ✅ | ✅ | ❌ | ❌ |
| Assign trainings | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View team progress | ✅ | ❌ | ✅ | ❌ |
| Award certificates | ✅ | ❌ | ✅ | ❌ |
| Export reports | ✅ | ✅ | ✅ | ✅ (own data) |
| Mark progress / complete | ✅ | ✅ | ✅ | ✅ |
| Submit quiz attempts | ✅ | ✅ | ✅ | ✅ |

---

## API Overview

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/trainings                        # role-scoped
POST   /api/trainings                        # admin, instructor
GET    /api/trainings/:id
PUT    /api/trainings/:id
DELETE /api/trainings/:id
POST   /api/trainings/:id/quiz/questions
DELETE /api/trainings/:id/quiz/questions/:qid
POST   /api/trainings/:id/quiz/attempts

GET    /api/assignments                      # role-scoped
POST   /api/assignments                      # admin
PATCH  /api/assignments/:id/progress
PATCH  /api/assignments/:id/complete
PATCH  /api/assignments/:id/uncomplete

GET    /api/reports/completion?format=csv|pdf

GET    /api/certifications
POST   /api/certifications/:id/award

GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all

GET    /api/dashboard/admin|manager|instructor|employee
```

---

## CI / CD

GitHub Actions runs on every push and pull request:

- **Server job** — spins up Postgres 16, migrates, seeds, runs ESLint, then `jest --coverage`
- **Client job** — runs ESLint, then `vitest --coverage`

Both jobs run in parallel. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Database Notes

- All primary keys are `UUID` via `gen_random_uuid()`
- `users.is_active = false` is a soft delete — never hard-delete user rows
- `training_assignments` enforces `UNIQUE (training_id, user_id)`
- Training status flow: `draft` → `published` → `archived`
- Assignment status flow: `not_started` → `in_progress` → `completed`
- Manager dashboard and reports are scoped to `users.department`
