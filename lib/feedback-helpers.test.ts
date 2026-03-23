import { describe, expect, it } from 'vitest'
import {
  formatDuration,
  formatPace,
  getActualsDisplay,
  getFeedbackDisplayData,
  getFeedbackLabel,
  getFeedbackPreview,
  getFeedbackSummaryChips,
  getSourceLabel,
  hasActuals,
  hasDisplayContent,
} from './feedback-helpers'
import type { FeedbackRow } from './supabase/database.types'

// Helper to build a minimal FeedbackRow for testing
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

describe('getFeedbackDisplayData', () => {
  it('prefers structural fields over parser', () => {
    const fb = makeFb({
      feeling: '😊',
      rpe: 7,
      pain_flag: true,
      pain_note: 'Łydka',
      notes_structured: 'Było OK',
      voice_transcript: 'Komentarz głosowy',
      transcript: 'Samopoczucie: 😫 | RPE: 3/10 | Notatka: Stara notatka',
    })
    const d = getFeedbackDisplayData(fb)
    expect(d.feeling).toBe('😊')
    expect(d.rpe).toBe('7/10')
    expect(d.pain).toBe('Łydka')
    expect(d.notes).toBe('Było OK')
    expect(d.voice).toBe('Komentarz głosowy')
  })

  it('falls back to parser when structural fields are empty', () => {
    const fb = makeFb({
      transcript: 'Samopoczucie: 😫 | RPE: 9/10 | Notatka: Z parsera',
    })
    const d = getFeedbackDisplayData(fb)
    expect(d.feeling).toBe('😫')
    expect(d.rpe).toBe('9/10')
    expect(d.notes).toBe('Z parsera')
  })

  it('handles completely empty feedback gracefully', () => {
    const fb = makeFb()
    const d = getFeedbackDisplayData(fb)
    expect(d.feeling).toBe('')
    expect(d.rpe).toBe('')
    expect(d.pain).toBe('')
    expect(d.notes).toBe('')
    expect(d.voice).toBe('')
  })

  it('pain_flag without pain_note returns "Tak"', () => {
    const fb = makeFb({ pain_flag: true })
    const d = getFeedbackDisplayData(fb)
    expect(d.pain).toBe('Tak')
  })
})

describe('hasDisplayContent', () => {
  it('returns true when feeling present', () => {
    const d = getFeedbackDisplayData(makeFb({ feeling: '😊' }))
    expect(hasDisplayContent(d)).toBe(true)
  })

  it('returns false when all empty', () => {
    const d = getFeedbackDisplayData(makeFb())
    expect(hasDisplayContent(d)).toBe(false)
  })
})

describe('getFeedbackLabel', () => {
  it('combines feeling + rpe', () => {
    const d = getFeedbackDisplayData(makeFb({ feeling: '😊', rpe: 5 }))
    expect(getFeedbackLabel(d)).toBe('😊 · 5/10')
  })

  it('returns "Komentarz głosowy" when only voice', () => {
    const d = getFeedbackDisplayData(makeFb({ voice_transcript: 'Hello' }))
    expect(getFeedbackLabel(d)).toBe('Komentarz głosowy')
  })

  it('returns "Feedback" when completely empty', () => {
    const d = getFeedbackDisplayData(makeFb())
    expect(getFeedbackLabel(d)).toBe('Feedback')
  })
})

describe('getFeedbackPreview', () => {
  it('prefers notes over voice', () => {
    const d = getFeedbackDisplayData(makeFb({ notes_structured: 'Notatka', voice_transcript: 'Głos' }))
    expect(getFeedbackPreview(d)).toBe('Notatka')
  })

  it('truncates long text', () => {
    const long = 'A'.repeat(100)
    const d = getFeedbackDisplayData(makeFb({ notes_structured: long }))
    expect(getFeedbackPreview(d, 70)).toHaveLength(71) // 70 + '…'
    expect(getFeedbackPreview(d, 70)).toMatch(/…$/)
  })
})

describe('getSourceLabel', () => {
  it('returns text + voice when both present', () => {
    const fb = makeFb({ feeling: '😊', voice_transcript: 'Hello' })
    const d = getFeedbackDisplayData(fb)
    expect(getSourceLabel(fb, d)).toBe('📝🎤 Tekst + głos')
  })

  it('returns watch label for auto source', () => {
    const fb = makeFb({ source: 'auto' })
    const d = getFeedbackDisplayData(fb)
    expect(getSourceLabel(fb, d)).toBe('⌚ Zegarek')
  })
})

