'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markFeedbackRead(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  await supabase
    .from('feedbacks')
    .update({ read: true })
    .eq('id', id)
    .eq('coach_id', user.id)

  revalidatePath('/coach/feedback')
}

export async function replyFeedback(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const id = formData.get('id') as string
  const reply = formData.get('reply') as string

  if (!id || !reply) return { error: 'Brak wymaganych pól' }

  const { error } = await supabase
    .from('feedbacks')
    .update({ coach_reply: reply, read: true })
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/feedback')
  return { success: true }
}
