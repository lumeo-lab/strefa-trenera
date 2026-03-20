import { describe, expect, it } from 'vitest'
import {
  getSessionComplianceState,
  getSessionExecutionStatus,
  getStatusUpdateForExecution,
  isSessionOpenForExecution,
} from './session-status'

describe('session-status', () => {
  it('falls back to legacy completed boolean when status is missing', () => {
    expect(getSessionExecutionStatus({ date: '2026-03-20', completed: true })).toBe('completed')
    expect(getSessionExecutionStatus({ date: '2026-03-20', completed: false })).toBe('planned')
  })

  it('treats detected as open for execution and skipped as closed', () => {
    expect(isSessionOpenForExecution({ date: '2026-03-20', status: 'planned' })).toBe(true)
    expect(isSessionOpenForExecution({ date: '2026-03-20', status: 'detected' })).toBe(true)
    expect(isSessionOpenForExecution({ date: '2026-03-20', status: 'completed' })).toBe(false)
    expect(isSessionOpenForExecution({ date: '2026-03-20', status: 'skipped' })).toBe(false)
  })

  it('maps past planned sessions to past_unresolved compliance state', () => {
    expect(getSessionComplianceState({ date: '2026-03-10', status: 'planned' }, '2026-03-20')).toBe('past_unresolved')
    expect(getSessionComplianceState({ date: '2026-03-25', status: 'planned' }, '2026-03-20')).toBe('upcoming')
    expect(getSessionComplianceState({ date: '2026-03-20', status: 'detected' }, '2026-03-20')).toBe('detected')
  })

  it('builds consistent status update payloads', () => {
    const completed = getStatusUpdateForExecution('completed', 'athlete', '2026-03-20T10:00:00Z')
    expect(completed).toMatchObject({
      status: 'completed',
      completion_source: 'athlete',
      completed: true,
      completed_at: '2026-03-20T10:00:00Z',
    })

    const skipped = getStatusUpdateForExecution('skipped', 'coach')
    expect(skipped).toMatchObject({
      status: 'skipped',
      completion_source: 'coach',
      completed: false,
      completed_at: null,
    })
  })
})
