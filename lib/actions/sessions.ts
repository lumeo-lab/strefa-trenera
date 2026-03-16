'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR } from '@/lib/constants'
import { assertCoachOwnsAthlete } from '@/lib/auth-guards'
import { createSessionSchema, updateSessionSchema, validateFormData } from '@/lib/schemas'

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
    url,
    url_label: urlLabel,
    completed,
    actual_distance: actualDistance,
    actual_duration: actualDuration,
    actual_pace: actualPace,
    avg_hr: avgHr,
    max_hr: maxHr,
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

  const { error } = await supabase
    .from('training_sessions')
    .update(updates)
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

  const { error } = await supabase
    .from('training_sessions')
    .update({ completed: true })
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

  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}
