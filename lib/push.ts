import { adminClient } from '@/lib/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpush = require('web-push')

if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url: string }) {
  try {
    const { data: subs, error } = await adminClient
      .from('push_subscriptions')
      .select('subscription, id')
      .eq('user_id', userId)

    if (error) { console.error('[push] DB error:', error.message); return }
    if (!subs?.length) { console.log('[push] No subscriptions for user:', userId); return }

    const results = await Promise.allSettled(
      subs.map(row =>
        webpush.sendNotification(row.subscription, JSON.stringify(payload))
          .catch(async (err: { statusCode?: number; message?: string }) => {
            console.error('[push] sendNotification error:', err.statusCode, err.message)
            if (err.statusCode === 410 || err.statusCode === 404) {
              await adminClient.from('push_subscriptions').delete().eq('id', row.id)
            }
            throw err
          })
      )
    )

    results.forEach((r, i) => {
      if (r.status === 'rejected') console.error('[push] sub', i, 'failed:', r.reason)
    })
  } catch (err) {
    console.error('[push] Unexpected error:', err)
  }
}
