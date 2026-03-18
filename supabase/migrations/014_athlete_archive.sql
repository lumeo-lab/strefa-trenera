ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS athletes_coach_archived_idx
  ON athletes(coach_id, archived_at);
