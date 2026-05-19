# 10Pearls LMS & Training Portal — Claude Code Spec

> **Goal**: Get a working app running fast. Phase 1 is lean, functional, and beautiful. Phase 2 adds power features.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Auth | JWT (email + password, test credentials pre-seeded) |
| Styling | Tailwind CSS |
| State | React Context + useReducer (or Zustand if preferred) |
| API | REST |

---

## Design System

**Aesthetic direction**: Futuristic minimalism. Dark-first UI. Think mission control meets a premium SaaS product. Clean, spacious, intentional.

### Palette (CSS variables)
```css
--color-bg:         #0A0B0F;   /* near-black background */
--color-surface:    #12141A;   /* card / panel surfaces */
--color-border:     #1E2029;   /* subtle borders */
--color-accent:     #D4FF27;   /* 10Pearls lime-yellow — primary CTA, highlights */
--color-accent-dim: #A8CC1F;   /* accent hover/active */
--color-text:       #F0F2F5;   /* primary text */
--color-muted:      #6B7280;   /* secondary/label text */
--color-danger:     #FF4D4D;   /* errors, overdue indicators */
--color-success:    #22C55E;   /* completion indicators */
--color-warning:    #F59E0B;   /* in-progress, pending */
```

### Typography
- Display / Headings: `"Syne"` (Google Fonts) — geometric, futuristic
- Body / UI: `"DM Sans"` (Google Fonts) — clean, modern legibility
- Monospace / Badges: `"JetBrains Mono"` — for IDs, codes, stats

### Component Principles
- Cards: `border border-[--color-border] bg-[--color-surface] rounded-2xl`
- Buttons (primary): solid `--color-accent` with dark text, slight shadow glow on hover
- Inputs: dark surface, accent-colored focus ring
- Sidebar: fixed left, collapsible, icon + label nav
- Tables: borderless rows with hover highlight, no zebra stripes
- Status badges: pill-shaped, color-coded (success/warning/danger/muted)
- Transitions: `transition-all duration-200 ease-out` on all interactive elements
- No heavy animations — subtle opacity fades and translate-y on mount only

---

## Phase 1 Scope

### What's IN Phase 1
1. Authentication (JWT, test credentials)
2. User management (seed data + Admin CRUD)
3. Training creation & management
4. Training assignment to employees
5. Employee dashboard (assigned trainings, progress)
6. Admin dashboard (overview stats, completion rates)
7. Instructor dashboard (manage trainings, view learner progress)
8. Manager dashboard (team completion overview)
9. Basic training progress tracking (mark as complete)
10. Role-based routing & access control

### What's OUT (Phase 2)
- Quiz & evaluation engine
- AI recommendation engine
- Notifications / email reminders
- External platform (Udemy) credential management
- Exportable reports / Power BI
- Microsoft SSO
- Certificates & badges
- Feedback & rating system

---

## Database Schema

### `users`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
name          VARCHAR(255) NOT NULL
email         VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
role          ENUM('admin', 'instructor', 'employee', 'manager') NOT NULL
department    VARCHAR(100)
job_title     VARCHAR(100)
is_active     BOOLEAN DEFAULT true
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
```

### `trainings`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
title         VARCHAR(255) NOT NULL
description   TEXT
type          ENUM('self_paced', 'instructor_led') NOT NULL
category      VARCHAR(100)
duration_hrs  DECIMAL(5,2)
is_mandatory  BOOLEAN DEFAULT false
created_by    UUID REFERENCES users(id)
status        ENUM('draft', 'published', 'archived') DEFAULT 'draft'
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
```

### `training_assignments`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
training_id   UUID REFERENCES trainings(id) ON DELETE CASCADE
user_id       UUID REFERENCES users(id) ON DELETE CASCADE
assigned_by   UUID REFERENCES users(id)
due_date      DATE
status        ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started'
progress_pct  INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100)
completed_at  TIMESTAMPTZ
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
UNIQUE (training_id, user_id)
```

### `training_materials`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
training_id   UUID REFERENCES trainings(id) ON DELETE CASCADE
title         VARCHAR(255) NOT NULL
type          ENUM('video', 'document', 'link', 'presentation') NOT NULL
url           TEXT
order_index   INTEGER DEFAULT 0
created_at    TIMESTAMPTZ DEFAULT NOW()
```

---

## API Endpoints

### Auth
```
POST   /api/auth/login          — email + password → JWT
POST   /api/auth/logout
GET    /api/auth/me             — get current user from token
```

### Users (Admin only)
```
GET    /api/users               — list all users (filterable by role, dept)
POST   /api/users               — create user
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id           — soft delete (set is_active = false)
```

### Trainings
```
GET    /api/trainings           — list (Admin/Instructor see all; Employee sees assigned)
POST   /api/trainings           — create (Admin/Instructor only)
GET    /api/trainings/:id
PUT    /api/trainings/:id       — (Admin/Instructor only)
DELETE /api/trainings/:id       — (Admin only)
POST   /api/trainings/:id/materials   — add material
DELETE /api/trainings/:id/materials/:materialId
```

