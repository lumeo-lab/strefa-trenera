'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function generateSlug(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0].toLowerCase()
  const lastInitial = parts[1] ? parts[1][0].toLowerCase() : ''
  return `${first}${lastInitial ? '-' + lastInitial : ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '')
}

function generateAvatar(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export async function createAthlete(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const goal = formData.get('goal') as string
  const pkg = formData.get('package') as string
  const packagePrice = parseFloat(formData.get('package_price') as string) || 249
  const age = parseInt(formData.get('age') as string) || null
  const city = formData.get('city') as string

  if (!name) return { error: 'Imię i nazwisko jest wymagane' }

  // Generate unique slug
  let slug = generateSlug(name)
  const avatar = generateAvatar(name)

  // Check for duplicate slug and add number if needed
  const { data: existing } = await supabase
    .from('athletes')
    .select('slug')
    .eq('coach_id', user.id)
    .ilike('slug', `${slug}%`)

  if (existing && existing.length > 0) {
    const taken = new Set(existing.map(a => a.slug))
    if (taken.has(slug)) {
      let i = 2
      while (taken.has(`${slug}${i}`)) i++
      slug = `${slug}${i}`
    }
  }

  const { data, error } = await supabase.from('athletes').insert({
    coach_id: user.id,
    name,
    avatar,
    slug,
    email: email || null,
    phone: phone || null,
    goal: goal || '',
    package: pkg || 'Starter',
    package_price: packagePrice,
    age,
    city: city || '',
  }).select('id, slug').single()

  if (error) return { error: error.message }

  revalidatePath('/coach/athletes')
  return { success: true, athleteId: data.id, slug: data.slug }
}

export async function updateAthlete(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const id = formData.get('id') as string
  const updates: Record<string, unknown> = {}

  const fields = ['name', 'email', 'phone', 'goal', 'package', 'city', 'coach_notes'] as const
  for (const field of fields) {
    const val = formData.get(field)
    if (val !== null) updates[field] = val as string
  }
  const age = formData.get('age')
  if (age !== null) updates.age = age ? parseInt(age as string) : null
  const packagePrice = formData.get('package_price')
  if (packagePrice !== null) updates.package_price = parseFloat(packagePrice as string)
  const status = formData.get('status')
  if (status !== null) updates.status = status as string
  const personalBests = formData.get('personal_bests')
  if (personalBests !== null) {
    try { updates.personal_bests = JSON.parse(personalBests as string) } catch { /* ignore */ }
  }

  const { error } = await supabase
    .from('athletes')
    .update(updates)
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/athletes')
  revalidatePath(`/coach/athletes/${id}`)
  return { success: true }
}

export async function deleteAthlete(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/athletes')
  return { success: true }
}
