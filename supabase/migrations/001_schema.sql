-- ================================================================
-- Strefa Trenera — schemat bazy danych
-- Uruchom w Supabase: SQL Editor → New query → wklej i uruchom
-- ================================================================

-- Coaches (profile trenera, rozszerza auth.users)
CREATE TABLE IF NOT EXISTS coaches (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  plan       TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: automatycznie utwórz profil trenera po rejestracji
CREATE OR REPLACE FUNCTION handle_new_coach()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO coaches (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_coach();

-- Athletes
CREATE TABLE IF NOT EXISTS athletes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id       UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  avatar         TEXT NOT NULL DEFAULT '',
  slug           TEXT NOT NULL,
  invite_token   TEXT NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex'),
  email          TEXT,
  phone          TEXT,
  goal           TEXT DEFAULT '',
  package        TEXT NOT NULL DEFAULT 'Starter',
  package_price  NUMERIC NOT NULL DEFAULT 249,
  status         TEXT NOT NULL DEFAULT 'ok',
  age            INTEGER,
  city           TEXT DEFAULT '',
  join_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  personal_bests JSONB NOT NULL DEFAULT '{}',
  injuries       TEXT[] NOT NULL DEFAULT '{}',
  coach_notes    TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_id, slug)
);

-- Training sessions
CREATE TABLE IF NOT EXISTS training_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id       UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id         UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  type             TEXT NOT NULL DEFAULT 'easy',
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  planned_distance NUMERIC,
  planned_duration INTEGER,
  planned_pace     TEXT,
  actual_distance  NUMERIC,
  actual_duration  INTEGER,
  actual_pace      TEXT,
  avg_hr           INTEGER,
  max_hr           INTEGER,
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
  coach_id    UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  source      TEXT NOT NULL DEFAULT 'text',
  signal      TEXT NOT NULL DEFAULT 'green',
  transcript  TEXT NOT NULL DEFAULT '',
  ai_summary  TEXT NOT NULL DEFAULT '',
  ai_analysis TEXT NOT NULL DEFAULT '',
  watch_data  JSONB,
  coach_reply TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id     UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id       UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  number         TEXT NOT NULL,
  date           DATE NOT NULL,
  due_date       DATE NOT NULL,
  amount         NUMERIC NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  package        TEXT,
  description    TEXT DEFAULT '',
  attachment_url TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Athlete races (zawody)
CREATE TABLE IF NOT EXISTS athlete_races (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id    UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  date        DATE NOT NULL,
  distance    TEXT,
  goal_time   TEXT,
  result      TEXT,
  status      TEXT NOT NULL DEFAULT 'planned',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages (chat)
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  athlete_id  UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  content     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Athlete sessions (custom auth — token-based)
CREATE TABLE IF NOT EXISTS athlete_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '365 days',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- Row Level Security
-- ================================================================

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_sessions ENABLE ROW LEVEL SECURITY;

-- Coaches: see own profile only
CREATE POLICY "coaches_own" ON coaches
  FOR ALL USING (id = auth.uid());

-- Athletes: coach sees only their own athletes
CREATE POLICY "athletes_coach_own" ON athletes
  FOR ALL USING (coach_id = auth.uid());

-- Training sessions: coach sees only their sessions
CREATE POLICY "sessions_coach_own" ON training_sessions
  FOR ALL USING (coach_id = auth.uid());

-- Feedbacks: coach sees only their feedbacks
CREATE POLICY "feedbacks_coach_own" ON feedbacks
  FOR ALL USING (coach_id = auth.uid());

-- Invoices: coach sees only their invoices
CREATE POLICY "invoices_coach_own" ON invoices
  FOR ALL USING (coach_id = auth.uid());

-- Athlete races: coach sees only their races
CREATE POLICY "races_coach_own" ON athlete_races
  FOR ALL USING (coach_id = auth.uid());

-- Messages: coach sees only their messages
CREATE POLICY "messages_coach_own" ON messages
  FOR ALL USING (coach_id = auth.uid());

-- athlete_sessions: NO anon/auth policies — only service_role can access
-- (no policies = blocked for all except service_role)

-- ================================================================
-- Indexes for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS athletes_coach_idx ON athletes(coach_id);
CREATE INDEX IF NOT EXISTS sessions_athlete_idx ON training_sessions(athlete_id);
CREATE INDEX IF NOT EXISTS sessions_date_idx ON training_sessions(date);
CREATE INDEX IF NOT EXISTS feedbacks_athlete_idx ON feedbacks(athlete_id);
CREATE INDEX IF NOT EXISTS feedbacks_read_idx ON feedbacks(read);
CREATE INDEX IF NOT EXISTS invoices_athlete_idx ON invoices(athlete_id);
CREATE INDEX IF NOT EXISTS races_athlete_idx ON athlete_races(athlete_id);
CREATE INDEX IF NOT EXISTS races_date_idx ON athlete_races(date);
CREATE INDEX IF NOT EXISTS messages_coach_athlete_idx ON messages(coach_id, athlete_id);
CREATE INDEX IF NOT EXISTS athlete_sessions_token_idx ON athlete_sessions(token);
