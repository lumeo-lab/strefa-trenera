/** Shared invoice status helpers — used by Faktury, Analityka, Dashboard */

type InvoiceLike = {
  status: string
  due_date: string | null
  amount: number
}

export function isInvoiceOverdue(invoice: InvoiceLike, today: string): boolean {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return false
  if (invoice.status === 'overdue') return true
  return !!invoice.due_date && invoice.due_date < today
}

export function isInvoicePending(invoice: InvoiceLike, today: string): boolean {
  return invoice.status !== 'paid' && invoice.status !== 'cancelled' && !isInvoiceOverdue(invoice, today)
}

export function overdueDays(dueDate: string | null, today: string): number {
  if (!dueDate || dueDate >= today) return 0
  const due = new Date(`${dueDate}T12:00:00Z`)
  const now = new Date(`${today}T12:00:00Z`)
  return Math.floor((now.getTime() - due.getTime()) / 86400000)
}
