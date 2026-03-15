'use client'

import { useState, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export type KpiId = 'athletes' | 'feedback' | 'revenue' | 'payments'
export type SectionId =
  | 'week_summary' | 'today_plan' | 'messages' | 'alerts' | 'no_sessions_week'
  | 'feedback_list' | 'upcoming_races' | 'recent_athletes' | 'recent_invoices'

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
    { id: 'week_summary', visible: true },
    { id: 'today_plan', visible: true },
    { id: 'messages', visible: true },
    { id: 'alerts', visible: true },
    { id: 'no_sessions_week', visible: false },
    { id: 'feedback_list', visible: true },
    { id: 'upcoming_races', visible: true },
    { id: 'recent_athletes', visible: false },
    { id: 'recent_invoices', visible: false },
  ],
}

export const SECTION_COL: Record<SectionId, 'full' | 'left' | 'right'> = {
  week_summary: 'full',
  today_plan: 'left', messages: 'left', alerts: 'left', no_sessions_week: 'left',
  feedback_list: 'right', upcoming_races: 'right', recent_athletes: 'right', recent_invoices: 'right',
}

export const KPI_META: Record<KpiId, { label: string; icon: string }> = {
  athletes: { label: 'Aktywni zawodnicy',      icon: '👟' },
  feedback: { label: 'Nieprzeczytany feedback', icon: '📥' },
  revenue:  { label: 'Przychód miesięczny',     icon: '💰' },
  payments: { label: 'Oczekujące płatności',    icon: '💳' },
}

export const SECTION_META: Record<SectionId, { label: string; icon: string; desc: string }> = {
  week_summary:     { label: 'Podsumowanie tygodnia',     icon: '📊', desc: 'Pasek postępu bieżącego tygodnia' },
  today_plan:       { label: 'Dziś w planie',             icon: '📅', desc: 'Sesje zaplanowane na dziś' },
  messages:         { label: 'Ostatnie wiadomości',       icon: '💬', desc: 'Wiadomości od zawodników' },
  alerts:           { label: 'Wymagają uwagi',            icon: '⚠️', desc: 'Zawodnicy z alertem lub ostrzeżeniem' },
  no_sessions_week: { label: 'Bez planu w tygodniu',      icon: '🔴', desc: 'Zawodnicy bez sesji w tym tygodniu' },
  feedback_list:    { label: 'Nieprzeczytany feedback',   icon: '📥', desc: 'Lista nieprzeczytanych feedbacków' },
  upcoming_races:   { label: 'Nadchodzące zawody',        icon: '🏁', desc: 'Starty w ciągu 14 dni' },
  recent_athletes:  { label: 'Ostatnio dodani zawodnicy', icon: '👤', desc: 'Nowi zawodnicy w systemie' },
  recent_invoices:  { label: 'Ostatnie faktury',          icon: '🧾', desc: 'Ostatnio wystawione faktury' },
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
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(true)

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      if (s) setPrefs(mergeWithDefaults(JSON.parse(s)))
      setHintDismissed(!!localStorage.getItem('dashboard-hint-dismissed'))
    } catch { /* ignore */ }
  }, [])

  function savePrefs(next: Prefs) {
    setPrefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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
    setHintDismissed(true)
    localStorage.setItem('dashboard-hint-dismissed', '1')
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
