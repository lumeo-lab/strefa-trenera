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
const MAX_ATTEMPTS = 10
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

  // Rate limit
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
    // Invalid or expired token — redirect back (page.tsx will check session cookie as fallback)
    return NextResponse.redirect(new URL(`/u/${slug}?invalid=1`, request.url))
  }

  const nowIso = new Date().toISOString()

  // Extend invite token expiry (do NOT rotate — same link keeps working)
  await adminClient
    .from('athletes')
    .update({
      invite_token_expires_at: addSecondsToNow(ATHLETE_INVITE_TTL_SECONDS),
      invite_token_used_at: nowIso,
    })
    .eq('id', athlete.id)
    .eq('invite_token', token)

  // Check if athlete already has an active session from this browser
  const existingSessionToken = request.cookies.get('athlete_session')?.value
  if (existingSessionToken) {
    const { data: existingSession } = await adminClient
      .from('athlete_sessions')
      .select('id')
      .eq('token', existingSessionToken)
      .eq('athlete_id', athlete.id)
      .is('revoked_at', null)
      .gt('expires_at', nowIso)
      .single()

    if (existingSession) {
      // Existing valid session — just redirect, no need for new session
      return NextResponse.redirect(new URL(`/u/${slug}`, request.url))
    }
  }

  // Create new session
  const sessionToken = generateSecureToken(32)
  const sessionExpiresAt = addSecondsToNow(ATHLETE_SESSION_TTL_SECONDS)
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null

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
