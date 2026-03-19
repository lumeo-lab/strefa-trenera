import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const stateParam = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')
  const appUrl = req.nextUrl.origin

  if (error || !code || !stateParam) {
    const fallbackSlug = encodeURIComponent(req.nextUrl.searchParams.get('slug') ?? '')
    return NextResponse.redirect(`${appUrl}/u/${fallbackSlug}?strava=denied`)
  }

  // Atomic: consume state in a single UPDATE ... RETURNING to prevent race conditions
  const nowIso = new Date().toISOString()
  const { data: consumedRows, error: consumeError } = await adminClient
    .from('strava_oauth_states')
    .update({ consumed_at: nowIso })
    .eq('nonce', stateParam)
    .is('consumed_at', null)
    .gt('expires_at', nowIso)
    .select('id, athlete_id, slug')

  const oauthState = consumedRows?.[0] ?? null
  const safeSlug = encodeURIComponent(oauthState?.slug ?? '')

  if (consumeError || !oauthState) {
    console.error('[strava] invalid, expired, or already consumed oauth state')
    return NextResponse.redirect(`${appUrl}/u/${safeSlug}?strava=error`)
  }

  // Wymień code na tokeny
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: parseInt(process.env.STRAVA_CLIENT_ID!.trim()),
      client_secret: process.env.STRAVA_CLIENT_SECRET!.trim(),
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    console.error('[strava] token exchange failed:', tokenRes.status, body.slice(0, 200))
    return NextResponse.redirect(`${appUrl}/u/${safeSlug}/history?strava=error`)
  }

  const tokens = await tokenRes.json()

  // Validate required token fields and types
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_at || typeof tokens.expires_at !== 'number') {
    console.error('[strava] invalid token response: missing or malformed fields')
    return NextResponse.redirect(`${appUrl}/u/${safeSlug}/history?strava=error`)
  }

  // Zapisz połączenie
  const { error: upsertErr } = await adminClient.from('strava_connections').upsert({
    athlete_id: oauthState.athlete_id,
    strava_athlete_id: tokens.athlete?.id ?? null,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(tokens.expires_at * 1000).toISOString(),
  }, { onConflict: 'athlete_id' })

  if (upsertErr) {
    console.error('[strava] upsert failed:', upsertErr.message)
    return NextResponse.redirect(`${appUrl}/u/${safeSlug}/history?strava=error`)
  }

  // Pobierz aktywności w tle (nie blokuje redirectu)
  syncStravaActivities(oauthState.athlete_id, tokens.access_token).catch(e =>
    console.error('[strava] sync failed:', e)
  )

  return NextResponse.redirect(`${appUrl}/u/${safeSlug}/history?strava=connected`)
}

async function syncStravaActivities(athleteId: string, accessToken: string) {
  const res = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=50',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return

  const activities = await res.json()
  const runs = activities.filter((a: { type: string }) => a.type === 'Run' || a.type === 'TrailRun')
  if (!runs.length) return

  const { error: upsertError } = await adminClient.from('strava_activities').upsert(
    runs.map((a: {
      id: number; name: string; distance: number; moving_time: number;
      start_date: string; type: string; average_speed: number;
      average_heartrate?: number; max_heartrate?: number; total_elevation_gain?: number
    }) => ({
      athlete_id: athleteId,
      strava_id: a.id,
      name: a.name,
      distance: a.distance,
      moving_time: a.moving_time,
      start_date: a.start_date,
      type: a.type,
      average_speed: a.average_speed,
      average_heartrate: a.average_heartrate ?? null,
      max_heartrate: a.max_heartrate ?? null,
      total_elevation_gain: a.total_elevation_gain ?? null,
    })),
    { onConflict: 'strava_id' }
  )
  if (upsertError) {
    console.error('[strava] activities upsert failed:', upsertError.message)
  }
}
