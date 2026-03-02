import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — important, do not remove
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Protect /coach/* — must be logged in as coach
  if (pathname.startsWith('/coach') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in coaches away from login/register
  if ((pathname === '/login' || pathname === '/register') && user) {
    return NextResponse.redirect(new URL('/coach/athletes', request.url))
  }

  // Protect /u/[slug]/* sub-pages — require athlete_session cookie
  // The base /u/[slug] page handles token verification itself
  const uSubMatch = pathname.match(/^\/u\/([^/]+)\/.+/)
  if (uSubMatch) {
    const slug = uSubMatch[1]
    const hasSession = request.cookies.has('athlete_session')
    if (!hasSession) {
      return NextResponse.redirect(new URL(`/u/${slug}`, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
