ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS injury_history JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE athletes
SET injury_history = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', md5(COALESCE(injury_name, '') || '-' || idx::text),
        'name', injury_name,
        'started_at', NULL,
        'ended_at', NULL
      )
    )
    FROM unnest(COALESCE(injuries, ARRAY[]::text[])) WITH ORDINALITY AS t(injury_name, idx)
  ),
  '[]'::jsonb
)
WHERE injury_history = '[]'::jsonb
  AND COALESCE(array_length(injuries, 1), 0) > 0;
