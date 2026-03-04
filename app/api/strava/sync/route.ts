import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { athleteId } = await req.json()
  if (!athleteId) return NextResponse.json({ error: 'Brak athleteId' }, { status: 400 })

  const { data: conn } = await adminClient
    .from('strava_connections')
    .select('*')
    .eq('athlete_id', athleteId)
    .single()

  if (!conn) return NextResponse.json({ error: 'Brak połączenia ze Stravą' }, { status: 404 })

  // Odśwież token jeśli wygasł
  let accessToken = conn.access_token
  if (new Date(conn.expires_at) < new Date()) {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: conn.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) return NextResponse.json({ error: 'Błąd odświeżania tokenu' }, { status: 500 })
    const tokens = await res.json()
    accessToken = tokens.access_token
    await adminClient.from('strava_connections').update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(tokens.expires_at * 1000).toISOString(),
    }).eq('athlete_id', athleteId)
  }

  const res = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=50',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return NextResponse.json({ error: 'Błąd Strava API' }, { status: 500 })

  const activities = await res.json()
  const runs = activities.filter((a: { type: string }) => a.type === 'Run' || a.type === 'TrailRun')

  if (runs.length) {
    await adminClient.from('strava_activities').upsert(
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
  }

  return NextResponse.json({ synced: runs.length })
}
