import { describe, expect, it } from 'vitest'
import { isInvoiceOverdue, isInvoicePending, overdueDays } from './invoice-helpers'

describe('isInvoiceOverdue', () => {
  const today = '2026-03-19'

  it('returns false for paid invoices regardless of due_date', () => {
    expect(isInvoiceOverdue({ status: 'paid', due_date: '2026-01-01', amount: 100 }, today)).toBe(false)
  })

  it('returns false for cancelled invoices', () => {
    expect(isInvoiceOverdue({ status: 'cancelled', due_date: '2026-01-01', amount: 100 }, today)).toBe(false)
  })

  it('returns true for status overdue', () => {
    expect(isInvoiceOverdue({ status: 'overdue', due_date: '2026-04-01', amount: 100 }, today)).toBe(true)
  })

  it('returns true when due_date is in the past and status is pending', () => {
    expect(isInvoiceOverdue({ status: 'pending', due_date: '2026-03-10', amount: 100 }, today)).toBe(true)
  })

  it('returns false when due_date is today', () => {
    expect(isInvoiceOverdue({ status: 'pending', due_date: '2026-03-19', amount: 100 }, today)).toBe(false)
  })

  it('returns false when due_date is in the future', () => {
    expect(isInvoiceOverdue({ status: 'pending', due_date: '2026-04-01', amount: 100 }, today)).toBe(false)
  })

  it('returns false when due_date is null', () => {
    expect(isInvoiceOverdue({ status: 'pending', due_date: null, amount: 100 }, today)).toBe(false)
  })
})

describe('isInvoicePending', () => {
  const today = '2026-03-19'

  it('returns true for pending invoice with future due_date', () => {
    expect(isInvoicePending({ status: 'pending', due_date: '2026-04-01', amount: 100 }, today)).toBe(true)
  })

  it('returns false for paid invoice', () => {
    expect(isInvoicePending({ status: 'paid', due_date: '2026-04-01', amount: 100 }, today)).toBe(false)
  })

  it('returns false for cancelled invoice', () => {
    expect(isInvoicePending({ status: 'cancelled', due_date: '2026-04-01', amount: 100 }, today)).toBe(false)
  })

  it('returns false for overdue invoice (past due_date)', () => {
    expect(isInvoicePending({ status: 'pending', due_date: '2026-03-10', amount: 100 }, today)).toBe(false)
  })

  it('returns true when due_date is today', () => {
    expect(isInvoicePending({ status: 'pending', due_date: '2026-03-19', amount: 100 }, today)).toBe(true)
  })
})

describe('overdueDays', () => {
  const today = '2026-03-19'

  it('returns 0 when due_date is null', () => {
    expect(overdueDays(null, today)).toBe(0)
  })

  it('returns 0 when due_date is today', () => {
    expect(overdueDays('2026-03-19', today)).toBe(0)
  })

  it('returns 0 when due_date is in the future', () => {
    expect(overdueDays('2026-03-25', today)).toBe(0)
  })

  it('returns correct days when overdue', () => {
    expect(overdueDays('2026-03-12', today)).toBe(7)
    expect(overdueDays('2026-03-18', today)).toBe(1)
    expect(overdueDays('2026-02-19', today)).toBe(28)
  })
})
