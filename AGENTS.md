# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

10Pearls LMS & Training Portal — a dark-themed, futuristic internal tool for managing employee training. Phase 1 is in active development. Do not build Phase 2 features (quiz engine, AI recommendations, notifications, SSO, certificates, reports, feedback, bulk assignment, learning paths).

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS, React Context + useReducer for state
- **Backend**: Node.js + Express.js, REST API
- **Database**: PostgreSQL (via `pg` pool)
- **Auth**: JWT (8-hour expiry, stored in localStorage)

## Commands

```bash
# Backend (server/)
npm install
npm run migrate      # apply schema SQL
npm run seed         # insert test data
npm run dev          # nodemon on port 5000

# Frontend (client/)
npm install
npm run dev          # Vite on port 5173
npm run build
npm run lint
```

Database setup:
```bash
createdb lms_db
```

## Project Structure

```
/
├── client/src/
│   ├── api/          # axios instance + per-resource endpoint functions
│   ├── components/
│   │   ├── ui/       # Button, Card, Badge, Input, Table, Modal, Sidebar
│   │   └── layout/   # AppShell, Sidebar, TopBar
│   ├── pages/        # one file per route
│   ├── context/      # AuthContext (JWT decode, login/logout)
│   └── hooks/        # useAuth, useApi
│
└── server/src/
    ├── routes/        # auth, users, trainings, assignments, dashboard
    ├── controllers/
    ├── middleware/    # authenticate (JWT), authorize(...roles), errorHandler
    ├── db/            # pg pool, migrations SQL, seed script
    └── utils/
```

## Environment Variables

```env
# server/.env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/lms_db
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development

# client/.env
VITE_API_BASE_URL=http://localhost:5000
```

## Auth & RBAC

JWT payload: `{ userId, role, name, email }`. Backend uses two middleware layers:
- `authenticate` — validates the JWT on every protected route
- `authorize(...roles)` — array of allowed roles, applied per-route

Role capabilities:
| Action | Admin | Instructor | Manager | Employee |
|---|---|---|---|---|
| Create/edit trainings | ✅ | ✅ | ❌ | ❌ |
| Assign trainings | ✅ | ❌ | ❌ | ❌ |
| View all users | ✅ | ❌ | ❌ | ❌ |
| View team progress | ✅ | ❌ | ✅ | ❌ |
| View own assignments | ✅ | ✅ | ✅ | ✅ |
| Mark progress/complete | ✅ | ✅ | ✅ | ✅ |

Frontend gates pages via a `ProtectedRoute` component that reads from `AuthContext`.

## API Shape

- `GET /api/trainings` — scoped by role: Admin/Instructor see all; Employee sees only assigned
- `GET /api/assignments` — scoped by role; employees see their own, admins see all
- `PATCH /api/assignments/:id/progress` — updates `progress_pct`
- `PATCH /api/assignments/:id/complete` — sets status to `completed`, records `completed_at`
- Dashboard endpoints are role-specific: `/api/dashboard/admin|manager|instructor|employee`

## Design System

Dark-first UI. All CSS variables must be applied consistently:

```css
--color-bg:         #0A0B0F;
--color-surface:    #12141A;
--color-border:     #1E2029;
--color-accent:     #D4FF27;   /* lime-yellow — primary CTA only */
--color-accent-dim: #A8CC1F;
--color-text:       #F0F2F5;
--color-muted:      #6B7280;
--color-danger:     #FF4D4D;
--color-success:    #22C55E;
--color-warning:    #F59E0B;
```

Fonts (Google Fonts): `"Syne"` for headings, `"DM Sans"` for body, `"JetBrains Mono"` for badges/codes.

Component conventions:
- Cards: `border border-[--color-border] bg-[--color-surface] rounded-2xl`
- Primary buttons: solid `--color-accent` with dark text, glow shadow on hover
- Inputs: dark surface, accent focus ring
- Tables: borderless rows, hover highlight only — no zebra stripes
- Status badges: pill-shaped, use success/warning/danger/muted palette
- Transitions: `transition-all duration-200 ease-out` on all interactive elements; no heavy animations

## Seed Credentials

Test accounts pre-seeded for development (shown on login page in dev mode):

| Role | Email | Password |
|---|---|---|
| Admin | admin@10pearls.com | Admin@123 |
| Instructor | instructor@10pearls.com | Instructor@123 |
| Manager | manager@10pearls.com | Manager@123 |
| Employee | employee@10pearls.com | Employee@123 |

## Database Schema Key Points

- All PKs are `UUID` using `gen_random_uuid()`
- `users.is_active = false` is soft delete — never hard delete users
- `training_assignments` has a `UNIQUE (training_id, user_id)` constraint
- `trainings.status` flow: `draft` → `published` → `archived`
- `training_assignments.status` flow: `not_started` → `in_progress` → `completed`
- Manager dashboard is scoped to their `department` (join via `users.department`)
