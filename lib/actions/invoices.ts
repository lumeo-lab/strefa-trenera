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
  const file = formData.get('attachment') as File | null

  if (!athleteId || !amount) return { error: 'Brak wymaganych pól' }

  const today = new Date().toISOString().split('T')[0]

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', user.id)

  const num = String((count || 0) + 1).padStart(3, '0')
  const year = new Date().getFullYear()
  const number = `FV/${year}/${num}`

  // Handle optional file upload
  let attachmentUrl: string | null = null
  if (file && file.size > 0) {
    const ext = file.name.split('.').pop() ?? 'pdf'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('invoice-attachments')
      .upload(path, file, { contentType: file.type })
    if (uploadError) return { error: `Błąd uploadu: ${uploadError.message}` }
    const { data: urlData } = supabase.storage.from('invoice-attachments').getPublicUrl(path)
    attachmentUrl = urlData.publicUrl
  }

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
    attachment_url: attachmentUrl,
  })

  if (error) return { error: error.message }

  revalidatePath('/coach/invoices')
  revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function updateInvoice(id: string, data: {
  description?: string
  amount?: number
  due_date?: string
  status?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  const { error } = await supabase
    .from('invoices')
    .update(data)
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/invoices')
  return { success: true }
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }

  // Fetch attachment_url before delete for storage cleanup
  const { data: inv } = await supabase
    .from('invoices')
    .select('attachment_url')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single()

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  // Best-effort: remove file from storage if present
  if (inv?.attachment_url) {
    const storagePath = inv.attachment_url.split('/invoice-attachments/')[1]
    if (storagePath) {
      await supabase.storage.from('invoice-attachments').remove([storagePath])
    }
  }

  revalidatePath('/coach/invoices')
  return { success: true }
}

export async function updateInvoiceStatus(id: string, status: string, athleteId?: string) {
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
  revalidatePath('/coach/analytics')
  revalidatePath('/coach/dashboard')
  if (athleteId) revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}
