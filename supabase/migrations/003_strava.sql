CREATE TABLE IF NOT EXISTS strava_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE UNIQUE,
  strava_athlete_id bigint UNIQUE,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  connected_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS strava_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE,
  strava_id bigint UNIQUE,
  name text,
  distance float,
  moving_time int,
  start_date timestamptz,
  type text,
  average_speed float,
  average_heartrate float,
  max_heartrate float,
  synced_at timestamptz DEFAULT now()
);
