'use client'

import { useState, useEffect } from 'react'

export const DEFAULT_STATUSES = [
  { key: 'ok',       label: 'OK',          color: '#2ECC71' },
  { key: 'warning',  label: 'Uwaga',       color: '#F1C40F' },
  { key: 'alert',    label: 'Alert',       color: '#E74C3C' },
  { key: 'inactive', label: 'Nieaktywny',  color: '#6B7280' },
]

export type StatusDef = { key: string; label: string; color: string }

const STORAGE_KEY = 'coach_custom_statuses'

export function useCustomStatuses() {
  const [custom, setCustom] = useState<StatusDef[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCustom(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  function saveCustom(statuses: StatusDef[]) {
    setCustom(statuses)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses))
  }

  return {
    all: [...DEFAULT_STATUSES, ...custom] as StatusDef[],
    custom,
    saveCustom,
  }
}
