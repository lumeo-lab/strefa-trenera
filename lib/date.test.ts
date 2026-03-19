import { describe, expect, it } from 'vitest'
import { addDaysToBusinessDate } from './date'

describe('addDaysToBusinessDate', () => {
  it('adds positive days', () => {
    expect(addDaysToBusinessDate('2026-03-19', 1)).toBe('2026-03-20')
    expect(addDaysToBusinessDate('2026-03-19', 7)).toBe('2026-03-26')
  })

  it('subtracts days with negative value', () => {
    expect(addDaysToBusinessDate('2026-03-19', -1)).toBe('2026-03-18')
    expect(addDaysToBusinessDate('2026-03-19', -7)).toBe('2026-03-12')
  })

  it('handles month boundaries', () => {
    expect(addDaysToBusinessDate('2026-03-31', 1)).toBe('2026-04-01')
    expect(addDaysToBusinessDate('2026-04-01', -1)).toBe('2026-03-31')
  })

  it('handles year boundaries', () => {
    expect(addDaysToBusinessDate('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDaysToBusinessDate('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('returns same date for zero days', () => {
    expect(addDaysToBusinessDate('2026-03-19', 0)).toBe('2026-03-19')
  })
})
