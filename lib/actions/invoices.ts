'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInvoice(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const athleteId = formData.get('athlete_id') as string
  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)
  const dueDate = formData.get('due_date') as string
  const pkg = formData.get('package') as string

  if (!athleteId || !amount) return { error: 'Brak wymaganych pól' }

  const today = new Date().toISOString().split('T')[0]

  // Count existing invoices for numbering
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', user.id)

  const num = String((count || 0) + 1).padStart(3, '0')
  const year = new Date().getFullYear()
  const number = `FV/${year}/${num}`

  const { error } = await supabase.from('invoices').insert({
    athlete_id: athleteId,
    coach_id: user.id,
    number,
    date: today,
    due_date: dueDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() + 14)
      return d.toISOString().split('T')[0]
    })(),
    amount,
    status: 'pending',
    package: pkg || null,
    description: description || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/coach/invoices')
  return { success: true }
}

export async function updateInvoiceStatus(id: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/invoices')
  return { success: true }
}
