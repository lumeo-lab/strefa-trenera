'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR } from '@/lib/constants'

export async function createPackage(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const price = parseFloat(formData.get('price') as string)

  if (!name?.trim()) return { error: 'Nazwa jest wymagana' }
  if (isNaN(price) || price < 0) return { error: 'Podaj prawidłową kwotę' }

  const { error } = await supabase.from('packages').insert({
    coach_id: user.id,
    name: name.trim(),
    description: description?.trim() || null,
    price,
  })

  if (error) return { error: error.message }
  revalidatePath('/coach/packages')
  revalidatePath('/coach/athletes')
  return { success: true }
}

export async function updatePackage(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const price = parseFloat(formData.get('price') as string)

  if (!name?.trim()) return { error: 'Nazwa jest wymagana' }
  if (isNaN(price) || price < 0) return { error: 'Podaj prawidłową kwotę' }

  const { error } = await supabase
    .from('packages')
    .update({ name: name.trim(), description: description?.trim() || null, price })
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/coach/packages')
  revalidatePath('/coach/athletes')
  return { success: true }
}

export async function deletePackage(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/coach/packages')
  revalidatePath('/coach/athletes')
  return { success: true }
}
