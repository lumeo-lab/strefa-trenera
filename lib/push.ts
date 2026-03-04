import webpush from 'web-push'
import { adminClient } from '@/lib/supabase/admin'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url: string }) {
  const { data: subs } = await adminClient
    .from('push_subscriptions')
    .select('subscription, id')
    .eq('user_id', userId)

  if (!subs?.length) return

  const results = await Promise.allSettled(
    subs.map(row =>
      webpush.sendNotification(row.subscription, JSON.stringify(payload))
        .catch(async (err) => {
          // Remove expired/invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await adminClient.from('push_subscriptions').delete().eq('id', row.id)
          }
          throw err
        })
    )
  )

  return results
}
