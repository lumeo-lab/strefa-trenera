alter table public.athletes
  add column if not exists hr_zone_method text not null default 'custom',
  add column if not exists threshold_hr integer,
  add column if not exists hr_zone_z1_max integer,
  add column if not exists hr_zone_z2_max integer,
  add column if not exists hr_zone_z3_max integer,
  add column if not exists hr_zone_z4_max integer;

alter table public.athletes
  drop constraint if exists athletes_hr_zone_method_check;

alter table public.athletes
  add constraint athletes_hr_zone_method_check
  check (hr_zone_method in ('custom', 'threshold_hr'));

alter table public.training_sessions
  add column if not exists session_priority text not null default 'normal',
  add column if not exists session_goal text,
  add column if not exists training_load numeric(10,2),
  add column if not exists training_load_source text,
  add column if not exists time_in_hr_z1 integer,
  add column if not exists time_in_hr_z2 integer,
  add column if not exists time_in_hr_z3 integer,
  add column if not exists time_in_hr_z4 integer,
  add column if not exists time_in_hr_z5 integer;

alter table public.training_sessions
  drop constraint if exists training_sessions_session_priority_check;

alter table public.training_sessions
  add constraint training_sessions_session_priority_check
  check (session_priority in ('key', 'normal', 'optional'));

alter table public.training_sessions
  drop constraint if exists training_sessions_training_load_source_check;

alter table public.training_sessions
  add constraint training_sessions_training_load_source_check
  check (training_load_source in ('strava_hr', 'estimated_rpe', 'coach_manual', 'imported'));

create index if not exists idx_training_sessions_priority on public.training_sessions(session_priority);

alter table public.coach_week_template_items
  add column if not exists session_priority text not null default 'normal',
  add column if not exists session_goal text;

alter table public.coach_week_template_items
  drop constraint if exists coach_week_template_items_session_priority_check;

alter table public.coach_week_template_items
  add constraint coach_week_template_items_session_priority_check
  check (session_priority in ('key', 'normal', 'optional'));
