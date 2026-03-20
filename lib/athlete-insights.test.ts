import { describe, expect, it } from 'vitest'
import { buildAthleteInsights } from './athlete-insights'

describe('buildAthleteInsights', () => {
  it('builds overview, weekly progression and unplanned activities from connected data', () => {
    const insights = buildAthleteInsights({
      today: '2026-03-20',
      sessions: [
        {
          id: 's1',
          date: '2026-03-18',
          type: 'easy',
          title: 'Easy 10 km',
          planned_distance: 10,
          planned_duration: 60,
          actual_distance: 9.8,
          actual_duration: 58,
          status: 'completed',
          completion_source: 'athlete',
          actual_data_source: 'strava',
          linked_strava_activity_id: 1001,
        },
        {
          id: 's2',
          date: '2026-03-16',
          type: 'tempo',
          title: 'Tempo 8 km',
          planned_distance: 8,
          planned_duration: 45,
          actual_distance: null,
          actual_duration: null,
          status: 'skipped',
          completion_source: 'athlete',
          actual_data_source: null,
          linked_strava_activity_id: null,
        },
        {
          id: 's3',
          date: '2026-03-10',
          type: 'long',
          title: 'Long 18 km',
          planned_distance: 18,
          planned_duration: 110,
          actual_distance: 16,
          actual_duration: 103,
          status: 'detected',
          completion_source: 'strava',
          actual_data_source: 'strava',
          linked_strava_activity_id: 1002,
        },
        {
          id: 's4',
          date: '2026-03-05',
          type: 'interval',
          title: 'Interwały',
          planned_distance: 12,
          planned_duration: 70,
          actual_distance: 11.5,
          actual_duration: 68,
          status: 'completed',
          completion_source: 'coach',
          actual_data_source: 'coach',
          linked_strava_activity_id: null,
        },
        {
          id: 's5',
          date: '2026-03-03',
          type: 'easy',
          title: 'Easy unresolved',
          planned_distance: 7,
          planned_duration: 42,
          actual_distance: null,
          actual_duration: null,
          status: 'planned',
          completion_source: null,
          actual_data_source: null,
          linked_strava_activity_id: null,
        },
      ],
      feedbacks: [
        {
          id: 'f1',
          session_id: 's1',
          date: '2026-03-18',
          created_at: '2026-03-18T08:00:00Z',
          source: 'text',
          transcript: 'Samopoczucie: 😊\nRPE: 6/10\nNotatki: lekko',
          feeling: '😊',
          rpe: 6,
          pain_flag: false,
          pain_note: null,
          notes_structured: 'lekko',
          voice_transcript: null,
        },
        {
          id: 'f2',
          session_id: 's2',
          date: '2026-03-16',
          created_at: '2026-03-16T08:00:00Z',
          source: 'text',
          transcript: 'Samopoczucie: 😕\nRPE: 8/10\nBól / problem: łydka',
          feeling: '😕',
          rpe: 8,
          pain_flag: true,
          pain_note: 'łydka',
          notes_structured: null,
          voice_transcript: null,
        },
        {
          id: 'f3',
          session_id: 's4',
          date: '2026-03-05',
          created_at: '2026-03-05T08:00:00Z',
          source: 'text',
          transcript: 'Samopoczucie: 😐\nRPE: 7/10',
          feeling: '😐',
          rpe: 7,
          pain_flag: false,
          pain_note: null,
          notes_structured: null,
          voice_transcript: null,
        },
      ],
      stravaActivities: [
        {
          strava_id: 1001,
          start_date: '2026-03-18T06:00:00Z',
          name: 'Morning run',
          distance: 9800,
          moving_time: 3480,
          elapsed_time: 3600,
          total_elevation_gain: 120,
          average_heartrate: 148,
          max_heartrate: 170,
          average_cadence: 82,
          sport_type: 'Run',
          device_name: 'Garmin',
        },
        {
          strava_id: 1002,
          start_date: '2026-03-10T06:00:00Z',
          name: 'Long run',
          distance: 16000,
          moving_time: 6180,
          elapsed_time: 6300,
          total_elevation_gain: 190,
          average_heartrate: 152,
          max_heartrate: 176,
          average_cadence: 80,
          sport_type: 'Run',
          device_name: 'Garmin',
        },
        {
          strava_id: 2001,
          start_date: '2026-03-19T06:00:00Z',
          name: 'Extra recovery run',
          distance: 5000,
          moving_time: 1800,
          elapsed_time: 1860,
          total_elevation_gain: 30,
          average_heartrate: 135,
          max_heartrate: 150,
          average_cadence: 79,
          sport_type: 'Run',
          device_name: 'Garmin',
        },
      ],
    })

    expect(insights.overview).toMatchObject({
      dueSessions: 5,
      completedSessions: 2,
      skippedSessions: 1,
      detectedSessions: 1,
      unresolvedSessions: 1,
      completionRate: 40,
    })
    expect(insights.planVsActual.distance).toMatchObject({
      planned: 40,
      actual: 37.3,
      coverage: 3,
      deltaPercent: -7,
    })
    expect(insights.actualSources[0]).toMatchObject({ source: 'strava', count: 2 })
    expect(insights.unplannedActivities).toHaveLength(1)
    expect(insights.unplannedActivities[0]).toMatchObject({
      stravaId: 2001,
      distanceKm: 5,
      movingTime: 1800,
    })
    expect(insights.advanced.mostSkippedType).toBe('Tempo')
    expect(insights.recentSessions[0]).toMatchObject({
      id: 's1',
      status: 'completed',
      rpe: 6,
      feeling: '😊',
    })
    expect(insights.weeklyLoad).toHaveLength(4)
  })

  it('raises warning flags when pain and skips repeat', () => {
    const insights = buildAthleteInsights({
      today: '2026-03-20',
      sessions: [
        {
          id: 's1',
          date: '2026-03-19',
          type: 'tempo',
          title: 'Tempo',
          planned_distance: 8,
          planned_duration: 45,
          actual_distance: null,
          actual_duration: null,
          status: 'skipped',
          completion_source: 'athlete',
          actual_data_source: null,
          linked_strava_activity_id: null,
        },
        {
          id: 's2',
          date: '2026-03-17',
          type: 'tempo',
          title: 'Tempo',
          planned_distance: 8,
          planned_duration: 45,
          actual_distance: null,
          actual_duration: null,
          status: 'skipped',
          completion_source: 'athlete',
          actual_data_source: null,
          linked_strava_activity_id: null,
        },
      ],
      feedbacks: [
        {
          id: 'f1',
          session_id: 's1',
          date: '2026-03-19',
          created_at: '2026-03-19T09:00:00Z',
          source: 'text',
          transcript: '',
          feeling: '😕',
          rpe: 8,
          pain_flag: true,
          pain_note: 'łydka',
          notes_structured: null,
          voice_transcript: null,
        },
        {
          id: 'f2',
          session_id: 's2',
          date: '2026-03-17',
          created_at: '2026-03-17T09:00:00Z',
          source: 'text',
          transcript: '',
          feeling: '😫',
          rpe: 9,
          pain_flag: true,
          pain_note: 'kolano',
          notes_structured: null,
          voice_transcript: null,
        },
      ],
      stravaActivities: [],
    })

    const titles = insights.flags.map((flag) => flag.title)
    expect(titles).toContain('Powtarzające się pominięcia')
    expect(titles).toContain('Powtarzający się ból / problem')
  })

  it('detects taper phase when race is within 21 days', () => {
    const insights = buildAthleteInsights({
      today: '2026-03-20',
      sessions: [],
      feedbacks: [],
      nextRace: { name: 'Maraton', date: '2026-04-01', distance: '42.2 km' },
    })
    expect(insights.phase.detected).toBe('taper')
    expect(insights.phase.daysToRace).toBe(12)
    expect(insights.phase.raceName).toBe('Maraton')
  })

  it('detects race-specific when race is 22-56 days away', () => {
    const insights = buildAthleteInsights({
      today: '2026-03-20',
      sessions: [],
      feedbacks: [],
      nextRace: { name: 'Półmaraton', date: '2026-05-10', distance: '21.1 km' },
    })
    expect(insights.phase.detected).toBe('race-specific')
  })

  it('defaults to build when no race', () => {
    const insights = buildAthleteInsights({
      today: '2026-03-20',
      sessions: [],
      feedbacks: [],
    })
    expect(insights.phase.detected).toBe('build')
    expect(insights.phase.daysToRace).toBeNull()
  })

  it('computes ACWR from weekly load data', () => {
    const sessions = Array.from({ length: 20 }, (_, i) => ({
      id: `s${i}`, date: `2026-03-${String(1 + i).padStart(2, '0')}`,
      type: 'easy' as const, title: 'Run', planned_distance: 10, planned_duration: 60,
      actual_distance: 10, actual_duration: i >= 16 ? 120 : 60,
      status: 'completed' as const, completion_source: 'athlete' as const,
      actual_data_source: 'athlete' as const, linked_strava_activity_id: null,
      training_load: i >= 16 ? 80 : 40,
    }))
    const insights = buildAthleteInsights({ sessions, feedbacks: [], today: '2026-03-20' })
    expect(insights.load.acwr).not.toBeNull()
  })

  it('returns blue recommendation when insufficient data', () => {
    const insights = buildAthleteInsights({
      today: '2026-03-20',
      sessions: [{ id: 's1', date: '2026-03-18', type: 'easy' as const, title: 'Run',
        planned_distance: 10, planned_duration: 60, actual_distance: 10, actual_duration: 58,
        status: 'completed' as const, completion_source: 'athlete' as const,
        actual_data_source: null, linked_strava_activity_id: null }],
      feedbacks: [],
    })
    expect(insights.recommendation.tone).toBe('blue')
    expect(insights.recommendation.confidence).toBe('low')
  })
})
