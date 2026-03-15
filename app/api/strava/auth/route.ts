import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getAthleteFromSession } from '@/lib/athlete-auth'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Brak slug' }, { status: 400 })

  const athlete = await getAthleteFromSession(slug)
  if (!athlete) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const signature = createHmac('sha256', secret).update(slug).digest('hex').slice(0, 16)
  const state = `${slug}:${signature}`

  const origin = req.nextUrl.origin

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${origin}/api/strava/callback`,
    approval_prompt: 'auto',
    scope: 'activity:read_all',
    state,
  })

  return NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
