-- Trwałe typy treningów trenera

CREATE TABLE IF NOT EXISTS coach_session_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  label      TEXT NOT NULL,
  color      TEXT,
  is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_id, key)
);

ALTER TABLE coach_session_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_types_coach_own" ON coach_session_types
  FOR ALL USING (coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS coach_session_types_coach_idx ON coach_session_types(coach_id, position);
