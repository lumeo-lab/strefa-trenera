'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSession(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const athleteId = formData.get('athlete_id') as string
  const date = formData.get('date') as string
  const type = formData.get('type') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const plannedDistance = formData.get('planned_distance') ? parseFloat(formData.get('planned_distance') as string) : null
  const plannedDuration = formData.get('planned_duration') ? parseInt(formData.get('planned_duration') as string) : null
  const plannedPace = formData.get('planned_pace') as string || null
  const url = formData.get('url') as string || null

  if (!athleteId || !date || !type || !title) return { error: 'Brak wymaganych pól' }

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
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true, id: data.id }
}

export async function updateSession(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const id = formData.get('id') as string
  const athleteId = formData.get('athlete_id') as string

  const updates: Record<string, unknown> = {}
  const stringFields = ['date', 'type', 'title', 'description', 'url'] as const
  for (const f of stringFields) {
    const v = formData.get(f)
    if (v !== null) updates[f] = v
  }
  // Pace fields: empty string → null
  for (const f of ['planned_pace', 'actual_pace'] as const) {
    const v = formData.get(f)
    if (v !== null) updates[f] = (v as string).trim() || null
  }
  const numFields = ['planned_distance', 'planned_duration', 'actual_distance', 'actual_duration', 'avg_hr', 'max_hr'] as const
  for (const f of numFields) {
    const v = formData.get(f)
    if (v !== null) updates[f] = v ? parseFloat(v as string) : null
  }
  const completed = formData.get('completed')
  if (completed !== null) updates.completed = completed === 'true'

  const { error } = await supabase
    .from('training_sessions')
    .update(updates)
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function deleteSession(id: string, athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}
