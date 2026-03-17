'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const [loading, setLoading] = useState(true)

  const builtins: SessionTypeDef[] = useMemo(() => BUILTIN_SESSION_TYPE_KEYS.map(k => ({
    key: k,
    label: labelOverrides[k] ?? sessionTypeLabel(k),
    isBuiltin: true,
  })), [labelOverrides])

  const all: SessionTypeDef[] = useMemo(() => [...builtins, ...custom], [builtins, custom])

  async function saveAll(overrides: Record<string, string>, customTypes: SessionTypeDef[]) {
    setLabelOverrides(overrides)
    setCustom(customTypes)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ overrides, custom: customTypes }))
    }

    const res = await fetch('/api/session-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overrides,
        custom: customTypes.map((type, index) => ({
          key: type.key,
          label: type.label,
          color: type.color ?? '#3B82F6',
          position: index,
        })),
      }),
    })

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      throw new Error(data?.error || 'Nie udało się zapisać typów treningów.')
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadFromServer() {
      try {
        const res = await fetch('/api/session-types', { cache: 'no-store' })
        const data = (await res.json().catch(() => null)) as {
          error?: string
          items?: Array<{
            key: string
            label: string
            color: string | null
            is_builtin: boolean
            position: number
          }>
        } | null

        if (!res.ok) {
          throw new Error(data?.error || 'Nie udało się pobrać typów treningów.')
        }

        if (cancelled) return

        const items = data?.items ?? []
        if (items.length > 0) {
          const nextOverrides: Record<string, string> = {}
          const nextCustom: SessionTypeDef[] = []

          for (const item of items) {
            if (item.is_builtin) {
              nextOverrides[item.key] = item.label
            } else {
              nextCustom.push({
                key: item.key,
                label: item.label,
                color: item.color ?? undefined,
                isBuiltin: false,
              })
            }
          }

          setLabelOverrides(nextOverrides)
          setCustom(nextCustom)
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ overrides: nextOverrides, custom: nextCustom }))
          }
          return
        }

        if (typeof window !== 'undefined' && (Object.keys(savedData.overrides).length > 0 || savedData.custom.length > 0)) {
          await saveAll(savedData.overrides, savedData.custom)
        }
      } catch {
        // Local fallback is already in state.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadFromServer()

    return () => {
      cancelled = true
    }
  // savedData intentionally used only for one-time migration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { all, builtins, custom, labelOverrides, saveAll, loading }
}
