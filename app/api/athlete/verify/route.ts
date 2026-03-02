import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const slug = searchParams.get('slug')
  const token = searchParams.get('t')

  if (!slug || !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Find athlete by slug + invite_token
  const { data: athlete } = await adminClient
    .from('athletes')
    .select('id')
    .eq('slug', slug)
    .eq('invite_token', token)
    .single()

  if (!athlete) {
    // Invalid token — redirect back with error
    return NextResponse.redirect(new URL(`/u/${slug}?invalid=1`, request.url))
  }

  // Create a session
  const { data: session } = await adminClient
    .from('athlete_sessions')
    .insert({ athlete_id: athlete.id })
    .select('token')
    .single()

  if (!session) {
    return NextResponse.redirect(new URL(`/u/${slug}?invalid=1`, request.url))
  }

  const response = NextResponse.redirect(new URL(`/u/${slug}`, request.url))
  response.cookies.set('athlete_session', session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  return response
}
