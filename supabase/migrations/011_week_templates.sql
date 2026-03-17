-- Szablony tygodni planera

CREATE TABLE IF NOT EXISTS coach_week_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_week_template_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      UUID NOT NULL REFERENCES coach_week_templates(id) ON DELETE CASCADE,
  day_offset       INTEGER NOT NULL CHECK (day_offset >= 0 AND day_offset <= 6),
  position         INTEGER NOT NULL DEFAULT 0,
  type             TEXT NOT NULL DEFAULT 'easy',
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  planned_distance NUMERIC,
  planned_duration INTEGER,
  planned_pace     TEXT,
  url              TEXT,
  url_label        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coach_week_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_week_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "week_templates_coach_own" ON coach_week_templates
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "week_template_items_coach_own" ON coach_week_template_items
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM coach_week_templates t
      WHERE t.id = template_id
        AND t.coach_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS coach_week_templates_coach_idx ON coach_week_templates(coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS coach_week_template_items_template_idx ON coach_week_template_items(template_id, day_offset, position);
