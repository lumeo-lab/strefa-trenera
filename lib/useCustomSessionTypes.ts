'use client'

import { useState, useEffect } from 'react'
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
  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>({})
  const [custom, setCustom] = useState<SessionTypeDef[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const d = JSON.parse(saved)
        setLabelOverrides(d.overrides ?? {})
        setCustom(d.custom ?? [])
      }
    } catch { /* ignore */ }
  }, [])

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
