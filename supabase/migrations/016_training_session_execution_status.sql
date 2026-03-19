ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS completion_source TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linked_strava_activity_id BIGINT,
  ADD COLUMN IF NOT EXISTS skipped_reason TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'training_sessions_status_check'
  ) THEN
    ALTER TABLE training_sessions
      ADD CONSTRAINT training_sessions_status_check
      CHECK (status IN ('planned', 'completed', 'skipped', 'detected'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'training_sessions_completion_source_check'
  ) THEN
    ALTER TABLE training_sessions
      ADD CONSTRAINT training_sessions_completion_source_check
      CHECK (completion_source IS NULL OR completion_source IN ('athlete', 'coach', 'strava', 'imported'));
  END IF;
END $$;

UPDATE training_sessions
SET
  status = CASE
    WHEN completed THEN 'completed'
    ELSE 'planned'
  END,
  completion_source = CASE
    WHEN completed AND completion_source IS NULL THEN 'imported'
    ELSE completion_source
  END,
  completed_at = CASE
    WHEN completed AND completed_at IS NULL THEN created_at
    ELSE completed_at
  END
WHERE status IS DISTINCT FROM CASE
  WHEN completed THEN 'completed'
  ELSE 'planned'
END
OR (completed AND completion_source IS NULL)
OR (completed AND completed_at IS NULL);

CREATE INDEX IF NOT EXISTS sessions_status_idx ON training_sessions(status);
CREATE INDEX IF NOT EXISTS sessions_athlete_status_date_idx ON training_sessions(athlete_id, status, date);
CREATE INDEX IF NOT EXISTS sessions_linked_strava_idx ON training_sessions(linked_strava_activity_id)
  WHERE linked_strava_activity_id IS NOT NULL;
