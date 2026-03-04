'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCoachName(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Imię jest wymagane' }

  const { error } = await supabase.from('coaches').update({ name }).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/coach')
  return { success: true }
}

export async function updateCoachEmail(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const email = (formData.get('email') as string)?.trim()
  if (!email) return { error: 'Email jest wymagany' }
  if (email === user.email) return { error: 'Podaj nowy adres email' }

  const { error } = await supabase.auth.updateUser({ email })
  if (error) return { error: error.message }

  return { success: true, message: 'Wysłano link weryfikacyjny na nowy adres email' }
}

export async function updateCoachPassword(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const password = formData.get('password') as string
  const confirm = formData.get('confirm_password') as string

  if (!password || password.length < 6) return { error: 'Hasło musi mieć minimum 6 znaków' }
  if (password !== confirm) return { error: 'Hasła nie są identyczne' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { success: true }
}
