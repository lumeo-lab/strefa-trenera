'use server'

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AUTH_ERROR, FIELDS_ERROR } from '@/lib/constants'
import { assertCoachOwnsAthlete } from '@/lib/auth-guards'
import { addDaysToBusinessDate, getBusinessToday } from '@/lib/date'
import { createInvoiceSchema, updateInvoiceSchema, updateInvoiceStatusSchema, validateFormData } from '@/lib/schemas'

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])

function normalizeInvoiceAttachmentPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.split('/invoice-attachments/')[1] ?? null
  }
  return value
}

export async function createInvoice(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = validateFormData(createInvoiceSchema, formData)
  if ('error' in parsed) return parsed
  const {
    athlete_id: athleteId,
    description,
    amount,
    due_date: dueDate,
    package: pkg,
  } = parsed.data
  const file = formData.get('attachment') as File | null

  const ownsAthlete = await assertCoachOwnsAthlete(user.id, athleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const today = getBusinessToday()
  const { data: number, error: numberError } = await adminClient.rpc('next_coach_invoice_number', {
    p_coach_id: user.id,
    p_invoice_date: today,
  })

  if (numberError || !number) {
    return { error: numberError?.message ?? 'Nie udało się wygenerować numeru faktury' }
  }

  // Handle optional file upload
  let attachmentUrl: string | null = null
  if (file && file.size > 0) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      return { error: 'Załącznik musi być plikiem PDF, JPG lub PNG' }
    }
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return { error: 'Załącznik może mieć maksymalnie 10 MB' }
    }

    const ext = file.name.split('.').pop() ?? 'pdf'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await adminClient.storage
      .from('invoice-attachments')
      .upload(path, file, { contentType: file.type })
    if (uploadError) return { error: `Błąd uploadu: ${uploadError.message}` }
    attachmentUrl = path
  }

  const { error } = await supabase.from('invoices').insert({
    athlete_id: athleteId,
    coach_id: user.id,
    number,
    date: today,
    due_date: dueDate || addDaysToBusinessDate(today, 14),
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
}, athleteId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = updateInvoiceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? FIELDS_ERROR }

  // Always verify coach owns the athlete, fetching athlete_id from the invoice if not provided
  let resolvedAthleteId = athleteId
  if (!resolvedAthleteId) {
    const { data: inv } = await supabase
      .from('invoices')
      .select('athlete_id')
      .eq('id', id)
      .eq('coach_id', user.id)
      .single()
    if (!inv) return { error: AUTH_ERROR }
    resolvedAthleteId = inv.athlete_id
  }
  if (!resolvedAthleteId) return { error: AUTH_ERROR }
  const ownsAthlete = await assertCoachOwnsAthlete(user.id, resolvedAthleteId)
  if (!ownsAthlete) return { error: AUTH_ERROR }

  const { error } = await supabase
    .from('invoices')
    .update(parsed.data)
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/invoices')
  if (athleteId) revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

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
    const storagePath = normalizeInvoiceAttachmentPath(inv.attachment_url)
    if (storagePath) {
      await adminClient.storage.from('invoice-attachments').remove([storagePath])
    }
  }

  revalidatePath('/coach/invoices')
  return { success: true }
}

export async function updateInvoiceStatus(id: string, status: string, athleteId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const parsed = updateInvoiceStatusSchema.safeParse({ status })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Nieprawidłowy status' }

  const { error } = await supabase
    .from('invoices')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/coach/invoices')
  revalidatePath('/coach/analytics')
  revalidatePath('/coach/dashboard')
  if (athleteId) revalidatePath(`/coach/athletes/${athleteId}`)
  return { success: true }
}

export async function getInvoiceAttachmentUrl(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: AUTH_ERROR }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('attachment_url')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single()

  if (error || !invoice?.attachment_url) {
    return { error: error?.message ?? 'Brak załącznika' }
  }

  if (invoice.attachment_url.startsWith('http://') || invoice.attachment_url.startsWith('https://')) {
    return { success: true, url: invoice.attachment_url }
  }

  const { data: signed, error: signedError } = await adminClient.storage
    .from('invoice-attachments')
    .createSignedUrl(invoice.attachment_url, 60)

  if (signedError || !signed?.signedUrl) {
    return { error: signedError?.message ?? 'Nie udało się pobrać załącznika' }
  }

  return { success: true, url: signed.signedUrl }
}
