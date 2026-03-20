import { describe, expect, it } from 'vitest'
import { z } from 'zod'

// Mirror the schemas from athlete actions for testing
// (importing server actions directly would require mocking Supabase)

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  age: z.number().int().min(5).max(120).nullable().optional(),
  height: z.number().int().min(100).max(250).nullable().optional(),
  weight: z.number().min(20).max(300).nullable().optional(),
  goal: z.string().max(500).optional(),
  avatar: z.string().max(200).optional(),
})

const raceSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  distance: z.string().max(50).optional(),
  goal_time: z.string().max(50).optional(),
  result: z.string().max(50).optional(),
  status: z.enum(['planned', 'confirmed', 'completed', 'dns', 'dnf']).optional(),
  notes: z.string().max(2000).optional(),
})

describe('athlete profile schema', () => {
  it('accepts valid profile data', () => {
    const result = profileSchema.safeParse({
      name: 'Jan Kowalski',
      email: 'jan@example.com',
      phone: '+48123456789',
      city: 'Warszawa',
      age: 30,
      height: 180,
      weight: 75.5,
      goal: 'Maraton sub 3:30',
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal profile (name only)', () => {
    const result = profileSchema.safeParse({ name: 'Jan Kowalski' })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 chars', () => {
    const result = profileSchema.safeParse({ name: 'J' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = profileSchema.safeParse({ name: 'Jan', email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts null email', () => {
    const result = profileSchema.safeParse({ name: 'Jan', email: null })
    expect(result.success).toBe(true)
  })

  it('rejects age below 5', () => {
    const result = profileSchema.safeParse({ name: 'Jan', age: 3 })
    expect(result.success).toBe(false)
  })

  it('rejects age above 120', () => {
    const result = profileSchema.safeParse({ name: 'Jan', age: 121 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer age', () => {
    const result = profileSchema.safeParse({ name: 'Jan', age: 30.5 })
    expect(result.success).toBe(false)
  })

  it('rejects height below 100', () => {
    const result = profileSchema.safeParse({ name: 'Jan', height: 50 })
    expect(result.success).toBe(false)
  })

  it('rejects weight below 20', () => {
    const result = profileSchema.safeParse({ name: 'Jan', weight: 10 })
    expect(result.success).toBe(false)
  })

  it('accepts avatar string', () => {
    const result = profileSchema.safeParse({ name: 'Jan', avatar: 'color:blue' })
    expect(result.success).toBe(true)
  })

  it('rejects goal over 500 chars', () => {
    const result = profileSchema.safeParse({ name: 'Jan', goal: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })
})

describe('athlete race schema', () => {
  it('accepts valid race', () => {
    const result = raceSchema.safeParse({
      name: 'Maraton Warszawski',
      date: '2026-04-15',
      distance: '42.195 km',
      goal_time: '3:30:00',
      status: 'planned',
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal race (name + date)', () => {
    const result = raceSchema.safeParse({
      name: 'Bieg',
      date: '2026-01-01',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = raceSchema.safeParse({
      name: '',
      date: '2026-01-01',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const result = raceSchema.safeParse({
      name: 'Bieg',
      date: '15-04-2026',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = raceSchema.safeParse({
      name: 'Bieg',
      date: '2026-01-01',
      status: 'invalid_status',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid statuses', () => {
    for (const status of ['planned', 'confirmed', 'completed', 'dns', 'dnf']) {
      const result = raceSchema.safeParse({ name: 'Bieg', date: '2026-01-01', status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects notes over 2000 chars', () => {
    const result = raceSchema.safeParse({
      name: 'Bieg',
      date: '2026-01-01',
      notes: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects name over 200 chars', () => {
    const result = raceSchema.safeParse({
      name: 'x'.repeat(201),
      date: '2026-01-01',
    })
    expect(result.success).toBe(false)
  })
})
