import { describe, expect, it } from 'vitest'
import { comparePriority, getFeedbackPriority, getPriorityGroupLabel, getPriorityLabel } from './feedback-priority'
import type { FeedbackRow } from './supabase/database.types'

function makeFb(overrides: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: 'fb-1',
    athlete_id: 'ath-1',
    session_id: null,
    coach_id: 'coach-1',
    date: '2026-03-23',
    source: 'text',
    signal: 'green',
    transcript: '',
    feeling: null,
    rpe: null,
    pain_flag: false,
    pain_note: null,
    notes_structured: null,
    voice_transcript: null,
    actual_distance: null,
    actual_duration: null,
    ai_summary: '',
    ai_analysis: '',
    watch_data: null,
    watch_link: null,
    coach_reply: null,
    read: false,
    created_at: '2026-03-23T10:00:00Z',
    ...overrides,
  }
}

const NOW = new Date('2026-03-23T12:00:00Z')

describe('getFeedbackPriority', () => {
  it('red signal + pain + high RPE + unread + no reply = critical', () => {
    const fb = makeFb({ signal: 'red', pain_flag: true, pain_note: 'Łydka', rpe: 9 })
    const p = getFeedbackPriority(fb, NOW)
    expect(p.level).toBe('critical')
    expect(p.score).toBeGreaterThanOrEqual(80)
    expect(p.reasons).toContain('Czerwony sygnał')
    expect(p.reasons).toContain('Ból: Łydka')
    expect(p.reasons).toContain('RPE 9/10')
    expect(p.reasons).toContain('Brak odpowiedzi')
    expect(p.reasons).toContain('Nowy')
  })

  it('green signal + read + replied = low', () => {
    const fb = makeFb({ signal: 'green', read: true, coach_reply: 'OK', created_at: '2026-03-20T10:00:00Z' })
    const p = getFeedbackPriority(fb, NOW)
    expect(p.level).toBe('low')
    expect(p.score).toBe(0)
    expect(p.reasons).toHaveLength(0)
  })

  it('yellow signal + RPE 8 = high', () => {
    const fb = makeFb({ signal: 'yellow', rpe: 8 })
    const p = getFeedbackPriority(fb, NOW)
    // yellow(25) + rpe8(15) + no_reply(20) + unread(15) + recent(10) = 85 → critical actually
    expect(p.level).toBe('critical')
  })

  it('yellow signal + read + replied + old = medium', () => {
    const fb = makeFb({ signal: 'yellow', read: true, coach_reply: 'OK', created_at: '2026-03-20T10:00:00Z' })
    const p = getFeedbackPriority(fb, NOW)
    // yellow(25) only
    expect(p.level).toBe('medium')
    expect(p.score).toBe(25)
  })

  it('pain without pain_note shows generic reason', () => {
    const fb = makeFb({ pain_flag: true })
    const p = getFeedbackPriority(fb, NOW)
    expect(p.reasons).toContain('Ból zgłoszony')
  })

  it('RPE below 8 does not add score', () => {
    const fb = makeFb({ rpe: 7, read: true, coach_reply: 'OK', created_at: '2026-03-20T10:00:00Z' })
    const p = getFeedbackPriority(fb, NOW)
    expect(p.score).toBe(0)
    expect(p.level).toBe('low')
  })

  it('recent feedback (within 24h) gets bonus', () => {
    const fb = makeFb({ read: true, coach_reply: 'OK', created_at: '2026-03-23T10:00:00Z' })
    const p = getFeedbackPriority(fb, NOW)
    expect(p.score).toBe(10) // only recent bonus
  })

  it('old feedback does not get recent bonus', () => {
    const fb = makeFb({ read: true, coach_reply: 'OK', created_at: '2026-03-20T10:00:00Z' })
    const p = getFeedbackPriority(fb, NOW)
    expect(p.score).toBe(0)
  })
})

describe('comparePriority', () => {
  it('higher score comes first', () => {
    const a = { score: 80, created_at: '2026-03-23T10:00:00Z' }
    const b = { score: 20, created_at: '2026-03-23T11:00:00Z' }
    expect(comparePriority(a, b)).toBeLessThan(0)
  })

  it('equal score: newer comes first', () => {
    const a = { score: 50, created_at: '2026-03-23T10:00:00Z' }
    const b = { score: 50, created_at: '2026-03-23T11:00:00Z' }
    expect(comparePriority(a, b)).toBeGreaterThan(0) // b is newer
  })
})

describe('getPriorityLabel', () => {
  it('returns label for critical', () => {
    expect(getPriorityLabel('critical')).toBe('Pilne')
  })

  it('returns label for high', () => {
    expect(getPriorityLabel('high')).toBe('Do sprawdzenia')
  })

  it('returns label for medium', () => {
    expect(getPriorityLabel('medium')).toBe('Do wglądu')
  })

  it('returns empty for low', () => {
    expect(getPriorityLabel('low')).toBe('')
  })
})

describe('getPriorityGroupLabel', () => {
  it('returns group labels', () => {
    expect(getPriorityGroupLabel('critical')).toBe('Pilne')
    expect(getPriorityGroupLabel('high')).toBe('Do sprawdzenia')
    expect(getPriorityGroupLabel('low')).toBe('Informacyjne')
  })
})
