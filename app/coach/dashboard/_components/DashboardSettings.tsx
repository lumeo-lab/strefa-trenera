'use client'

import {
  KPI_META, type KpiId, type Prefs, SECTION_COL, SECTION_META,
  type SectionId, SETTINGS_GROUPS,
} from './useDashboardPrefs'

// ── SettingsRow ───────────────────────────────────────────────────────────────

function SettingsRow({ icon, label, desc, visible, onToggle, onUp, onDown, canUp, canDown }: {
  icon: string; label: string; desc: string; visible: boolean
  onToggle: () => void; onUp: () => void; onDown: () => void
  canUp: boolean; canDown: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-colors"
      style={{ background: visible ? 'var(--bg-elevated)' : 'transparent' }}>
      <div className="flex flex-col gap-0.5 shrink-0">
        <button onClick={onUp} disabled={!canUp} aria-label={`Przesuń ${label} wyżej`} title={`Przesuń ${label} wyżej`}
          className="text-xs cursor-pointer disabled:opacity-20 hover:opacity-70 leading-none px-1 py-0.5">▲</button>
        <button onClick={onDown} disabled={!canDown} aria-label={`Przesuń ${label} niżej`} title={`Przesuń ${label} niżej`}
          className="text-xs cursor-pointer disabled:opacity-20 hover:opacity-70 leading-none px-1 py-0.5">▼</button>
      </div>
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      <button onClick={onToggle}
        aria-label={visible ? `Ukryj ${label}` : `Pokaż ${label}`}
        title={visible ? `Ukryj ${label}` : `Pokaż ${label}`}
        className="relative w-10 h-6 rounded-full transition-colors shrink-0"
        style={{ background: visible ? '#FF5C1B' : 'var(--bg-raised)' }}>
        <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: visible ? 'calc(100% - 22px)' : '2px' }} />
      </button>
    </div>
  )
}

// ── DashboardSettings ─────────────────────────────────────────────────────────

interface DashboardSettingsProps {
  prefs: Prefs
  visibleKpiCount: number
  visibleSectionsCount: number
  toggleKpi: (id: KpiId) => void
  toggleSection: (id: SectionId) => void
  moveKpi: (id: KpiId, dir: -1 | 1) => void
  moveSection: (id: SectionId, dir: -1 | 1) => void
}

export function DashboardSettings({
  prefs,
  visibleKpiCount,
  visibleSectionsCount,
  toggleKpi,
  toggleSection,
  moveKpi,
  moveSection,
}: DashboardSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <div className="text-sm font-medium">Widoczne elementy</div>
        <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {visibleKpiCount} kart KPI · {visibleSectionsCount} sekcji
        </div>
      </div>
      {SETTINGS_GROUPS.map(group => {
        if (group.col === 'kpi') {
          return (
            <div key="kpi">
              <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {group.label}
              </div>
              <div className="space-y-1">
                {prefs.kpi.map((k, i) => (
                  <SettingsRow
                    key={k.id}
                    icon={KPI_META[k.id].icon}
                    label={KPI_META[k.id].label}
                    desc=""
                    visible={k.visible}
                    onToggle={() => toggleKpi(k.id)}
                    onUp={() => moveKpi(k.id, -1)}
                    onDown={() => moveKpi(k.id, 1)}
                    canUp={i > 0}
                    canDown={i < prefs.kpi.length - 1}
                  />
                ))}
              </div>
            </div>
          )
        }
        const colSections = prefs.sections.filter(s => SECTION_COL[s.id] === group.col)
        if (colSections.length === 0) return null
        return (
          <div key={group.col}>
            <div className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {group.label}
            </div>
            <div className="space-y-1">
              {colSections.map((s, i) => (
                <SettingsRow
                  key={s.id}
                  icon={SECTION_META[s.id].icon}
                  label={SECTION_META[s.id].label}
                  desc={SECTION_META[s.id].desc}
                  visible={s.visible}
                  onToggle={() => toggleSection(s.id)}
                  onUp={() => moveSection(s.id, -1)}
                  onDown={() => moveSection(s.id, 1)}
                  canUp={i > 0}
                  canDown={i < colSections.length - 1}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
