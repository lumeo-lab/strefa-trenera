'use server'

import {
  addSecondsToNow,
  ATHLETE_INVITE_TTL_SECONDS,
  buildAthleteInvitePath,
  generateSecureToken,
} from '@/lib/athlete-auth'
import { createAthleteSchema, updateAthleteSchema, validateFormData } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR } from '@/lib/constants'

function safeJsonField(raw: FormDataEntryValue | null): unknown {
  if (raw === null) return undefined
  try { return JSON.parse(raw as string) } catch { return undefined }
}

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
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(createAthleteSchema, formData)
  if ('error' in parsed) return parsed
  const {
    name,
    email,
    phone,
    goal,
    package: pkg,
    package_price: packagePrice,
    age = null,
    city,
    height = null,
    weight = null,
  } = parsed.data

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

  const { data: lastAthlete } = await supabase
    .from('athletes')
    .select('athlete_order')
    .eq('coach_id', user.id)
    .order('athlete_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase.from('athletes').insert({
    coach_id: user.id,
    athlete_order: (lastAthlete?.athlete_order ?? -1) + 1,
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
    height,
    weight,
    status: 'ok',
  }).select('id, slug').single()

  if (error) return { error: error.message }

  revalidatePath('/coach/athletes')
  return { success: true, athleteId: data.id, slug: data.slug, name }
}

export async function updateAthlete(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(updateAthleteSchema, formData)
  if ('error' in parsed) return parsed

  const { id, ...validated } = parsed.data
  const updates: Record<string, unknown> = {}
  Object.assign(updates, validated)
  const pbParsed = safeJsonField(formData.get('personal_bests'))
  if (pbParsed !== undefined) updates.personal_bests = pbParsed
  const injuriesParsed = safeJsonField(formData.get('injuries'))
  if (injuriesParsed !== undefined) updates.injuries = injuriesParsed
  const injuryHistoryParsed = safeJsonField(formData.get('injury_history'))
  if (injuryHistoryParsed !== undefined) updates.injury_history = injuryHistoryParsed

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

export async function saveAthleteOrder(athleteIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const uniqueIds = Array.from(new Set(athleteIds.filter((id) => typeof id === 'string' && id.length > 0)))
  if (uniqueIds.length === 0) return { error: 'Brak zawodników do zapisania.' }

  const { data: ownedAthletes, error: fetchError } = await supabase
    .from('athletes')
    .select('id, athlete_order')
    .eq('coach_id', user.id)
    .is('archived_at', null)
    .order('athlete_order', { ascending: true })
    .order('name', { ascending: true })

  let activeAthletes = ownedAthletes
  if (fetchError) {
    const fallback = await supabase
      .from('athletes')
      .select('id, athlete_order')
      .eq('coach_id', user.id)
      .order('athlete_order', { ascending: true })
      .order('name', { ascending: true })
    if (fallback.error) return { error: fallback.error.message }
    activeAthletes = fallback.data
  }

  const activeIds = (activeAthletes ?? []).map((athlete) => athlete.id)
  if (!uniqueIds.every((id) => activeIds.includes(id))) {
    return { error: 'Nie udało się zweryfikować kolejności zawodników.' }
  }

  const finalOrder = [...uniqueIds, ...activeIds.filter((id) => !uniqueIds.includes(id))]

  const updates = finalOrder.map((id, index) =>
    supabase
      .from('athletes')
      .update({ athlete_order: index })
      .eq('coach_id', user.id)
      .eq('id', id),
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath('/coach/athletes')
  return { success: true }
}

export async function archiveAthlete(athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('athletes')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', athleteId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/athletes')
  revalidatePath('/coach/settings')
  revalidatePath(`/coach/athletes/${athleteId}`)
  revalidatePath('/coach/dashboard')
  revalidatePath('/coach/planner')
  revalidatePath('/coach/chat')
  revalidatePath('/coach/feedback')
  revalidatePath('/coach/invoices')
  return { success: true }
}

export async function restoreAthlete(athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const { data: lastAthlete } = await supabase
    .from('athletes')
    .select('athlete_order')
    .eq('coach_id', user.id)
    .is('archived_at', null)
    .order('athlete_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from('athletes')
    .update({
      archived_at: null,
      athlete_order: (lastAthlete?.athlete_order ?? -1) + 1,
    })
    .eq('id', athleteId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/athletes')
  revalidatePath('/coach/settings')
  revalidatePath(`/coach/athletes/${athleteId}`)
  revalidatePath('/coach/dashboard')
  revalidatePath('/coach/planner')
  revalidatePath('/coach/chat')
  revalidatePath('/coach/feedback')
  revalidatePath('/coach/invoices')
  return { success: true }
}

export async function deleteAthlete(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/athletes')
  return { success: true }
}

export async function regenerateAthleteInviteLink(athleteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const inviteToken = generateSecureToken(24)
  const inviteExpiresAt = addSecondsToNow(ATHLETE_INVITE_TTL_SECONDS)

  const { data, error } = await supabase
    .from('athletes')
    .update({
      invite_token: inviteToken,
      invite_token_expires_at: inviteExpiresAt,
      invite_token_used_at: null,
    })
    .eq('id', athleteId)
    .eq('coach_id', user.id)
    .select('slug, invite_token, invite_token_expires_at')
    .single()

  if (error || !data) return { error: error?.message ?? AUTH_ERROR }

  // Do NOT revoke existing sessions — athlete should stay logged in
  revalidatePath(`/coach/athletes/${athleteId}`)
  return {
    success: true,
    slug: data.slug,
    inviteToken: data.invite_token,
    inviteExpiresAt: data.invite_token_expires_at,
    invitePath: buildAthleteInvitePath(data.slug, data.invite_token),
  }
}
