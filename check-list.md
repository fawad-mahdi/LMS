# 10Pearls LMS — Project Checklist

Living document tracking what's built, in-progress, and pending. Updated as work progresses.

---

## ✅ Infrastructure & Setup

- [x] Project directory structure (`client/` + `server/`)
- [x] Docker Compose — Postgres 16 on port 5433 (avoids macOS conflict)
- [x] Server `.env` with correct DB URL and port (5001, avoids AirPlay conflict)
- [x] `.gitignore` — node_modules, dist, .env
- [x] `CLAUDE.md` — architecture documentation for future sessions

---

## ✅ Backend — Database

- [x] `schema.sql` — all 4 tables: `users`, `trainings`, `training_assignments`, `training_materials`
- [x] ENUMs: `user_role`, `training_type`, `training_status`, `material_type`, `assignment_status`
- [x] UUIDs with `gen_random_uuid()`
- [x] `UNIQUE (training_id, user_id)` constraint on assignments
- [x] `migrate.js` — applies schema
- [x] `seed.js` — seeds 6 users, 5 trainings, sample assignments, materials
- [x] All 4 test accounts seeded (admin, instructor, manager, employee)

---

## ✅ Backend — API

- [x] `POST /api/auth/login` — JWT (8h expiry)
- [x] `POST /api/auth/logout`
- [x] `GET  /api/auth/me`
- [x] `GET/POST /api/users` (Admin only)
- [x] `GET/PUT/DELETE /api/users/:id` (Admin only, soft delete)
- [x] `GET/POST /api/trainings` (role-scoped)
- [x] `GET/PUT/DELETE /api/trainings/:id`
- [x] `POST/DELETE /api/trainings/:id/materials`
- [x] `GET/POST /api/assignments` (role-scoped)
- [x] `GET /api/assignments/:id`
- [x] `PATCH /api/assignments/:id/progress`
- [x] `PATCH /api/assignments/:id/complete`
- [x] `DELETE /api/assignments/:id` (Admin only)
- [x] `GET /api/dashboard/admin`
- [x] `GET /api/dashboard/manager`
- [x] `GET /api/dashboard/instructor`
- [x] `GET /api/dashboard/employee`
- [x] `authenticate` middleware (JWT validation)
- [x] `authorize(...roles)` middleware (RBAC)
- [x] `errorHandler` middleware

---

## ✅ Frontend — Foundation

- [x] Vite + React scaffold
- [x] Tailwind CSS with custom design token colors
- [x] Google Fonts: Syne (display), DM Sans (body), JetBrains Mono (mono)
- [x] CSS variables for full design system
- [x] Dot-grid background texture
- [x] Custom scrollbars
- [x] Staggered animation utilities (`animate-fade-up`, delay classes)
- [x] Progress bar animation (`progress-animate`)
- [x] `useCountUp` hook — ease-out count-up animation for stats

---

## ✅ Frontend — Components

- [x] `Badge` — pill badges with dot indicator and 5 variants
- [x] `Button` — 4 variants (primary/secondary/danger/ghost), 3 sizes, accent glow on primary
- [x] `Card` — with hover mode and shadow
- [x] `Input` — with label, error, hint, focus ring
- [x] `Select` — styled dropdown with chevron icon
- [x] `StatCard` — animated count-up, icon slot, accent variant
- [x] `Spinner` — 3 sizes

---

## ✅ Frontend — Layout

- [x] `Sidebar` — SVG icons, active left-border accent, user avatar (initials), role badge, logout
- [x] `AppShell` — scroll reset on route change, dot-grid background, page fade-in
- [x] `ProtectedRoute` — loading state with branded spinner, role-based redirect

---

## ✅ Frontend — Pages

- [x] **Login** — split layout (form left, dev credentials right), animated entrance, click-to-fill credential cards
- [x] **Dashboard** — role-aware stats, time-based greeting, animated count-up numbers, skeleton loading, quick-action buttons
- [x] **Trainings** — search bar, filter pills (All/Self-paced/Instructor-led/Mandatory), animated card list, category accent border
- [x] **Training Detail** — breadcrumb, materials list with type icons, edit/delete for admin+instructor
- [x] **Training Form** — create & edit, custom checkbox toggle, styled selects
- [x] **Assignments** — status tabs with counts, animated progress bars, overdue detection, mark-complete button
- [x] **Assignment Form** — select-all/deselect-all, custom checkbox list, employee picker
- [x] **Users** — search bar, avatar initials, role badges, status badges, table layout
- [x] **User Form** — grid layout, password hint
- [x] **User Detail** — avatar, badges, field grid

