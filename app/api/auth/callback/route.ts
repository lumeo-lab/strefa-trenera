import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/coach/athletes'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Prevent open redirect — only allow relative paths
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/coach/athletes'

  return NextResponse.redirect(new URL(safeNext, request.url))
}
