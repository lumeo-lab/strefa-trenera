import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { adminClient } from '@/lib/supabase/admin'
import { getAthleteFromSession } from '@/lib/athlete-auth'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Brak slug' }, { status: 400 })

  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nonce = randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const { error } = await adminClient.from('strava_oauth_states').insert({
    athlete_id: athlete.id,
    slug: athlete.slug,
    nonce,
    expires_at: expiresAt,
  })

  if (error) {
    return NextResponse.json({ error: 'Nie udało się rozpocząć autoryzacji' }, { status: 500 })
  }

  const origin = req.nextUrl.origin

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${origin}/api/strava/callback`,
    approval_prompt: 'auto',
    scope: 'activity:read_all',
    state: nonce,
  })

  return NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
