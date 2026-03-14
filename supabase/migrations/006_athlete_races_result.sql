-- Sprint 4: add result and status to athlete_races
ALTER TABLE athlete_races
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS status text
    CHECK (status IN ('planned', 'completed', 'dns', 'dnf'))
    DEFAULT 'planned';