describe('getActualsDisplay', () => {
  it('prefers Strava over session', () => {
    const strava = { distance: 10000, moving_time: 3600, average_speed: 2.78, average_heartrate: 150, max_heartrate: 180, total_elevation_gain: 100 }
    const session = { actual_distance: 9.5, actual_duration: 55, actual_pace: '5:30', avg_hr: 145, max_hr: 175 }
    const result = getActualsDisplay(strava, session, null)
    expect(result.source).toBe('strava')
    expect(result.distance).toBeCloseTo(10) // 10000m → 10km
    expect(result.duration).toBeCloseTo(60) // 3600s → 60min
  })

  it('falls back to session when no Strava', () => {
    const session = { actual_distance: 12.5, actual_duration: 60, actual_pace: '4:48', avg_hr: 155, max_hr: 185 }
    const result = getActualsDisplay(null, session, null)
    expect(result.source).toBe('session')
    expect(result.distance).toBe(12.5) // already in km
  })

  it('falls back to watch_data when no Strava or session', () => {
    const watch = { distance: 8.2, avgHR: 140, pace: '5:15' }
    const result = getActualsDisplay(null, null, watch)
    expect(result.source).toBe('watch')
    expect(result.distance).toBe(8.2)
  })

  it('returns null source when no data', () => {
    const result = getActualsDisplay(null, null, null)
    expect(result.source).toBe(null)
    expect(hasActuals(result)).toBe(false)
  })

  it('handles distance = 0 without treating as falsy', () => {
    const strava = { distance: 0, moving_time: 600, average_speed: null, average_heartrate: null, max_heartrate: null, total_elevation_gain: null }
    const result = getActualsDisplay(strava, null, null)
    expect(result.source).toBe('strava')
    expect(result.distance).toBe(0)
  })

  it('handles session with distance = 0', () => {
    const session = { actual_distance: 0, actual_duration: 30, actual_pace: null, avg_hr: null, max_hr: null }
    const result = getActualsDisplay(null, session, null)
    expect(result.source).toBe('session')
    expect(result.distance).toBe(0)
  })

  it('handles watch_data with distance = 0', () => {
    const watch = { distance: 0, avgHR: 120 }
    const result = getActualsDisplay(null, null, watch)
    expect(result.source).toBe('watch')
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(30)).toBe('30 min')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30min')
  })

  it('formats exact hours', () => {
    expect(formatDuration(120)).toBe('2h')
  })

  it('handles 0', () => {
    expect(formatDuration(0)).toBe('0 min')
  })

  it('handles negative values gracefully', () => {
    expect(formatDuration(-10)).toBe('0 min')
  })

  it('does not produce 60min (rounds total first)', () => {
    expect(formatDuration(59.7)).toBe('1h')
    expect(formatDuration(119.6)).toBe('2h')
    expect(formatDuration(89.5)).toBe('1h 30min')
  })
})

describe('formatPace', () => {
  it('converts m/s to min:sec/km', () => {
    const pace = formatPace(2.78)
    expect(pace).toMatch(/^[0-9]+:[0-9]{2}$/)
  })

  it('handles fast pace', () => {
    expect(formatPace(5)).toBe('3:20')
  })

  it('handles zero speed gracefully', () => {
    expect(formatPace(0)).toBe('–')
  })

  it('handles negative speed gracefully', () => {
    expect(formatPace(-1)).toBe('–')
  })

  it('handles extremely slow speed', () => {
    expect(formatPace(0.001)).toBe('–') // > 60 min/km
  })
})

describe('hasActuals', () => {
  it('returns true when distance is 0 (not null)', () => {
    expect(hasActuals({ source: 'strava', distance: 0, duration: null, pace: null, avgHr: null, maxHr: null, elevation: null })).toBe(true)
  })

  it('returns false when all fields are null', () => {
    expect(hasActuals({ source: null, distance: null, duration: null, pace: null, avgHr: null, maxHr: null, elevation: null })).toBe(false)
  })
})

describe('getFeedbackSummaryChips', () => {
  it('returns chips for red signal + pain + high RPE', () => {
    const fb = makeFb({ signal: 'red', pain_flag: true, pain_note: 'Łydka', rpe: 9 })
    const chips = getFeedbackSummaryChips(fb, false)
    expect(chips.map(c => c.label)).toContain('Czerwony sygnał')
    expect(chips.map(c => c.label)).toContain('Ból: Łydka')
    expect(chips.map(c => c.label)).toContain('RPE 9/10')
    expect(chips.map(c => c.label)).toContain('Brak odpowiedzi')
  })

  it('returns no signal chip for green feedback with reply', () => {
    const fb = makeFb({ signal: 'green', coach_reply: 'OK', rpe: 3 })
    const chips = getFeedbackSummaryChips(fb, false)
    expect(chips).toHaveLength(0)
  })

  it('includes Strava chip when strava data present', () => {
    const fb = makeFb({ signal: 'green', coach_reply: 'OK' })
    const chips = getFeedbackSummaryChips(fb, true)
    expect(chips.map(c => c.label)).toContain('Strava')
  })

  it('truncates long pain_note in chip', () => {
    const longPain = 'A'.repeat(50)
    const fb = makeFb({ pain_flag: true, pain_note: longPain })
    const chips = getFeedbackSummaryChips(fb, false)
    const painChip = chips.find(c => c.label.startsWith('Ból:'))
    expect(painChip).toBeDefined()
    expect(painChip!.label.length).toBeLessThanOrEqual(40) // "Ból: " + 30 + "…"
  })
})
