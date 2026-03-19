import { NextRequest, NextResponse } from 'next/server'
import { getAthleteFromSession } from '@/lib/athlete-auth'
import { getStravaConfig, syncStravaForAthlete } from '@/lib/strava'

export async function POST(req: NextRequest) {
  let body: { slug?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe dane' }, { status: 400 })
  }

  const { slug } = body
  if (!slug) return NextResponse.json({ error: 'Brak slug' }, { status: 400 })

  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!getStravaConfig()) {
    return NextResponse.json({ error: 'Brak konfiguracji Stravy' }, { status: 500 })
  }

  try {
    const result = await syncStravaForAthlete(athlete.id)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    if (message === 'missing_connection') {
      return NextResponse.json({ error: 'Brak połączenia ze Stravą' }, { status: 404 })
    }

    console.error('[strava] sync route failed:', error)
    return NextResponse.json({ error: 'Nie udało się zsynchronizować Stravy' }, { status: 500 })
  }
}
