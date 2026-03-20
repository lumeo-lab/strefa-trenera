'use server'

import { addDaysToBusinessDate } from '@/lib/date'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR } from '@/lib/constants'
import { assertCoachOwnsAthlete } from '@/lib/auth-guards'
import { createSessionSchema, updateSessionSchema, validateFormData } from '@/lib/schemas'
import { getStatusUpdateForExecution } from '@/lib/session-status'
import { adminClient } from '@/lib/supabase/admin'
import { getAthleteFromSession } from '@/lib/athlete-auth'

export async function createSession(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(createSessionSchema, formData)
  if ('error' in parsed) return parsed
  const {
    athlete_id: athleteId,
    date,
    type,
    title,
    description,
    planned_distance: plannedDistance = null,
    planned_duration: plannedDuration = null,
    planned_pace: plannedPace,
    session_priority: sessionPriority = 'normal',
    session_goal: sessionGoal,
    url,
    url_label: urlLabel,
    completed = false,
    actual_distance: actualDistance = null,
    actual_duration: actualDuration = null,
    actual_pace: actualPace,
    avg_hr: avgHr = null,
    max_hr: maxHr = null,
  } = parsed.data

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { data, error } = await supabase.from('training_sessions').insert({
    athlete_id: athleteId,
    coach_id: user.id,
    date,
    type,
    title,
    description: description || '',
    planned_distance: plannedDistance,
    planned_duration: plannedDuration,
    planned_pace: plannedPace,
    session_priority: sessionPriority,
    session_goal: sessionGoal || null,
    url,
    url_label: urlLabel,
    ...getStatusUpdateForExecution(completed ? 'completed' : 'planned', completed ? 'coach' : null),
    actual_distance: actualDistance,
    actual_duration: actualDuration,
    actual_pace: actualPace,
    avg_hr: avgHr,
    max_hr: maxHr,
    actual_data_source:
      actualDistance != null || actualDuration != null || actualPace || avgHr != null || maxHr != null
        ? 'coach'
        : null,
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true, id: data.id }
}

export async function updateSession(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(updateSessionSchema, formData)
  if ('error' in parsed) return parsed
  const { id, athlete_id: athleteId, ...updates } = parsed.data

  const nextUpdates: Record<string, unknown> = { ...updates }
  if ('session_goal' in updates) {
    nextUpdates.session_goal = updates.session_goal || null
  }
  if ('completed' in updates && typeof updates.completed === 'boolean') {
    Object.assign(
      nextUpdates,
      getStatusUpdateForExecution(updates.completed ? 'completed' : 'planned', updates.completed ? 'coach' : null)
    )
  }
  if (
    'actual_distance' in updates
    || 'actual_duration' in updates
    || 'actual_pace' in updates
    || 'avg_hr' in updates
    || 'max_hr' in updates
  ) {
    nextUpdates.actual_data_source =
      updates.actual_distance != null
      || updates.actual_duration != null
      || !!updates.actual_pace
      || updates.avg_hr != null
      || updates.max_hr != null
        ? 'coach'
        : null
  }

  const { error } = await supabase
    .from('training_sessions')
    .update(nextUpdates)
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function markSessionCompleted(id: string, athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('training_sessions')
    .update(getStatusUpdateForExecution('completed', 'coach'))
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function deleteSession(id: string, athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function markSessionCompletedByAthlete(slug: string, sessionId: string) {
  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: AUTH_ERROR }

  const { error } = await adminClient
    .from('training_sessions')
    .update(getStatusUpdateForExecution('completed', 'athlete'))
    .eq('id', sessionId)
    .eq('athlete_id', athlete.id)

  if (error) return { error: error.message }

  revalidatePath(`/u/${slug}`)
  revalidatePath(`/coach/athletes/${athlete.id}`)
  revalidatePath('/coach/planner')
  return { success: true }
}

export async function markSessionSkippedByAthlete(slug: string, sessionId: string, skippedReason?: string) {
  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: AUTH_ERROR }

  const { error } = await adminClient
    .from('training_sessions')
    .update({
      ...getStatusUpdateForExecution('skipped', 'athlete', null),
      skipped_reason: skippedReason?.trim() ? skippedReason.trim().slice(0, 500) : null,
    })
    .eq('id', sessionId)
    .eq('athlete_id', athlete.id)

  if (error) return { error: error.message }

  revalidatePath(`/u/${slug}`)
  revalidatePath(`/coach/athletes/${athlete.id}`)
  revalidatePath('/coach/planner')
  return { success: true }
}

function shiftDate(date: string, days: number) {
  return addDaysToBusinessDate(date, days)
}

function diffDays(from: string, to: string) {
  const start = new Date(`${from}T12:00:00Z`)
  const end = new Date(`${to}T12:00:00Z`)
  return Math.round((end.getTime() - start.getTime()) / 86400000)
}

export async function duplicateWeekSessions(athleteId: string, from: string, to: string, offsetDays = 7) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { data: sourceSessions, error: sourceError } = await supabase
    .from('training_sessions')
    .select('date, type, title, description, planned_distance, planned_duration, planned_pace, session_priority, session_goal, url, url_label')
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (sourceError) return { error: sourceError.message }
  if (!sourceSessions || sourceSessions.length === 0) return { error: 'Brak sesji do skopiowania w tym tygodniu.' }

  const rows = sourceSessions.map((session) => ({
    athlete_id: athleteId,
    coach_id: user.id,
    date: shiftDate(session.date, offsetDays),
    type: session.type,
    title: session.title,
    description: session.description,
    planned_distance: session.planned_distance,
    planned_duration: session.planned_duration,
    planned_pace: session.planned_pace,
    session_priority: session.session_priority,
    session_goal: session.session_goal,
    url: session.url,
    url_label: session.url_label,
    ...getStatusUpdateForExecution('planned', null, null),
  }))

  const { data: insertedRows, error: insertError } = await supabase
    .from('training_sessions')
    .insert(rows)
    .select('*')
  if (insertError) return { error: insertError.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  revalidatePath('/coach/planner')
  return { success: true, count: rows.length, sessions: insertedRows ?? [] }
}

export async function moveSessionDate(id: string, athleteId: string, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('training_sessions')
    .update({ date })
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  // Best-effort: update feedback dates linked to this session
  // If this fails, session date is already correct — don't block on it
  await supabase
    .from('feedbacks')
    .update({ date })
    .eq('session_id', id)
    .eq('coach_id', user.id)

  revalidatePath(`/coach/athletes/${athleteId}`)
  revalidatePath('/coach/planner')
  revalidatePath('/coach/feedback')
  return { success: true }
}

export async function saveWeekTemplate(athleteId: string, from: string, to: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const templateName = name.trim().slice(0, 120)
  if (!templateName) return { error: 'Podaj nazwę szablonu.' }

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { data: sessions, error: sessionsError } = await supabase
    .from('training_sessions')
    .select('date, type, title, description, planned_distance, planned_duration, planned_pace, session_priority, session_goal, url, url_label')
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (sessionsError) return { error: sessionsError.message }
  if (!sessions || sessions.length === 0) return { error: 'Brak sesji do zapisania w tym tygodniu.' }

  const { data: template, error: templateError } = await supabase
    .from('coach_week_templates')
    .insert({ coach_id: user.id, name: templateName })
    .select('id')
    .single()

  if (templateError || !template) return { error: templateError?.message ?? 'Nie udało się zapisać szablonu.' }

  const items = sessions.map((session, index) => ({
    template_id: template.id,
    day_offset: diffDays(from, session.date),
    position: index,
    type: session.type,
    title: session.title,
    description: session.description,
    planned_distance: session.planned_distance,
    planned_duration: session.planned_duration,
    planned_pace: session.planned_pace,
    session_priority: session.session_priority,
    session_goal: session.session_goal,
    url: session.url,
    url_label: session.url_label,
  }))

  const { error: itemsError } = await supabase.from('coach_week_template_items').insert(items)
  if (itemsError) return { error: itemsError.message }

  return { success: true }
}

export async function applyWeekTemplate(athleteId: string, templateId: string, weekStart: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { data: template, error: templateError } = await supabase
    .from('coach_week_templates')
    .select('id')
    .eq('id', templateId)
    .eq('coach_id', user.id)
    .single()

  if (templateError || !template) return { error: templateError?.message ?? 'Nie znaleziono szablonu.' }

  const { data: items, error: itemsError } = await supabase
    .from('coach_week_template_items')
    .select('day_offset, position, type, title, description, planned_distance, planned_duration, planned_pace, session_priority, session_goal, url, url_label')
    .eq('template_id', templateId)
    .order('day_offset', { ascending: true })
    .order('position', { ascending: true })

  if (itemsError) return { error: itemsError.message }
  if (!items || items.length === 0) return { error: 'Ten szablon nie zawiera żadnych sesji.' }

  const rows = items.map((item) => ({
    athlete_id: athleteId,
    coach_id: user.id,
    date: shiftDate(weekStart, item.day_offset),
    type: item.type,
    title: item.title,
    description: item.description,
    planned_distance: item.planned_distance,
    planned_duration: item.planned_duration,
    planned_pace: item.planned_pace,
    session_priority: item.session_priority,
    session_goal: item.session_goal,
    url: item.url,
    url_label: item.url_label,
    ...getStatusUpdateForExecution('planned', null, null),
  }))

  const { error: insertError } = await supabase.from('training_sessions').insert(rows)
  if (insertError) return { error: insertError.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  revalidatePath('/coach/planner')
  return { success: true, count: rows.length }
}
