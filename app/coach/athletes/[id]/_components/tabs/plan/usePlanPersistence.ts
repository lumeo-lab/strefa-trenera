'use client'

import { useEffect, useState } from 'react'

interface PlanState {
  planView: 'week' | 'month'
  density: 'full' | 'compact'
  showFeedback: boolean
  weekOffset: number
  selectedMonth: string
  selectedDay: string | null
}

interface UsePlanPersistenceArgs {
  persistenceKey?: string
  currentMonth: string
  athleteId: string
}

const DEFAULTS: Omit<PlanState, 'selectedMonth'> = {
  planView: 'week',
  density: 'full',
  showFeedback: true,
  weekOffset: 0,
  selectedDay: null,
}

export function usePlanPersistence({ persistenceKey, currentMonth, athleteId }: UsePlanPersistenceArgs) {
  const [planView, setPlanView] = useState<'week' | 'month'>('week')
  const [density, setDensity] = useState<'full' | 'compact'>('full')
  const [showFeedback, setShowFeedback] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [stateReady, setStateReady] = useState(!persistenceKey)

  // Load from localStorage
  useEffect(() => {
    if (!persistenceKey) {
      setStateReady(true)
      return
    }

    setStateReady(false)
    try {
      const saved = localStorage.getItem(persistenceKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PlanState>
        if (parsed.planView === 'week' || parsed.planView === 'month') setPlanView(parsed.planView)
        if (parsed.density === 'full' || parsed.density === 'compact') setDensity(parsed.density)
        if (typeof parsed.showFeedback === 'boolean') setShowFeedback(parsed.showFeedback)
        if (typeof parsed.weekOffset === 'number' && Number.isFinite(parsed.weekOffset)) setWeekOffset(parsed.weekOffset)
        if (typeof parsed.selectedMonth === 'string' && /^\d{4}-\d{2}$/.test(parsed.selectedMonth)) setSelectedMonth(parsed.selectedMonth)
        if (typeof parsed.selectedDay === 'string' || parsed.selectedDay === null) setSelectedDay(parsed.selectedDay ?? null)
      } else {
        setPlanView(DEFAULTS.planView)
        setDensity(DEFAULTS.density)
        setShowFeedback(DEFAULTS.showFeedback)
        setWeekOffset(DEFAULTS.weekOffset)
        setSelectedMonth(currentMonth)
        setSelectedDay(DEFAULTS.selectedDay)
      }
    } catch {
      setPlanView(DEFAULTS.planView)
      setDensity(DEFAULTS.density)
      setShowFeedback(DEFAULTS.showFeedback)
      setWeekOffset(DEFAULTS.weekOffset)
      setSelectedMonth(currentMonth)
      setSelectedDay(DEFAULTS.selectedDay)
    } finally {
      setStateReady(true)
    }
  }, [persistenceKey, currentMonth, athleteId])

  // Save to localStorage
  useEffect(() => {
    if (!persistenceKey || !stateReady) return
    localStorage.setItem(
      persistenceKey,
      JSON.stringify({ planView, density, showFeedback, weekOffset, selectedMonth, selectedDay }),
    )
  }, [persistenceKey, stateReady, planView, density, showFeedback, weekOffset, selectedMonth, selectedDay])

  return {
    planView, setPlanView,
    density, setDensity,
    showFeedback, setShowFeedback,
    weekOffset, setWeekOffset,
    selectedMonth, setSelectedMonth,
    selectedDay, setSelectedDay,
    stateReady,
  }
}
