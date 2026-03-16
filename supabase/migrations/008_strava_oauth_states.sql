CREATE TABLE IF NOT EXISTS strava_oauth_states (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  slug text NOT NULL,
  nonce text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '15 minutes',
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS strava_oauth_states_nonce_idx
  ON strava_oauth_states(nonce);

CREATE INDEX IF NOT EXISTS strava_oauth_states_active_idx
  ON strava_oauth_states(athlete_id, expires_at, consumed_at);
