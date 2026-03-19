'use server'

import { revokeCurrentAthleteSession } from '@/lib/athlete-auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ── Auth error mapping ──────────────────────────────────────────────────────

function mapAuthError(message: string): string {
  if (message === 'Invalid login credentials') return 'Nieprawidłowy email lub hasło.'
  if (message === 'Email not confirmed') return 'Potwierdź swój adres email przed zalogowaniem.'
  if (message.includes('already registered')) return 'Konto z tym adresem email już istnieje.'
  if (message.includes('rate limit') || message.includes('too many')) return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.'
  if (message.includes('weak password') || message.includes('should be at least')) return 'Hasło jest za słabe. Użyj co najmniej 6 znaków.'
  return message
}

// ── Coach auth actions ──────────────────────────────────────────────────────

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string ?? '').trim().toLowerCase()
  const password = formData.get('password') as string ?? ''

  if (!email || !password) return { error: 'Podaj email i hasło.' }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: mapAuthError(error.message) }

  redirect('/coach/athletes')
}

export async function register(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string ?? '').trim().toLowerCase()
  const password = formData.get('password') as string ?? ''
  const confirmPassword = formData.get('confirm_password') as string ?? ''
  const name = (formData.get('name') as string ?? '').trim()

  if (!email || !password || !name) return { error: 'Wypełnij wszystkie pola.' }
  if (name.length < 2) return { error: 'Imię musi mieć co najmniej 2 znaki.' }
  if (password.length < 6) return { error: 'Hasło musi mieć minimum 6 znaków.' }
  if (confirmPassword && password !== confirmPassword) return { error: 'Hasła nie są identyczne.' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) return { error: mapAuthError(error.message) }

  // If email confirmation is required, don't redirect — let client show info
  if (data.user && !data.user.confirmed_at) {
    return { success: true, needsConfirmation: true }
  }

  redirect('/coach/athletes')
}

export async function resetPassword(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string ?? '').trim().toLowerCase()

  if (!email) return { error: 'Podaj adres email.' }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/coach/settings`,
  })

  if (error) return { error: mapAuthError(error.message) }

  return { success: true }
}

// ── Session management ──────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function logoutAthlete(slug: string) {
  await revokeCurrentAthleteSession()
  redirect(`/u/${slug}`)
}
