import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getAthleteFromSession } from '@/lib/athlete-auth'

export async function POST(req: NextRequest) {
  let body: { subscription?: { endpoint: string; [key: string]: unknown }; userType?: string; slug?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { subscription, userType, slug } = body
  if (!subscription || !userType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  let userId: string

  if (userType === 'coach') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  } else if (userType === 'athlete') {
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
    const athlete = await getAthleteFromSession(slug)
    if (!athlete) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = athlete.id
  } else {
    return NextResponse.json({ error: 'Invalid userType' }, { status: 400 })
  }

  const { error } = await adminClient.from('push_subscriptions').upsert({
    user_id: userId,
    user_type: userType,
    endpoint: subscription.endpoint,
    subscription: subscription,
  }, { onConflict: 'endpoint' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
