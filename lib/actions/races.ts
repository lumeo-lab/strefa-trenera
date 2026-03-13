'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRace(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const athleteId = formData.get('athlete_id') as string
  const name = formData.get('name') as string
  const date = formData.get('date') as string
  const distance = formData.get('distance') as string || null
  const goalTime = formData.get('goal_time') as string || null
  const notes = formData.get('notes') as string || null

  if (!athleteId || !name || !date) return { error: 'Brak wymaganych pól' }

  const { error } = await supabase.from('athlete_races').insert({
    athlete_id: athleteId,
    coach_id: user.id,
    name,
    date,
    distance,
    goal_time: goalTime,
    notes,
  })

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function updateRace(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const id = formData.get('id') as string
  const athleteId = formData.get('athlete_id') as string

  const { error } = await supabase.from('athlete_races').update({
    name: formData.get('name') as string,
    date: formData.get('date') as string,
    distance: formData.get('distance') as string || null,
    goal_time: formData.get('goal_time') as string || null,
    notes: formData.get('notes') as string || null,
  }).eq('id', id).eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function deleteRace(id: string, athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const { error } = await supabase.from('athlete_races').delete().eq('id', id).eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}
