import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { subscription, userId, userType } = await req.json()
  if (!subscription || !userId || !userType) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  await adminClient.from('push_subscriptions').upsert({
    user_id: userId,
    user_type: userType,
    endpoint: subscription.endpoint,
    subscription: subscription,
  }, { onConflict: 'endpoint' })

  return NextResponse.json({ ok: true })
}
