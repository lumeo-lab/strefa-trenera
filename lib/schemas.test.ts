import { describe, expect, it } from 'vitest'
import { raceSchema, contactFormSchema, coachNotesSchema } from './schemas'

describe('raceSchema', () => {
  it('accepts valid race data', () => {
    const result = raceSchema.safeParse({
      name: 'Maraton Warszawski',
      date: '2026-04-15',
      distance: '42.2 km',
      goal_time: '3:30:00',
      status: 'planned',
      result: '',
      notes: 'Cel A: sub 3:30',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = raceSchema.safeParse({
      name: '',
      date: '2026-04-15',
      status: 'planned',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const result = raceSchema.safeParse({
      name: 'Test',
      date: '15-04-2026',
      status: 'planned',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = raceSchema.safeParse({
      name: 'Test',
      date: '2026-04-15',
      status: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid statuses', () => {
    for (const status of ['planned', 'completed', 'dns', 'dnf']) {
      const result = raceSchema.safeParse({ name: 'Test', date: '2026-04-15', status })
      expect(result.success).toBe(true)
    }
  })

  it('trims and caps name length', () => {
    const result = raceSchema.safeParse({
      name: '  ' + 'A'.repeat(250) + '  ',
      date: '2026-04-15',
      status: 'planned',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name.length).toBeLessThanOrEqual(200)
      expect(result.data.name).not.toMatch(/^\s/)
    }
  })
})

describe('contactFormSchema', () => {
  it('accepts valid contact form', () => {
    const result = contactFormSchema.safeParse({
      name: 'Anna Kowalska',
      email: 'anna@example.com',
      subject: 'Pytanie o fakturę',
      message: 'Chciałabym zapytać o...',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = contactFormSchema.safeParse({
      name: 'Anna',
      email: '',
      subject: 'Test',
      message: 'Test message',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = contactFormSchema.safeParse({
      name: 'Anna',
      email: 'not-an-email',
      subject: 'Test',
      message: 'Test message',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty message', () => {
    const result = contactFormSchema.safeParse({
      name: 'Anna',
      email: 'anna@example.com',
      subject: 'Test',
      message: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('coachNotesSchema', () => {
  it('accepts valid notes', () => {
    const result = coachNotesSchema.safeParse({ coach_notes: 'Some notes here' })
    expect(result.success).toBe(true)
  })

  it('accepts empty notes', () => {
    const result = coachNotesSchema.safeParse({ coach_notes: '' })
    expect(result.success).toBe(true)
  })

  it('caps notes at 50000 chars', () => {
    const result = coachNotesSchema.safeParse({ coach_notes: 'A'.repeat(60000) })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.coach_notes.length).toBeLessThanOrEqual(50000)
    }
  })
})
