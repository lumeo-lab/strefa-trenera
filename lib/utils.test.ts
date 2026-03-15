import { describe, it, expect } from 'vitest'
import {
  plural, sesjaLabel, tenureLabel, formatCurrency,
  intensityColor, sessionTypeLabel, signalColor, signalBg,
  statusColor, invoiceStatusColor, invoiceStatusLabel,
  isToday, isPast, toISODate, getWeekDays,
} from './utils'

// ── plural ──────────────────────────────────────────────────────────────────

describe('plural', () => {
  it('returns "one" for 1', () => {
    expect(plural(1, 'sesja', 'sesje', 'sesji')).toBe('sesja')
  })
  it('returns "few" for 2-4', () => {
    expect(plural(2, 'sesja', 'sesje', 'sesji')).toBe('sesje')
    expect(plural(3, 'sesja', 'sesje', 'sesji')).toBe('sesje')
    expect(plural(4, 'sesja', 'sesje', 'sesji')).toBe('sesje')
  })
  it('returns "many" for 5-21', () => {
    expect(plural(5, 'sesja', 'sesje', 'sesji')).toBe('sesji')
    expect(plural(11, 'sesja', 'sesje', 'sesji')).toBe('sesji')
    expect(plural(12, 'sesja', 'sesje', 'sesji')).toBe('sesji')
    expect(plural(14, 'sesja', 'sesje', 'sesji')).toBe('sesji')
  })
  it('handles 21 correctly (one)', () => {
    expect(plural(21, 'sesja', 'sesje', 'sesji')).toBe('sesja')
  })
  it('handles 22-24 correctly (few)', () => {
    expect(plural(22, 'sesja', 'sesje', 'sesji')).toBe('sesje')
    expect(plural(23, 'sesja', 'sesje', 'sesji')).toBe('sesje')
    expect(plural(24, 'sesja', 'sesje', 'sesji')).toBe('sesje')
  })
  it('handles 25, 100, 112 correctly (many)', () => {
    expect(plural(25, 'sesja', 'sesje', 'sesji')).toBe('sesji')
    expect(plural(100, 'sesja', 'sesje', 'sesji')).toBe('sesji')
    expect(plural(112, 'sesja', 'sesje', 'sesji')).toBe('sesji')
  })
})

// ── sesjaLabel ──────────────────────────────────────────────────────────────

describe('sesjaLabel', () => {
  it('returns "1 sesja"', () => expect(sesjaLabel(1)).toBe('1 sesja'))
  it('returns "3 sesje"', () => expect(sesjaLabel(3)).toBe('3 sesje'))
  it('returns "5 sesji"', () => expect(sesjaLabel(5)).toBe('5 sesji'))
  it('returns "21 sesja"', () => expect(sesjaLabel(21)).toBe('21 sesja'))
})

// ── tenureLabel ─────────────────────────────────────────────────────────────

describe('tenureLabel', () => {
  it('returns "Nowy" for date this month', () => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    expect(tenureLabel(thisMonth)).toBe('Nowy')
  })
  it('returns months for < 12 months', () => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    const sixMonthsAgo = d.toISOString().split('T')[0]
    expect(tenureLabel(sixMonthsAgo)).toBe('6 mies.')
  })
  it('returns "1 rok" for exactly 12 months', () => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    const oneYearAgo = d.toISOString().split('T')[0]
    expect(tenureLabel(oneYearAgo)).toBe('1 rok')
  })
  it('returns "2 lata" for exactly 24 months', () => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 2)
    const twoYearsAgo = d.toISOString().split('T')[0]
    expect(tenureLabel(twoYearsAgo)).toBe('2 lata')
  })
})

// ── formatCurrency ──────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats PLN correctly', () => {
    const result = formatCurrency(249)
    expect(result).toContain('249')
    expect(result.toLowerCase()).toContain('zł')
  })
  it('formats 0', () => {
    expect(formatCurrency(0)).toContain('0')
  })
})

// ── Map functions ───────────────────────────────────────────────────────────

describe('intensityColor', () => {
  it('returns class for known type', () => {
    expect(intensityColor('easy')).toBe('session-easy')
    expect(intensityColor('interval')).toBe('session-interval')
    expect(intensityColor('tempo')).toBe('session-tempo')
  })
  it('returns fallback for unknown type', () => {
    expect(intensityColor('unknown' as any)).toBe('session-easy')
  })
})

describe('sessionTypeLabel', () => {
  it('returns Polish labels', () => {
    expect(sessionTypeLabel('interval')).toBe('Interwały')
    expect(sessionTypeLabel('rest')).toBe('Odpoczynek')
    expect(sessionTypeLabel('gym')).toBe('Siłownia')
  })
})

describe('signalColor', () => {
  it('returns border classes', () => {
    expect(signalColor('green')).toBe('border-green-500')
    expect(signalColor('yellow')).toBe('border-yellow-400')
    expect(signalColor('red')).toBe('border-red-500')
  })
})

describe('signalBg', () => {
  it('returns background classes', () => {
    expect(signalBg('green')).toContain('bg-green')
    expect(signalBg('red')).toContain('bg-red')
  })
})

describe('statusColor', () => {
  it('returns background classes', () => {
    expect(statusColor('ok')).toBe('bg-green-500')
    expect(statusColor('inactive')).toBe('bg-gray-500')
  })
})

describe('invoiceStatusColor', () => {
  it('returns color classes', () => {
    expect(invoiceStatusColor('paid')).toContain('green')
    expect(invoiceStatusColor('overdue')).toContain('red')
  })
})

describe('invoiceStatusLabel', () => {
  it('returns Polish labels', () => {
    expect(invoiceStatusLabel('paid')).toBe('Opłacona')
    expect(invoiceStatusLabel('pending')).toBe('Oczekująca')
    expect(invoiceStatusLabel('overdue')).toBe('Przeterminowana')
    expect(invoiceStatusLabel('cancelled')).toBe('Anulowana')
  })
})

// ── Date utilities ──────────────────────────────────────────────────────────

describe('isToday', () => {
  it('returns true for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isToday(today)).toBe(true)
  })
  it('returns false for yesterday', () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    expect(isToday(d.toISOString().split('T')[0])).toBe(false)
  })
})

describe('isPast', () => {
  it('returns true for yesterday', () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    expect(isPast(d.toISOString().split('T')[0])).toBe(true)
  })
  it('returns false for tomorrow', () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    expect(isPast(d.toISOString().split('T')[0])).toBe(false)
  })
  it('returns false for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isPast(today)).toBe(false)
  })
})

describe('toISODate', () => {
  it('returns YYYY-MM-DD format', () => {
    const date = new Date()
    const expected = date.toISOString().split('T')[0]
    expect(toISODate(date)).toBe(expected)
  })
  it('matches ISO format pattern', () => {
    const result = toISODate(new Date())
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('getWeekDays', () => {
  it('returns 7 days', () => {
    expect(getWeekDays(0)).toHaveLength(7)
  })
  it('starts on Monday', () => {
    const days = getWeekDays(0)
    expect(days[0].getDay()).toBe(1) // Monday
  })
  it('ends on Sunday', () => {
    const days = getWeekDays(0)
    expect(days[6].getDay()).toBe(0) // Sunday
  })
})
