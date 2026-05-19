CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'employee', 'manager');
CREATE TYPE training_type AS ENUM ('self_paced', 'instructor_led');
CREATE TYPE training_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE material_type AS ENUM ('video', 'document', 'link', 'presentation');
CREATE TYPE assignment_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL,
  department    VARCHAR(100),
  job_title     VARCHAR(100),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trainings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  type          training_type NOT NULL,
  category      VARCHAR(100),
  duration_hrs  DECIMAL(5,2),
  is_mandatory  BOOLEAN DEFAULT false,
  created_by    UUID REFERENCES users(id),
  status        training_status DEFAULT 'draft',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id   UUID REFERENCES trainings(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by   UUID REFERENCES users(id),
  due_date      DATE,
  status        assignment_status DEFAULT 'not_started',
  progress_pct  INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (training_id, user_id)
);

CREATE TABLE IF NOT EXISTS training_materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id   UUID REFERENCES trainings(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  type          material_type NOT NULL,
  url           TEXT,
  order_index   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
