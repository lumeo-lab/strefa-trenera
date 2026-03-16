import { getBusinessToday, toBusinessDate } from './date'
import { AthleteStatus, FeedbackSignal, InvoiceStatus, SessionType } from './types'

export function formatDate(isoDate: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('pl-PL', opts || { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function getWeekDays(weekOffset = 0): Date[] {
  const today = new Date()
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
  return toBusinessDate(date)
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
    easy: 'session-easy',
    interval: 'session-interval',
    tempo: 'session-tempo',
    long: 'session-long',
    rest: 'session-rest',
    gym: 'session-gym',
    bike: 'session-bike',
  }
  return map[type] ?? 'session-easy'
}

export function sessionTypeLabel(type: SessionType): string {
  const map: Record<SessionType, string> = {
    easy: 'Easy',
    interval: 'Interwały',
    tempo: 'Tempo',
    long: 'Long Run',
    rest: 'Odpoczynek',
    gym: 'Siłownia',
    bike: 'Rower',
  }
  return map[type] ?? type
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
  return isoDate === getBusinessToday()
}

export function isPast(isoDate: string): boolean {
  return isoDate < getBusinessToday()
}

// ── Pomocniki dat ────────────────────────────────────────────────────────────

export function daysAgo(dateStr: string): { text: string; color: string } {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return { text: 'dziś', color: '#2ECC71' }
  if (diff === 1) return { text: 'wczoraj', color: 'var(--text-muted)' }
  if (diff > 21) return { text: `${diff} dni temu`, color: '#E74C3C' }
  return { text: `${diff} dni temu`, color: 'var(--text-muted)' }
}

export function daysUntil(dateStr: string): { days: number; text: string; color: string } {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  const diff = Math.floor((d.getTime() - now.getTime()) / 86400000)
  if (diff < 0) return { days: diff, text: '—', color: 'var(--text-muted)' }
  if (diff === 0) return { days: 0, text: 'dziś', color: '#FF5C1B' }
  if (diff === 1) return { days: 1, text: 'jutro', color: '#F1C40F' }
  return { days: diff, text: `za ${diff} dni`, color: 'var(--text-muted)' }
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min} min temu`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} godz. temu`
  return `${Math.floor(h / 24)} dni temu`
}

export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1 || (n % 10 === 1 && n % 100 !== 11)) return one
  if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return few
  return many
}

export function sesjaLabel(n: number): string {
  return `${n} ${plural(n, 'sesja', 'sesje', 'sesji')}`
}

// ── Feedback transcript parsing ─────────────────────────────────────────────

export interface ParsedFeedback {
  feeling: string
  trainingType: string
  distance: string
  duration: string
  intensity: string
  notes: string
}

export function parseFeedbackTranscript(transcript: string): ParsedFeedback {
  const result: ParsedFeedback = { feeling: '', trainingType: '', distance: '', duration: '', intensity: '', notes: '' }
  for (const part of (transcript ?? '').split(' | ')) {
    if (part.startsWith('Samopoczucie: ')) result.feeling = part.slice(14)
    else if (part.startsWith('Typ: ')) result.trainingType = part.slice(5)
    else if (part.startsWith('Dystans: ')) result.distance = part.slice(9)
    else if (part.startsWith('Czas: ')) result.duration = part.slice(6)
    else if (part.startsWith('Intensywność: ')) result.intensity = part.slice(14)
    else if (part.startsWith('Notatka: ')) result.notes = part.slice(9)
  }
  return result
}

export function hasParsedContent(p: ParsedFeedback): boolean {
  return !!(p.feeling || p.trainingType || p.distance || p.duration || p.intensity || p.notes)
}

export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function tenureLabel(joinDateStr: string): string {
  const join = new Date(joinDateStr)
  const now = new Date()
  const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth())
  if (months < 1) return 'Nowy'
  if (months < 12) return `${months} mies.`
  const years = Math.floor(months / 12)
  const rem = months % 12
  const yLabel = years === 1 ? 'rok'
    : (years % 10 >= 2 && years % 10 <= 4 && !(years % 100 >= 12 && years % 100 <= 14)) ? 'lata'
    : 'lat'
  if (rem === 0) return `${years} ${yLabel}`
  return `${years} ${yLabel} ${rem} mies.`
}
