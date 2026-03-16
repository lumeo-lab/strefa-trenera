'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR } from '@/lib/constants'
import { assertCoachOwnsAthlete } from '@/lib/auth-guards'
import { createRaceSchema, updateRaceSchema, validateFormData } from '@/lib/schemas'

export async function createRace(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(createRaceSchema, formData)
  if ('error' in parsed) return parsed
  const {
    athlete_id: athleteId,
    name,
    date,
    distance,
    goal_time: goalTime,
    result,
    status,
    notes,
  } = parsed.data

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { error } = await supabase.from('athlete_races').insert({
    athlete_id: athleteId,
    coach_id: user.id,
    name,
    date,
    distance,
    goal_time: goalTime,
    result,
    status,
    notes,
  })

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function updateRace(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(updateRaceSchema, formData)
  if ('error' in parsed) return parsed

  const { id, athlete_id: athleteId, ...updates } = parsed.data

  const { error } = await supabase.from('athlete_races').update(updates).eq('id', id).eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function deleteRace(id: string, athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const { error } = await supabase.from('athlete_races').delete().eq('id', id).eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}
