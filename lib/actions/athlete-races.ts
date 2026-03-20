'use server'

import { revalidatePath } from 'next/cache'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { adminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const raceSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowa data'),
  distance: z.string().max(50).optional(),
  goal_time: z.string().max(50).optional(),
  result: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
})

export async function createAthleteRace(
  slug: string,
  data: z.infer<typeof raceSchema>
): Promise<{ success: true } | { error: string }> {
  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: 'Brak dostępu.' }

  const parsed = raceSchema.safeParse(data)
  if (!parsed.success) return { error: 'Nieprawidłowe dane.' }

  const { error } = await adminClient.from('athlete_races').insert({
    athlete_id: athlete.id,
    coach_id: athlete.coach_id,
    name: parsed.data.name,
    date: parsed.data.date,
    distance: parsed.data.distance || null,
    goal_time: parsed.data.goal_time || null,
    result: parsed.data.result || null,
    status: parsed.data.status || 'planned',
    notes: parsed.data.notes || null,
  })

  if (error) return { error: 'Nie udało się dodać zawodów.' }

  revalidatePath(`/u/${slug}/races`)
  revalidatePath(`/coach/athletes/${athlete.id}`)
  return { success: true }
}

export async function updateAthleteRace(
  slug: string,
  raceId: string,
  data: z.infer<typeof raceSchema>
): Promise<{ success: true } | { error: string }> {
  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: 'Brak dostępu.' }

  const parsed = raceSchema.safeParse(data)
  if (!parsed.success) return { error: 'Nieprawidłowe dane.' }

  const { error } = await adminClient.from('athlete_races').update({
    name: parsed.data.name,
    date: parsed.data.date,
    distance: parsed.data.distance || null,
    goal_time: parsed.data.goal_time || null,
    result: parsed.data.result || null,
    status: parsed.data.status || 'planned',
    notes: parsed.data.notes || null,
  }).eq('id', raceId).eq('athlete_id', athlete.id)

  if (error) return { error: 'Nie udało się zaktualizować.' }

  revalidatePath(`/u/${slug}/races`)
  revalidatePath(`/coach/athletes/${athlete.id}`)
  return { success: true }
}

export async function deleteAthleteRace(
  slug: string,
  raceId: string
): Promise<{ success: true } | { error: string }> {
  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: 'Brak dostępu.' }

  const { error } = await adminClient.from('athlete_races').delete().eq('id', raceId).eq('athlete_id', athlete.id)

  if (error) return { error: 'Nie udało się usunąć.' }

  revalidatePath(`/u/${slug}/races`)
  revalidatePath(`/coach/athletes/${athlete.id}`)
  return { success: true }
}
