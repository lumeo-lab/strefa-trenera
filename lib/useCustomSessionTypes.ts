'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { SessionType } from './types'
import { sessionTypeLabel } from './utils'
import { BUILTIN_SESSION_TYPE_KEYS, BUILTIN_TYPE_COLORS, SessionTypeDef } from './session-type-defs'

const STORAGE_KEY = 'coach_session_types_v1'
const SESSION_TYPES_UPDATED_EVENT = 'coach:session-types-updated'

function sanitizeCustomTypes(customTypes: SessionTypeDef[]): SessionTypeDef[] {
  return customTypes.filter((type) => !BUILTIN_SESSION_TYPE_KEYS.includes(type.key as SessionType))
}

function defaultBuiltins(): SessionTypeDef[] {
  return BUILTIN_SESSION_TYPE_KEYS.map((key) => ({
    key,
    label: sessionTypeLabel(key),
    color: BUILTIN_TYPE_COLORS[key],
    isBuiltin: true,
  }))
}

function normalizeBuiltinTypes(builtinTypes: SessionTypeDef[]): SessionTypeDef[] {
  return BUILTIN_SESSION_TYPE_KEYS.map((key) => {
    const item = builtinTypes.find((entry) => entry.key === key)
    return {
      key,
      label: item?.label?.trim() || sessionTypeLabel(key),
      color: item?.color || BUILTIN_TYPE_COLORS[key],
      isBuiltin: true,
    }
  })
}

function normalizeCustomTypes(customTypes: SessionTypeDef[]): SessionTypeDef[] {
  return sanitizeCustomTypes(customTypes)
    .map((type, index) => ({
      key: type.key?.trim() || `custom_${index}`,
      label: type.label?.trim() || 'Nowy typ',
      color: type.color || '#3B82F6',
      isBuiltin: false,
    }))
}

export function useCustomSessionTypes() {
  const migrationDataRef = useRef<{ builtins: SessionTypeDef[]; custom: SessionTypeDef[] } | null>(null)
  const [builtins, setBuiltins] = useState<SessionTypeDef[]>(defaultBuiltins)
  const [custom, setCustom] = useState<SessionTypeDef[]>([])
  const [loading, setLoading] = useState(true)

  const all: SessionTypeDef[] = useMemo(() => [...builtins, ...custom], [builtins, custom])
  const labelOverrides = useMemo(
    () => Object.fromEntries(builtins.map((item) => [item.key, item.label])),
    [builtins],
  )

  async function saveAll(builtinTypes: SessionTypeDef[], customTypes: SessionTypeDef[]) {
    const sanitizedBuiltins = normalizeBuiltinTypes(builtinTypes)
    const sanitizedCustomTypes = normalizeCustomTypes(customTypes)
    setBuiltins(sanitizedBuiltins)
    setCustom(sanitizedCustomTypes)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ builtins: sanitizedBuiltins, custom: sanitizedCustomTypes }))
      window.dispatchEvent(
        new CustomEvent(SESSION_TYPES_UPDATED_EVENT, {
          detail: { builtins: sanitizedBuiltins, custom: sanitizedCustomTypes },
        }),
      )
    }

    const res = await fetch('/api/session-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        builtins: sanitizedBuiltins.map((type, index) => ({
          key: type.key,
          label: type.label,
          color: type.color ?? BUILTIN_TYPE_COLORS[type.key as SessionType],
          position: index,
        })),
        custom: sanitizedCustomTypes.map((type, index) => ({
          key: type.key,
          label: type.label,
          color: type.color ?? '#3B82F6',
          position: sanitizedBuiltins.length + index,
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

    function handleExternalUpdate(event: Event) {
      const detail = (event as CustomEvent<{ builtins: SessionTypeDef[]; custom: SessionTypeDef[] }>).detail
      if (!detail) return
      setBuiltins(normalizeBuiltinTypes(detail.builtins))
      setCustom(normalizeCustomTypes(detail.custom))
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(SESSION_TYPES_UPDATED_EVENT, handleExternalUpdate as EventListener)
    }

    async function loadFromServer() {
      let savedData: { builtins: SessionTypeDef[]; overrides: Record<string, string>; custom: SessionTypeDef[] } = {
        builtins: [],
        overrides: {},
        custom: [],
      }

      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            const parsed = JSON.parse(saved)
            savedData = {
              builtins: (parsed.builtins ?? []) as SessionTypeDef[],
              overrides: (parsed.overrides ?? {}) as Record<string, string>,
              custom: (parsed.custom ?? []) as SessionTypeDef[],
            }
          }
        } catch {
          // ignore invalid local data
        }
      }

      const migratedBuiltins = normalizeBuiltinTypes(
        BUILTIN_SESSION_TYPE_KEYS.map((key) => {
          const savedBuiltin = savedData.builtins.find((item) => item.key === key)
          return {
            key,
            label: savedBuiltin?.label ?? savedData.overrides[key] ?? sessionTypeLabel(key),
            color: savedBuiltin?.color ?? BUILTIN_TYPE_COLORS[key],
            isBuiltin: true,
          }
        }),
      )
      const migratedCustom = normalizeCustomTypes(savedData.custom)
      migrationDataRef.current = { builtins: migratedBuiltins, custom: migratedCustom }

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
          const nextBuiltins: SessionTypeDef[] = []
          const nextCustom: SessionTypeDef[] = []

          for (const item of items) {
            if (item.is_builtin) {
              nextBuiltins.push({
                key: item.key,
                label: item.label,
                color: item.color ?? BUILTIN_TYPE_COLORS[item.key as SessionType],
                isBuiltin: true,
              })
            } else {
              nextCustom.push({
                key: item.key,
                label: item.label,
                color: item.color ?? undefined,
                isBuiltin: false,
              })
            }
          }

          const normalizedBuiltins = normalizeBuiltinTypes(nextBuiltins)

          setBuiltins(normalizedBuiltins)
          const sanitizedNextCustom = normalizeCustomTypes(nextCustom)
          setCustom(sanitizedNextCustom)
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ builtins: normalizedBuiltins, custom: sanitizedNextCustom }))
          }
          return
        }

        if (
          typeof window !== 'undefined' &&
          migrationDataRef.current &&
          (savedData.builtins.length > 0 || Object.keys(savedData.overrides).length > 0 || savedData.custom.length > 0)
        ) {
          await saveAll(migrationDataRef.current.builtins, migrationDataRef.current.custom)
        }
      } catch {
        if (!cancelled && migrationDataRef.current) {
          setBuiltins(migrationDataRef.current.builtins)
          setCustom(migrationDataRef.current.custom)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadFromServer()

    return () => {
      cancelled = true
      if (typeof window !== 'undefined') {
        window.removeEventListener(SESSION_TYPES_UPDATED_EVENT, handleExternalUpdate as EventListener)
      }
    }
  }, [])

  return { all, builtins, custom, labelOverrides, saveAll, loading }
}
