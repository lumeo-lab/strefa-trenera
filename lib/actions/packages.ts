'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR } from '@/lib/constants'
import { createPackageSchema, updatePackageSchema, validateFormData } from '@/lib/schemas'

export async function createPackage(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(createPackageSchema, formData)
  if ('error' in parsed) return parsed
  const { name, description, price } = parsed.data

  const { error } = await supabase.from('packages').insert({
    coach_id: user.id,
    name,
    description: description || null,
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

  const parsed = validateFormData(updatePackageSchema, formData)
  if ('error' in parsed) return parsed
  const { id, name, description, price } = parsed.data

  const { error } = await supabase
    .from('packages')
    .update({ name, description: description || null, price })
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
