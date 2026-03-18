-- Trwałe statusy zawodników trenera

CREATE TABLE IF NOT EXISTS coach_athlete_statuses (
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

ALTER TABLE coach_athlete_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athlete_statuses_coach_own" ON coach_athlete_statuses
  FOR ALL USING (coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS coach_athlete_statuses_coach_idx
  ON coach_athlete_statuses(coach_id, position);
