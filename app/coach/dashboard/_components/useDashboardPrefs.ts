'use client'

import { useState, useSyncExternalStore } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export type KpiId = 'athletes' | 'feedback' | 'revenue' | 'payments'
export type SectionId =
  | 'today_actions' | 'today_plan' | 'messages' | 'alerts' | 'no_sessions_week'
  | 'feedback_list' | 'upcoming_races' | 'recent_athletes' | 'overdue_invoices'

export type Prefs = {
  kpi: { id: KpiId; visible: boolean }[]
  sections: { id: SectionId; visible: boolean }[]
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dashboard-prefs-v1'

export const DEFAULT_PREFS: Prefs = {
  kpi: [
    { id: 'athletes', visible: true },
    { id: 'feedback', visible: true },
    { id: 'revenue', visible: true },
    { id: 'payments', visible: true },
  ],
  sections: [
    { id: 'today_actions', visible: true },
    { id: 'today_plan', visible: true },
    { id: 'feedback_list', visible: true },
    { id: 'messages', visible: true },
    { id: 'alerts', visible: true },
    { id: 'no_sessions_week', visible: true },
    { id: 'upcoming_races', visible: true },
    { id: 'recent_athletes', visible: false },
    { id: 'overdue_invoices', visible: true },
  ],
}

export const SECTION_COL: Record<SectionId, 'full' | 'left' | 'right'> = {
  today_actions: 'full',
  today_plan: 'left', messages: 'left', alerts: 'left', no_sessions_week: 'left',
  feedback_list: 'right', upcoming_races: 'right', recent_athletes: 'right', overdue_invoices: 'right',
}

export const KPI_META: Record<KpiId, { label: string; icon: string }> = {
  athletes: { label: 'Aktywni zawodnicy', icon: '👟' },
  feedback: { label: 'Feedback do przeczytania', icon: '📥' },
  revenue: { label: 'Szacowany przychód w miesiącu', icon: '💰' },
  payments: { label: 'Faktury do opłacenia', icon: '💳' },
}

export const SECTION_META: Record<SectionId, { label: string; icon: string; desc: string }> = {
  today_actions:    { label: 'Najważniejsze na dziś', icon: '✅', desc: 'Szybka lista spraw do wykonania' },
  today_plan:       { label: 'Dziś w planie', icon: '📅', desc: 'Sesje zaplanowane na dziś' },
  messages:         { label: 'Nieprzeczytane wiadomości', icon: '💬', desc: 'Wiadomości, które czekają na odpowiedź' },
  alerts:           { label: 'Wymagają uwagi', icon: '⚠️', desc: 'Zawodnicy ze statusem uwagi lub alertu' },
  no_sessions_week: { label: 'Bez planu do końca tygodnia', icon: '🗓️', desc: 'Zawodnicy bez zaplanowanej sesji od dziś do niedzieli' },
  feedback_list:    { label: 'Feedback do przeczytania', icon: '📥', desc: 'Ostatnie wpisy, które czekają na reakcję' },
  upcoming_races:   { label: 'Nadchodzące zawody', icon: '🏁', desc: 'Starty w ciągu najbliższych 14 dni' },
  recent_athletes:  { label: 'Ostatnio dodani zawodnicy', icon: '👤', desc: 'Nowi zawodnicy w systemie' },
  overdue_invoices: { label: 'Płatności po terminie', icon: '🧾', desc: 'Faktury, które wymagają pilnego działania' },
}

export const SETTINGS_GROUPS: { label: string; col: 'kpi' | 'full' | 'left' | 'right' }[] = [
  { label: 'KPI karty', col: 'kpi' },
  { label: 'Pełna szerokość', col: 'full' },
  { label: 'Lewa kolumna', col: 'left' },
  { label: 'Prawa kolumna', col: 'right' },
]

// ── mergeWithDefaults ────────────────────────────────────────────────────────

function mergeWithDefaults(saved: Partial<Prefs>): Prefs {
  function merge<T extends { id: string }>(savedArr: T[] | undefined, defaults: T[]): T[] {
    const s = (savedArr ?? []).filter(x => defaults.some(d => d.id === x.id))
    const ids = new Set(s.map(x => x.id))
    return [...s, ...defaults.filter(d => !ids.has(d.id))]
  }
  return { kpi: merge(saved.kpi, DEFAULT_PREFS.kpi), sections: merge(saved.sections, DEFAULT_PREFS.sections) }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardPrefs() {
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [prefsOverride, setPrefsOverride] = useState<Prefs | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hintDismissedOverride, setHintDismissedOverride] = useState<boolean | null>(null)

  // Computed: override > stored > default (SSR-safe)
  const storedPrefs: Prefs = hydrated ? (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return mergeWithDefaults(JSON.parse(raw))
    } catch { /* ignore */ }
    return DEFAULT_PREFS
  })() : DEFAULT_PREFS

  const storedHintDismissed = hydrated ? (() => {
    try { return !!localStorage.getItem('dashboard-hint-dismissed') } catch { return true }
  })() : true

  const prefs = prefsOverride ?? storedPrefs
  const hintDismissed = hintDismissedOverride ?? storedHintDismissed

  function savePrefs(next: Prefs) {
    setPrefsOverride(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  function toggleKpi(id: KpiId) {
    savePrefs({ ...prefs, kpi: prefs.kpi.map(k => k.id === id ? { ...k, visible: !k.visible } : k) })
  }
  function toggleSection(id: SectionId) {
    savePrefs({ ...prefs, sections: prefs.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s) })
  }
  function moveKpi(id: KpiId, dir: -1 | 1) {
    const arr = [...prefs.kpi]
    const idx = arr.findIndex(k => k.id === id)
    const ti = idx + dir
    if (ti < 0 || ti >= arr.length) return
    ;[arr[idx], arr[ti]] = [arr[ti], arr[idx]]
    savePrefs({ ...prefs, kpi: arr })
  }
  function moveSection(id: SectionId, dir: -1 | 1) {
    const col = SECTION_COL[id]
    const arr = [...prefs.sections]
    const colItems = arr.map((s, i) => ({ ...s, i })).filter(s => SECTION_COL[s.id] === col)
    const ci = colItems.findIndex(s => s.id === id)
    const ti = ci + dir
    if (ti < 0 || ti >= colItems.length) return
    ;[arr[colItems[ci].i], arr[colItems[ti].i]] = [arr[colItems[ti].i], arr[colItems[ci].i]]
    savePrefs({ ...prefs, sections: arr })
  }

  function dismissHint() {
    setHintDismissedOverride(true)
    try { localStorage.setItem('dashboard-hint-dismissed', '1') } catch { /* ignore */ }
  }

  // Derived
  const visibleKpi = prefs.kpi.filter(k => k.visible)
  const visibleSections = prefs.sections.filter(s => s.visible)
  const fullSections = visibleSections.filter(s => SECTION_COL[s.id] === 'full')
  const leftSections = visibleSections.filter(s => SECTION_COL[s.id] === 'left')
  const rightSections = visibleSections.filter(s => SECTION_COL[s.id] === 'right')

  return {
    prefs, savePrefs,
    settingsOpen, setSettingsOpen,
    hintDismissed, dismissHint,
    toggleKpi, toggleSection, moveKpi, moveSection,
    visibleKpi, visibleSections, fullSections, leftSections, rightSections,
  }
}
