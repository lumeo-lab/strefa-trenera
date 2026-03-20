import { describe, expect, it } from 'vitest'
import { buildMetricMapsFromFallback } from './athlete-list-metrics'

const emptyInput = {
  lastSessions: null,
  recentSessions: null,
  allFeedbacks: null,
  upcomingSessions: null,
  unreadMsgs: null,
  monthSessions: null,
  unpaidInvoices: null,
  upcomingRaces: null,
}

describe('buildMetricMapsFromFallback', () => {
  it('returns empty maps for null inputs', () => {
    const result = buildMetricMapsFromFallback(emptyInput)
    expect(Object.keys(result.lastSessionMap)).toHaveLength(0)
    expect(Object.keys(result.signalMap)).toHaveLength(0)
    expect(Object.keys(result.complianceMap)).toHaveLength(0)
  })

  it('builds lastSessionMap from first session per athlete', () => {
    const result = buildMetricMapsFromFallback({
      ...emptyInput,
      lastSessions: [
        { athlete_id: 'a1', date: '2026-03-19', type: 'easy', title: 'Run 1' },
        { athlete_id: 'a1', date: '2026-03-18', type: 'tempo', title: 'Run 2' },
        { athlete_id: 'a2', date: '2026-03-17', type: 'long', title: 'Long run' },
      ],
    })
    expect(result.lastSessionMap['a1']).toEqual({ date: '2026-03-19', type: 'easy', title: 'Run 1' })
    expect(result.lastSessionMap['a2']).toEqual({ date: '2026-03-17', type: 'long', title: 'Long run' })
  })

  it('aggregates weekly load from recent sessions', () => {
    const result = buildMetricMapsFromFallback({
      ...emptyInput,
      recentSessions: [
        { athlete_id: 'a1', actual_distance: 10, planned_distance: 12 },
        { athlete_id: 'a1', actual_distance: null, planned_distance: 8 },
        { athlete_id: 'a2', actual_distance: 5, planned_distance: null },
      ],
    })
    expect(result.weeklyLoadMap['a1']).toBe(18) // 10 + 8 (fallback to planned)
    expect(result.weeklySessionCountMap['a1']).toBe(2)
    expect(result.weeklyLoadMap['a2']).toBe(5)
  })

  it('builds signal map from first feedback per athlete', () => {
    const result = buildMetricMapsFromFallback({
      ...emptyInput,
      allFeedbacks: [
        { athlete_id: 'a1', signal: 'red', created_at: '2026-03-19T10:00:00Z', read: false },
        { athlete_id: 'a1', signal: 'green', created_at: '2026-03-18T10:00:00Z', read: true },
      ],
    })
    expect(result.signalMap['a1']).toBe('red') // first = most recent
    expect(result.unreadFeedbackMap['a1']).toBe(1) // only 1 unread
  })

  it('calculates compliance from month sessions', () => {
    const result = buildMetricMapsFromFallback({
      ...emptyInput,
      monthSessions: [
        { athlete_id: 'a1', completed: true },
        { athlete_id: 'a1', completed: true },
        { athlete_id: 'a1', completed: false },
        { athlete_id: 'a2', completed: false },
      ],
    })
    expect(result.complianceMap['a1']).toEqual({ completed: 2, total: 3 })
    expect(result.complianceMap['a2']).toEqual({ completed: 0, total: 1 })
  })

  it('uses new execution statuses for next session and compliance', () => {
    const result = buildMetricMapsFromFallback({
      ...emptyInput,
      today: '2026-03-20',
      upcomingSessions: [
        { athlete_id: 'a1', date: '2026-03-20', type: 'easy', title: 'Detected run', status: 'detected', completed: false },
        { athlete_id: 'a1', date: '2026-03-21', type: 'tempo', title: 'Skipped should not win', status: 'skipped', completed: false },
      ],
      monthSessions: [
        { athlete_id: 'a1', date: '2026-03-10', status: 'detected', completed: false },
        { athlete_id: 'a1', date: '2026-03-11', status: 'skipped', completed: false },
        { athlete_id: 'a1', date: '2026-03-12', status: 'planned', completed: false },
        { athlete_id: 'a1', date: '2026-03-25', status: 'planned', completed: false },
      ],
    })

    expect(result.nextSessionMap['a1']).toEqual({ date: '2026-03-20', type: 'easy', title: 'Detected run' })
    expect(result.complianceMap['a1']).toEqual({ completed: 0, total: 3 })
  })

  it('tracks unpaid invoices', () => {
    const result = buildMetricMapsFromFallback({
      ...emptyInput,
      unpaidInvoices: [{ athlete_id: 'a1' }, { athlete_id: 'a3' }],
    })
    expect(result.unpaidInvoiceSet['a1']).toBe(true)
    expect(result.unpaidInvoiceSet['a3']).toBe(true)
    expect(result.unpaidInvoiceSet['a2']).toBeUndefined()
  })

  it('builds next race map from first race per athlete', () => {
    const result = buildMetricMapsFromFallback({
      ...emptyInput,
      upcomingRaces: [
        { athlete_id: 'a1', name: 'Maraton', date: '2026-04-15', distance: '42.2 km' },
        { athlete_id: 'a1', name: 'Półmaraton', date: '2026-05-01', distance: '21.1 km' },
      ],
    })
    expect(result.nextRaceMap['a1']).toEqual({ name: 'Maraton', date: '2026-04-15', distance: '42.2 km' })
  })
})
