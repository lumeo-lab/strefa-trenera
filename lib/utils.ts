import { SessionType, FeedbackSignal, AthleteStatus, InvoiceStatus } from './types'

export function formatDate(isoDate: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('pl-PL', opts || { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function getWeekDays(weekOffset = 0): Date[] {
  const today = new Date('2026-02-28')
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function signalColor(signal: FeedbackSignal): string {
  const map: Record<FeedbackSignal, string> = {
    green: 'border-green-500',
    yellow: 'border-yellow-400',
    red: 'border-red-500',
  }
  return map[signal]
}

export function signalBg(signal: FeedbackSignal): string {
  const map: Record<FeedbackSignal, string> = {
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-400/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
  }
  return map[signal]
}

export function intensityColor(type: SessionType): string {
  const map: Record<SessionType, string> = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    interval: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    tempo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    long: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    rest: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    gym: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  return map[type]
}

export function sessionTypeLabel(type: SessionType): string {
  const map: Record<SessionType, string> = {
    easy: 'Easy',
    interval: 'Interwały',
    tempo: 'Tempo',
    long: 'Long Run',
    rest: 'Odpoczynek',
    gym: 'Siłownia',
  }
  return map[type]
}

export function statusColor(status: AthleteStatus): string {
  const map: Record<AthleteStatus, string> = {
    ok: 'bg-green-500',
    warning: 'bg-yellow-400',
    alert: 'bg-red-500',
    inactive: 'bg-gray-500',
  }
  return map[status]
}

export function invoiceStatusColor(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    paid: 'bg-green-500/10 text-green-400',
    pending: 'bg-yellow-400/10 text-yellow-400',
    overdue: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-gray-500/10 text-gray-400',
  }
  return map[status]
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    paid: 'Opłacona',
    pending: 'Oczekująca',
    overdue: 'Przeterminowana',
    cancelled: 'Anulowana',
  }
  return map[status]
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount)
}

export function dayName(date: Date, short = false): string {
  return date.toLocaleDateString('pl-PL', { weekday: short ? 'short' : 'long' })
}

export function isToday(isoDate: string): boolean {
  return isoDate === '2026-02-28'
}

export function isPast(isoDate: string): boolean {
  return isoDate < '2026-02-28'
}
