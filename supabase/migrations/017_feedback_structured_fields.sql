ALTER TABLE feedbacks
  ADD COLUMN IF NOT EXISTS feeling TEXT,
  ADD COLUMN IF NOT EXISTS rpe INTEGER,
  ADD COLUMN IF NOT EXISTS pain_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pain_note TEXT,
  ADD COLUMN IF NOT EXISTS notes_structured TEXT,
  ADD COLUMN IF NOT EXISTS voice_transcript TEXT,
  ADD COLUMN IF NOT EXISTS actual_distance NUMERIC,
  ADD COLUMN IF NOT EXISTS actual_duration INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'feedbacks_rpe_check'
  ) THEN
    ALTER TABLE feedbacks
      ADD CONSTRAINT feedbacks_rpe_check
      CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS feedbacks_session_date_idx ON feedbacks(session_id, date);
