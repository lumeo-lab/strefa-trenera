import { adminClient } from '@/lib/supabase/admin'
import {
  addSecondsToNow,
  ATHLETE_INVITE_TTL_SECONDS,
  ATHLETE_SESSION_TTL_SECONDS,
  generateSecureToken,
  getAthleteSessionCookieValue,
} from '@/lib/athlete-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter per slug (resets on deploy/restart)
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isRateLimited(slug: string): boolean {
  const now = Date.now()
  const entry = attempts.get(slug)

  if (!entry || now > entry.resetAt) {
    attempts.set(slug, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > MAX_ATTEMPTS
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const slug = searchParams.get('slug')
  const token = searchParams.get('t')

  if (!slug || !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Rate limit: max 5 attempts per slug per 15 minutes
  if (isRateLimited(slug)) {
    return NextResponse.redirect(new URL(`/u/${slug}?invalid=1`, request.url))
  }

  // Find athlete by slug + invite_token
  const { data: athlete } = await adminClient
    .from('athletes')
    .select('id, invite_token_expires_at')
    .eq('slug', slug)
    .eq('invite_token', token)
    .single()

  if (!athlete || !athlete.invite_token_expires_at || new Date(athlete.invite_token_expires_at) <= new Date()) {
    // Invalid token — redirect back with error
    return NextResponse.redirect(new URL(`/u/${slug}?invalid=1`, request.url))
  }

  const nowIso = new Date().toISOString()
  const nextInviteToken = generateSecureToken(24)
  const nextInviteExpiresAt = addSecondsToNow(ATHLETE_INVITE_TTL_SECONDS)
  const sessionToken = generateSecureToken(32)
  const sessionExpiresAt = addSecondsToNow(ATHLETE_SESSION_TTL_SECONDS)
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null

  const { data: rotatedAthlete, error: rotateError } = await adminClient
    .from('athletes')
    .update({
      invite_token: nextInviteToken,
      invite_token_expires_at: nextInviteExpiresAt,
      invite_token_used_at: nowIso,
    })
    .eq('id', athlete.id)
    .eq('invite_token', token)
    .select('id')
    .single()

  if (rotateError || !rotatedAthlete) {
    return NextResponse.redirect(new URL(`/u/${slug}?invalid=1`, request.url))
  }

  await adminClient
    .from('athlete_sessions')
    .update({ revoked_at: nowIso })
    .eq('athlete_id', athlete.id)
    .is('revoked_at', null)

  const { error: sessionError } = await adminClient
    .from('athlete_sessions')
    .insert({
      athlete_id: athlete.id,
      token: sessionToken,
      expires_at: sessionExpiresAt,
      last_seen_at: nowIso,
      user_agent: userAgent,
    })

  if (sessionError) {
    return NextResponse.redirect(new URL(`/u/${slug}?invalid=1`, request.url))
  }

  const response = NextResponse.redirect(new URL(`/u/${slug}`, request.url))
  const sessionCookie = getAthleteSessionCookieValue(sessionToken)
  response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)

  return response
}
