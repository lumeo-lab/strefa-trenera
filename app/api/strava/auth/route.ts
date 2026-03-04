import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Brak slug' }, { status: 400 })

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`,
    approval_prompt: 'auto',
    scope: 'activity:read_all',
    state: slug,
  })

  return NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
