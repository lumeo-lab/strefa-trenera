'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const athleteId = formData.get('athlete_id') as string
  const content = formData.get('content') as string

  if (!athleteId || !content?.trim()) return { error: 'Brak wymaganych pól' }

  const { error } = await supabase.from('messages').insert({
    coach_id: user.id,
    athlete_id: athleteId,
    sender_type: 'coach',
    content: content.trim(),
  })

  if (error) return { error: error.message }

  revalidatePath('/coach/chat')
  return { success: true }
}
