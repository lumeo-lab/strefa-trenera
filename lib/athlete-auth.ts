import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

export const ATHLETE_SESSION_COOKIE = 'athlete_session'
export const ATHLETE_INVITE_TTL_SECONDS = 60 * 60 * 24 * 365 // 1 year
export const ATHLETE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 90  // 90 days

export interface AthleteSession {
  id: string
  name: string
  avatar: string
  slug: string
  goal: string
  package: string
  package_price: number
  coach_id: string
  email: string | null
  phone: string | null
}

type AthleteSessionAthleteRow = Pick<
  Database['public']['Tables']['athletes']['Row'],
  'id' | 'name' | 'avatar' | 'slug' | 'goal' | 'package' | 'package_price' | 'coach_id' | 'email' | 'phone'
>

interface AthleteSessionQueryRow {
  athlete_id: string
  expires_at: string
  revoked_at: string | null
  athletes: AthleteSessionAthleteRow
}

export function generateSecureToken(bytes = 24): string {
  return randomBytes(bytes).toString('hex')
}

export function addSecondsToNow(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

export function buildAthleteInvitePath(slug: string, token: string): string {
  return `/u/${slug}?t=${token}`
}

export function getAthleteSessionCookieValue(token: string) {
  return {
    name: ATHLETE_SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: ATHLETE_SESSION_TTL_SECONDS,
      path: '/',
    },
  }
}

export function getClearedAthleteSessionCookieValue() {
  return {
    name: ATHLETE_SESSION_COOKIE,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    },
  }
}

export async function getAthleteFromSession(slug: string): Promise<AthleteSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ATHLETE_SESSION_COOKIE)?.value

  if (!token) return null

  const { data } = await adminClient
    .from('athlete_sessions')
    .select(`
      athlete_id,
      expires_at,
      revoked_at,
      athletes!inner(
        id, name, avatar, slug, goal, package,
        package_price, coach_id, email, phone
      )
    `)
    .eq('token', token)
    .eq('athletes.slug', slug)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single<AthleteSessionQueryRow>()

  if (!data) return null

  return data.athletes
}

export async function revokeCurrentAthleteSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ATHLETE_SESSION_COOKIE)?.value
  if (!token) return

  await adminClient
    .from('athlete_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token', token)
    .is('revoked_at', null)

  const cleared = getClearedAthleteSessionCookieValue()
  cookieStore.set(cleared.name, cleared.value, cleared.options)
}
