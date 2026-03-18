'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_STATUSES, StatusDef } from '@/lib/athlete-status-defs'

const STORAGE_KEY = 'coach_statuses_v3'
const EVENT_NAME = 'coach-athlete-statuses-updated'

function sanitizeStatus(status: Partial<StatusDef>, fallback: StatusDef): StatusDef {
  return {
    key: typeof status.key === 'string' && status.key.trim() ? status.key.trim().slice(0, 120) : fallback.key,
    label: typeof status.label === 'string' && status.label.trim() ? status.label.trim().slice(0, 120) : fallback.label,
    color: typeof status.color === 'string' && /^#([A-Fa-f0-9]{6})$/.test(status.color.trim()) ? status.color.trim() : fallback.color,
  }
}

function normalizeStatuses(input: unknown): StatusDef[] {
  if (!Array.isArray(input) || input.length === 0) return DEFAULT_STATUSES.map((status) => ({ ...status }))

  const defaults = DEFAULT_STATUSES.map((status) => ({ ...status }))
  const builtins = defaults.map((status) => {
    const incoming = input.find((item) => item && typeof item === 'object' && 'key' in item && item.key === status.key)
    return sanitizeStatus((incoming ?? {}) as Partial<StatusDef>, status)
  })

  const custom = input
    .filter((item): item is Partial<StatusDef> => !!item && typeof item === 'object')
    .map((item, index) => {
      const fallback = { key: `custom_${index}`, label: 'Nowy status', color: '#3B82F6' }
      return sanitizeStatus(item, fallback)
    })
    .filter((status) => !defaults.some((builtin) => builtin.key === status.key))

  return [...builtins, ...custom]
}

export { DEFAULT_STATUSES }
export type { StatusDef }

export function useCustomStatuses(initialStatuses?: StatusDef[]) {
  const [all, setAll] = useState<StatusDef[]>(() => normalizeStatuses(initialStatuses ?? DEFAULT_STATUSES))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setAll(normalizeStatuses(initialStatuses ?? DEFAULT_STATUSES))
  }, [initialStatuses])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function loadStatuses() {
      setLoading(true)
      try {
        const res = await fetch('/api/athlete-statuses', { signal: controller.signal, cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Nie udało się pobrać statusów.')
        if (cancelled) return
        const normalized = normalizeStatuses(data?.items)
        setAll(normalized)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      } catch {
        if (controller.signal.aborted || cancelled) return
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) setAll(normalizeStatuses(JSON.parse(saved)))
        } catch {
          setAll(normalizeStatuses(initialStatuses ?? DEFAULT_STATUSES))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStatuses()

    function syncFromEvent() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) setAll(normalizeStatuses(JSON.parse(saved)))
      } catch {
        setAll(normalizeStatuses(initialStatuses ?? DEFAULT_STATUSES))
      }
    }

    window.addEventListener(EVENT_NAME, syncFromEvent)
    return () => {
      cancelled = true
      controller.abort()
      window.removeEventListener(EVENT_NAME, syncFromEvent)
    }
  }, [initialStatuses])

  async function saveAll(statuses: StatusDef[]) {
    const normalized = normalizeStatuses(statuses)
    const builtins = normalized.filter((status) => DEFAULT_STATUSES.some((builtin) => builtin.key === status.key))
    const custom = normalized.filter((status) => !DEFAULT_STATUSES.some((builtin) => builtin.key === status.key))

    const res = await fetch('/api/athlete-statuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ builtins, custom }),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error || 'Nie udało się zapisać statusów.')

    setAll(normalized)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new Event(EVENT_NAME))
  }

  return { all, saveAll, loading }
}
