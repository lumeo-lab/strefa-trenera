ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS actual_data_source text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'training_sessions_actual_data_source_check'
  ) THEN
    ALTER TABLE training_sessions
      ADD CONSTRAINT training_sessions_actual_data_source_check
      CHECK (actual_data_source IN ('athlete', 'coach', 'strava', 'imported') OR actual_data_source IS NULL);
  END IF;
END $$;

UPDATE training_sessions
SET actual_data_source = 'imported'
WHERE actual_data_source IS NULL
  AND (
    actual_distance IS NOT NULL
    OR actual_duration IS NOT NULL
    OR actual_pace IS NOT NULL
    OR avg_hr IS NOT NULL
    OR max_hr IS NOT NULL
  );

ALTER TABLE strava_activities
  ADD COLUMN IF NOT EXISTS elapsed_time int,
  ADD COLUMN IF NOT EXISTS sport_type text,
  ADD COLUMN IF NOT EXISTS max_speed float,
  ADD COLUMN IF NOT EXISTS average_cadence float,
  ADD COLUMN IF NOT EXISTS device_name text;

CREATE INDEX IF NOT EXISTS strava_activities_athlete_start_date_idx
  ON strava_activities(athlete_id, start_date DESC);
