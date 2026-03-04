import { adminClient } from '@/lib/supabase/admin'

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url: string }) {
  try {
    const webpush = (await import('web-push')).default

    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privKey = process.env.VAPID_PRIVATE_KEY
    const email = process.env.VAPID_EMAIL
    if (!pubKey || !privKey || !email) return

    webpush.setVapidDetails(email, pubKey, privKey)

    const { data: subs } = await adminClient
      .from('push_subscriptions')
      .select('subscription, id')
      .eq('user_id', userId)

    if (!subs?.length) return

    await Promise.allSettled(
      subs.map(row =>
        webpush.sendNotification(row.subscription, JSON.stringify(payload))
          .catch(async (err: { statusCode?: number }) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await adminClient.from('push_subscriptions').delete().eq('id', row.id)
            }
          })
      )
    )
  } catch {
    // Push errors should never break message sending
  }
}
