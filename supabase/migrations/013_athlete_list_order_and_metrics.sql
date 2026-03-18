ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS athlete_order INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY coach_id ORDER BY created_at ASC, name ASC, id ASC) - 1 AS new_order
  FROM athletes
)
UPDATE athletes
SET athlete_order = ranked.new_order
FROM ranked
WHERE athletes.id = ranked.id;

CREATE INDEX IF NOT EXISTS athletes_coach_order_idx
  ON athletes(coach_id, athlete_order, name);

CREATE OR REPLACE FUNCTION coach_athlete_list_metrics(
  p_coach_id UUID,
  p_today DATE,
  p_week_start DATE,
  p_month_start DATE
)
RETURNS TABLE (
  athlete_id UUID,
  last_session_date DATE,
  last_session_type TEXT,
  last_session_title TEXT,
  next_session_date DATE,
  next_session_type TEXT,
  next_session_title TEXT,
  weekly_load NUMERIC,
  weekly_session_count INTEGER,
  signal TEXT,
  last_feedback_date TIMESTAMPTZ,
  unread_feedback_count INTEGER,
  unread_message_count INTEGER,
  compliance_completed INTEGER,
  compliance_total INTEGER,
  has_unpaid_invoice BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
  WITH coach_athletes AS (
    SELECT id
    FROM athletes
    WHERE coach_id = p_coach_id
  ),
  last_sessions AS (
    SELECT DISTINCT ON (ts.athlete_id)
      ts.athlete_id,
      ts.date,
      ts.type,
      ts.title
    FROM training_sessions ts
    INNER JOIN coach_athletes ca ON ca.id = ts.athlete_id
    WHERE ts.coach_id = p_coach_id
      AND ts.completed = TRUE
    ORDER BY ts.athlete_id, ts.date DESC, ts.created_at DESC
  ),
  next_sessions AS (
    SELECT DISTINCT ON (ts.athlete_id)
      ts.athlete_id,
      ts.date,
      ts.type,
      ts.title
    FROM training_sessions ts
    INNER JOIN coach_athletes ca ON ca.id = ts.athlete_id
    WHERE ts.coach_id = p_coach_id
      AND ts.completed = FALSE
      AND ts.date >= p_today
    ORDER BY ts.athlete_id, ts.date ASC, ts.created_at ASC
  ),
  weekly_loads AS (
    SELECT
      ts.athlete_id,
      COALESCE(SUM(COALESCE(ts.actual_distance, ts.planned_distance, 0)), 0) AS weekly_load,
      COUNT(*)::INTEGER AS weekly_session_count
    FROM training_sessions ts
    INNER JOIN coach_athletes ca ON ca.id = ts.athlete_id
    WHERE ts.coach_id = p_coach_id
      AND ts.completed = TRUE
      AND ts.date >= p_week_start
    GROUP BY ts.athlete_id
  ),
  latest_feedback AS (
    SELECT DISTINCT ON (f.athlete_id)
      f.athlete_id,
      f.signal,
      f.created_at
    FROM feedbacks f
    INNER JOIN coach_athletes ca ON ca.id = f.athlete_id
    WHERE f.coach_id = p_coach_id
    ORDER BY f.athlete_id, f.created_at DESC
  ),
  unread_feedback AS (
    SELECT
      f.athlete_id,
      COUNT(*)::INTEGER AS unread_feedback_count
    FROM feedbacks f
    INNER JOIN coach_athletes ca ON ca.id = f.athlete_id
    WHERE f.coach_id = p_coach_id
      AND f.read = FALSE
    GROUP BY f.athlete_id
  ),
  unread_messages AS (
    SELECT
      m.athlete_id,
      COUNT(*)::INTEGER AS unread_message_count
    FROM messages m
    INNER JOIN coach_athletes ca ON ca.id = m.athlete_id
    WHERE m.coach_id = p_coach_id
      AND m.sender_type = 'athlete'
      AND m.read = FALSE
    GROUP BY m.athlete_id
  ),
  month_compliance AS (
    SELECT
      ts.athlete_id,
      COUNT(*)::INTEGER AS compliance_total,
      (COUNT(*) FILTER (WHERE ts.completed = TRUE))::INTEGER AS compliance_completed
    FROM training_sessions ts
    INNER JOIN coach_athletes ca ON ca.id = ts.athlete_id
    WHERE ts.coach_id = p_coach_id
      AND ts.date >= p_month_start
      AND ts.date <= p_today
    GROUP BY ts.athlete_id
  ),
  unpaid_invoices AS (
    SELECT DISTINCT i.athlete_id
    FROM invoices i
    INNER JOIN coach_athletes ca ON ca.id = i.athlete_id
    WHERE i.coach_id = p_coach_id
      AND i.status IN ('pending', 'overdue')
  )
  SELECT
    ca.id AS athlete_id,
    ls.date AS last_session_date,
    ls.type AS last_session_type,
    ls.title AS last_session_title,
    ns.date AS next_session_date,
    ns.type AS next_session_type,
    ns.title AS next_session_title,
    COALESCE(wl.weekly_load, 0) AS weekly_load,
    COALESCE(wl.weekly_session_count, 0) AS weekly_session_count,
    lf.signal,
    lf.created_at AS last_feedback_date,
    COALESCE(uf.unread_feedback_count, 0) AS unread_feedback_count,
    COALESCE(um.unread_message_count, 0) AS unread_message_count,
    COALESCE(mc.compliance_completed, 0) AS compliance_completed,
    COALESCE(mc.compliance_total, 0) AS compliance_total,
    (ui.athlete_id IS NOT NULL) AS has_unpaid_invoice
  FROM coach_athletes ca
  LEFT JOIN last_sessions ls ON ls.athlete_id = ca.id
  LEFT JOIN next_sessions ns ON ns.athlete_id = ca.id
  LEFT JOIN weekly_loads wl ON wl.athlete_id = ca.id
  LEFT JOIN latest_feedback lf ON lf.athlete_id = ca.id
  LEFT JOIN unread_feedback uf ON uf.athlete_id = ca.id
  LEFT JOIN unread_messages um ON um.athlete_id = ca.id
  LEFT JOIN month_compliance mc ON mc.athlete_id = ca.id
  LEFT JOIN unpaid_invoices ui ON ui.athlete_id = ca.id;
$$;
