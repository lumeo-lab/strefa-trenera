import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const slug = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')
  const appUrl = req.nextUrl.origin

  if (error || !code || !slug) {
    return NextResponse.redirect(`${appUrl}/u/${slug ?? ''}?strava=denied`)
  }

  // Znajdź zawodnika po slug
  const { data: athlete } = await adminClient
    .from('athletes')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!athlete) {
    return NextResponse.redirect(`${appUrl}/u/${slug}?strava=error`)
  }

  // Wymień code na tokeny
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/u/${slug}?strava=error`)
  }

  const tokens = await tokenRes.json()

  // Zapisz połączenie
  await adminClient.from('strava_connections').upsert({
    athlete_id: athlete.id,
    strava_athlete_id: tokens.athlete?.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(tokens.expires_at * 1000).toISOString(),
  }, { onConflict: 'athlete_id' })

  // Pobierz aktywności w tle
  await syncStravaActivities(athlete.id, tokens.access_token)

  return NextResponse.redirect(`${appUrl}/u/${slug}?strava=connected`)
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

  await adminClient.from('strava_activities').upsert(
    runs.map((a: {
      id: number; name: string; distance: number; moving_time: number;
      start_date: string; type: string; average_speed: number;
      average_heartrate?: number; max_heartrate?: number
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
    })),
    { onConflict: 'strava_id' }
  )
}
