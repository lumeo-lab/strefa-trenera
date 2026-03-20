'use server'

import { revalidatePath } from 'next/cache'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { adminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'Imię i nazwisko jest wymagane').max(100),
  email: z.string().email('Nieprawidłowy email').nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  age: z.number().int().min(5).max(120).nullable().optional(),
  height: z.number().int().min(100).max(250).nullable().optional(),
  weight: z.number().min(20).max(300).nullable().optional(),
  goal: z.string().max(500).optional(),
})

export async function updateAthleteProfile(
  slug: string,
  data: z.infer<typeof profileSchema>
): Promise<{ success: true } | { error: string }> {
  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return { error: 'Brak dostępu.' }

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: 'Nieprawidłowe dane.' }

  const { error } = await adminClient
    .from('athletes')
    .update({
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      city: parsed.data.city ?? null,
      age: parsed.data.age ?? null,
      height: parsed.data.height ?? null,
      weight: parsed.data.weight ?? null,
      goal: parsed.data.goal ?? '',
    })
    .eq('id', athlete.id)

  if (error) return { error: 'Nie udało się zapisać zmian.' }

  revalidatePath(`/u/${slug}`)
  revalidatePath(`/u/${slug}/profile`)
  return { success: true }
}
