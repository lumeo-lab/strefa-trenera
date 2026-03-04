import { adminClient } from '@/lib/supabase/admin'

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url: string }) {
  try {
    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privKey = process.env.VAPID_PRIVATE_KEY
    const email = process.env.VAPID_EMAIL
    if (!pubKey || !privKey || !email) return

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpush = require('web-push')
    webpush.setVapidDetails(email, pubKey, privKey)

    const { data: subs, error } = await adminClient
      .from('push_subscriptions')
      .select('subscription, id')
      .eq('user_id', userId)

    if (error) { console.error('[push] DB error:', error.message); return }
    if (!subs?.length) return

    await Promise.allSettled(
      subs.map(row =>
        webpush.sendNotification(row.subscription, JSON.stringify(payload))
          .catch(async (err: { statusCode?: number; message?: string }) => {
            console.error('[push] error:', err.statusCode, err.message)
            if (err.statusCode === 410 || err.statusCode === 404) {
              await adminClient.from('push_subscriptions').delete().eq('id', row.id)
            }
          })
      )
    )
  } catch (err) {
    console.error('[push] fatal:', err)
  }
}
