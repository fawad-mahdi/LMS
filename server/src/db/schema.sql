CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'employee', 'manager');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE training_type AS ENUM ('self_paced', 'instructor_led');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE training_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE material_type AS ENUM ('video', 'document', 'link', 'presentation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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
  certificate_awarded_at TIMESTAMPTZ,
  certificate_awarded_by UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (training_id, user_id)
);

ALTER TABLE training_assignments
  ADD COLUMN IF NOT EXISTS certificate_awarded_at TIMESTAMPTZ;

ALTER TABLE training_assignments
  ADD COLUMN IF NOT EXISTS certificate_awarded_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS training_materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id   UUID REFERENCES trainings(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  type          material_type NOT NULL,
  url           TEXT,
  order_index   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id          UUID REFERENCES trainings(id) ON DELETE CASCADE,
  prompt               TEXT NOT NULL,
  options              JSONB NOT NULL,
  correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index >= 0),
  points               INTEGER DEFAULT 1 CHECK (points > 0),
  order_index          INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  message     TEXT NOT NULL,
  entity_id   UUID,
  entity_type VARCHAR(50),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_prerequisites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id      UUID REFERENCES trainings(id) ON DELETE CASCADE,
  prerequisite_id  UUID REFERENCES trainings(id) ON DELETE CASCADE,
  order_index      INTEGER NOT NULL DEFAULT 0,
  UNIQUE (training_id, prerequisite_id),
  CHECK (training_id != prerequisite_id)
);

CREATE TABLE IF NOT EXISTS training_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES trainings(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (training_id, user_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id     UUID REFERENCES trainings(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  answers         JSONB NOT NULL,
  score_pct       INTEGER NOT NULL CHECK (score_pct BETWEEN 0 AND 100),
  correct_count   INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  passed          BOOLEAN DEFAULT false,
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);
