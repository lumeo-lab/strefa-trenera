'use client'

import { useState } from 'react'
import { SessionType } from './types'
import { sessionTypeLabel } from './utils'

export const BUILTIN_SESSION_TYPE_KEYS: SessionType[] = ['easy', 'interval', 'tempo', 'long', 'gym', 'bike', 'rest']

export type SessionTypeDef = {
  key: string
  label: string
  color?: string    // hex — only for custom types
  isBuiltin: boolean
}

const STORAGE_KEY = 'coach_session_types_v1'

export function useCustomSessionTypes() {
  const [savedData] = useState(() => {
    if (typeof window === 'undefined') return { overrides: {} as Record<string, string>, custom: [] as SessionTypeDef[] }
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const d = JSON.parse(saved)
        return { overrides: (d.overrides ?? {}) as Record<string, string>, custom: (d.custom ?? []) as SessionTypeDef[] }
      }
    } catch { /* ignore */ }
    return { overrides: {} as Record<string, string>, custom: [] as SessionTypeDef[] }
  })
  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>(savedData.overrides)
  const [custom, setCustom] = useState<SessionTypeDef[]>(savedData.custom)

  const builtins: SessionTypeDef[] = BUILTIN_SESSION_TYPE_KEYS.map(k => ({
    key: k,
    label: labelOverrides[k] ?? sessionTypeLabel(k),
    isBuiltin: true,
  }))

  const all: SessionTypeDef[] = [...builtins, ...custom]

  function saveAll(overrides: Record<string, string>, customTypes: SessionTypeDef[]) {
    setLabelOverrides(overrides)
    setCustom(customTypes)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ overrides, custom: customTypes }))
  }

  return { all, builtins, custom, labelOverrides, saveAll }
}