---

## ✅ Frontend — Auth & Routing

- [x] `AuthContext` — JWT decode, login/logout, auto-load on app start
- [x] Axios interceptors — auto Bearer token, 401 → redirect to login
- [x] Role-gated routes (`ProtectedRoute` with `roles` prop)
- [x] All 9 routes wired in `App.jsx`

---

## ✅ Testing & Quality

### Server (Jest + Supertest)
- [x] Jest configured with `node` env, `globalTeardown`, `forceExit`
- [x] Test setup file overrides DATABASE_URL and JWT_SECRET before module load
- [x] Test helpers: `getToken(role)`, `createTestUser`, cleanup utilities
- [x] **Unit tests** (`authenticate`, `authorize` middleware) — 13 tests
- [x] **Integration tests** — 54 tests across auth, users, trainings, assignments, dashboard
- [x] All routes covered: success cases, auth failures, role-based 403s, validation 400s
- [x] **67 tests passing, 0 failures**

### Client (Vitest + React Testing Library)
- [x] Vitest configured with `jsdom`, globals, `@testing-library/jest-dom` matchers
- [x] **Unit tests** — Badge, Button, Input, Select, StatCard, useCountUp — 55 tests
- [x] **Integration tests** — Login page (credential fill, form submission, error handling) — 9 tests
- [x] `useCountUp` hook tested with fake timers + rAF stubs
- [x] **64 tests passing, 0 failures**

### Linting (ESLint 9 flat config)
- [x] `client/eslint.config.js` — React + React Hooks + Vitest globals
- [x] `server/eslint.config.mjs` — Node globals + Jest globals
- [x] Both lint runs are clean (0 errors, 0 warnings)
- [x] `npm run lint` available in both packages

### Scripts available
```bash
# Client (from client/)
npm run lint          # ESLint
npm run build         # Vite production build
npm run test          # Vitest (run mode)
npm run test:watch    # Vitest (watch mode)
npm run test:coverage # Vitest + v8 coverage

# Server (from server/)
npm run lint          # ESLint
npm run test          # Jest (all tests)
npm run test:coverage # Jest + coverage
```

---

## 🚧 Phase 2 — In Progress

- [x] Quiz & evaluation engine — first slice: training-scoped multiple-choice questions, scored attempts, learner UI, admin/instructor question management
- [ ] AI training recommendations
- [ ] In-app notifications + email reminders
- [ ] Exportable reports (CSV/PDF)
- [ ] Certificates & badges on completion
- [ ] Feedback & star ratings per training
- [ ] Microsoft SSO (Azure AD)
- [ ] Bulk CSV assignment upload
- [ ] Learning paths (ordered training sequences)
- [ ] External platform credential management (Udemy vault)

---

## ✅ Nice-to-Have (Phase 1 Polish) — Complete

- [x] Toast notifications — `ToastContext` with success/error/warning/info; wired into all action pages
- [x] Training materials — add/delete materials in TrainingForm (create & edit flows)
- [x] Inline progress update slider — drag-to-update range input on assignment flat cards; commits on pointer-up
- [x] User edit form — `UserForm` supports create & edit; Edit button on UserDetail; `/users/:id/edit` route added
- [x] Dashboard drill-down — stat cards are clickable, navigate to relevant filtered page
- [x] Assignments grouped views — Individual / By Training / By User with search, sort, expand-all
- [x] Undo complete — `PATCH /uncomplete` resets assignment to not_started + clears completed_at
- [x] Training publish button — one-click Publish CTA on detail page for draft trainings
- [x] Mobile-responsive layout — sidebar slides in from left on mobile; hamburger + backdrop overlay

## 🔲 Skipped by Design

- [ ] Pagination — grouped assignments view addresses scale; server-side pagination deferred
- [ ] Dark/light mode toggle — dark-only by design (CLAUDE.md)

---

_Last updated: 2026-05-19 — Phase 2 started with quiz & evaluation engine_