### Assignments
```
GET    /api/assignments                     — list (scoped by role)
POST   /api/assignments                     — assign training(s) to user(s)
GET    /api/assignments/:id
PATCH  /api/assignments/:id/progress        — update progress_pct
PATCH  /api/assignments/:id/complete        — mark as completed
DELETE /api/assignments/:id                 — (Admin only)
```

### Dashboard
```
GET    /api/dashboard/admin     — total users, trainings, completion rate, overdue count
GET    /api/dashboard/manager   — team stats (scoped to manager's department)
GET    /api/dashboard/instructor — trainings created, learner counts, avg completion
GET    /api/dashboard/employee  — my assigned, completed, in-progress counts
```

---

## Frontend Pages & Routes

### Public
- `/login` — login form with test credential hints shown on screen

### Protected (role-gated)
| Route | Role | Description |
|---|---|---|
| `/dashboard` | All | Role-aware dashboard landing |
| `/trainings` | All | Training library (filtered by role) |
| `/trainings/new` | Admin, Instructor | Create training form |
| `/trainings/:id` | All | Training detail + materials |
| `/trainings/:id/edit` | Admin, Instructor | Edit training |
| `/assignments` | All | My assignments (employee) or all (admin) |
| `/assignments/new` | Admin | Assign training to user(s) |
| `/users` | Admin | User management table |
| `/users/new` | Admin | Create user form |
| `/users/:id` | Admin | User detail + assignment history |

---

## Seed Data (for development & testing)

Pre-seed the following test accounts — display credentials visibly on the login page in dev mode:

| Role | Email | Password |
|---|---|---|
| Admin | admin@10pearls.com | Admin@123 |
| Instructor | instructor@10pearls.com | Instructor@123 |
| Manager | manager@10pearls.com | Manager@123 |
| Employee | employee@10pearls.com | Employee@123 |

Also seed:
- 3–5 sample trainings (mix of mandatory/optional, self-paced/instructor-led)
- 2–3 employees with training assignments in various statuses (not_started, in_progress, completed)

---

## Project Structure

```
/
├── client/                   # React (Vite)
│   ├── src/
│   │   ├── api/              # axios instance + endpoint functions
│   │   ├── components/       # shared UI components
│   │   │   ├── ui/           # Button, Card, Badge, Input, Table, Modal, Sidebar
│   │   │   └── layout/       # AppShell, Sidebar, TopBar
│   │   ├── pages/            # one file per route
│   │   ├── context/          # AuthContext
│   │   ├── hooks/            # useAuth, useApi
│   │   └── utils/
│   └── index.html
│
├── server/                   # Node.js + Express
│   ├── src/
│   │   ├── routes/           # auth, users, trainings, assignments, dashboard
│   │   ├── controllers/
│   │   ├── middleware/        # auth, rbac, errorHandler
│   │   ├── db/               # pg pool, migrations, seed
│   │   └── utils/
│   └── index.js
│
├── .env.example
└── README.md
```

---

## Auth & RBAC

- JWT stored in `localStorage` (acceptable for internal tool)
- Token payload: `{ userId, role, name, email }`
- Token expiry: 8 hours
- Middleware: `authenticate` (validates JWT), `authorize(...roles)` (role check)
- Frontend: `AuthContext` wraps app, `ProtectedRoute` component gates pages by role

### Role permission summary
| Action | Admin | Instructor | Manager | Employee |
|---|---|---|---|---|
| Create/edit trainings | ✅ | ✅ | ❌ | ❌ |
| Assign trainings | ✅ | ❌ | ❌ | ❌ |
| View all users | ✅ | ❌ | ❌ | ❌ |
| View team progress | ✅ | ❌ | ✅ | ❌ |
| View own assignments | ✅ | ✅ | ✅ | ✅ |
| Mark progress/complete | ✅ | ✅ | ✅ | ✅ |

---

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

---

## Running the App

```bash
# 1. Setup DB
createdb lms_db
cd server && npm install
npm run migrate    # runs schema SQL
npm run seed       # inserts test data

# 2. Start backend
npm run dev        # nodemon on port 5000

# 3. Start frontend
cd ../client && npm install
npm run dev        # Vite on port 5173
```

---

## Phase 2 Backlog (do not build yet)

- **Quiz engine**: multi-question quizzes per training, attempt tracking, auto-complete on pass
- **AI recommendations**: resume upload → skill extraction → suggested trainings
- **Notifications**: in-app + email (deadline reminders, assignment alerts)
- **Exportable reports**: CSV/PDF download of completion data
- **Certificates**: auto-generate on completion
- **Feedback system**: star ratings + comments per training
- **Microsoft SSO**: Azure AD integration (requires app registration)
- **External platform management**: Udemy credential vault
- **Bulk assignment**: CSV upload to assign trainings to many employees at once
- **Learning paths**: ordered sequences of trainings

---

*Spec version: 1.0 — 18 May 2026*
