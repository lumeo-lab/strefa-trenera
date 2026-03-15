'use client'

import { useState } from 'react'

export const DEFAULT_STATUSES = [
  { key: 'ok',       label: 'OK',             color: '#2ECC71' },
  { key: 'warning',  label: 'Pod obserwacją', color: '#F1C40F' },
  { key: 'alert',    label: 'Kontuzja',       color: '#E74C3C' },
  { key: 'inactive', label: 'Przerwa',        color: '#6B7280' },
]

export type StatusDef = { key: string; label: string; color: string }

const STORAGE_KEY = 'coach_statuses_v2'

export function useCustomStatuses() {
  const [all, setAll] = useState<StatusDef[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATUSES
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return DEFAULT_STATUSES
  })

  function saveAll(statuses: StatusDef[]) {
    setAll(statuses)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses))
  }

  return { all, saveAll }
}
