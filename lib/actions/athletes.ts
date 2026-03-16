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
    height,
    weight,
    status: 'ok',
  }).select('id, slug').single()

  if (error) return { error: error.message }

  revalidatePath('/coach/athletes')
  return { success: true, athleteId: data.id, slug: data.slug }
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
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from('athletes')
    .update({
      invite_token: inviteToken,
      invite_token_expires_at: inviteExpiresAt,
      invite_token_used_at: nowIso,
    })
    .eq('id', athleteId)
    .eq('coach_id', user.id)
    .select('slug, invite_token, invite_token_expires_at')
    .single()

  if (error || !data) return { error: error?.message ?? AUTH_ERROR }

  await supabase
    .from('athlete_sessions')
    .update({ revoked_at: nowIso })
    .eq('athlete_id', athleteId)
    .is('revoked_at', null)

  revalidatePath(`/coach/athletes/${athleteId}`)
  return {
    success: true,
    slug: data.slug,
    inviteToken: data.invite_token,
    inviteExpiresAt: data.invite_token_expires_at,
    invitePath: buildAthleteInvitePath(data.slug, data.invite_token),
  }
}
