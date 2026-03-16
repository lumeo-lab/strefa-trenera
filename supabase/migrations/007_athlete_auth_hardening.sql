ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS invite_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_token_used_at timestamptz;

UPDATE athletes
SET invite_token_expires_at = COALESCE(invite_token_expires_at, now() + interval '14 days')
WHERE invite_token_expires_at IS NULL;

ALTER TABLE athletes
  ALTER COLUMN invite_token_expires_at SET DEFAULT now() + interval '14 days';

ALTER TABLE athlete_sessions
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS athletes_invite_token_idx ON athletes(invite_token);
CREATE INDEX IF NOT EXISTS athlete_sessions_active_idx
  ON athlete_sessions(athlete_id, revoked_at, expires_at);
