'use client'

import { useState } from 'react'
import { ProfileEmptyState } from '../ProfileStates'
import { FEELING_LABELS } from '@/lib/constants'
import { buildAthleteInsights } from '@/lib/athlete-insights'
import { formatDate } from '@/lib/utils'
import type { CoachFeedbackRow, CoachStravaActivityRow, CoachTrainingSessionRow } from '../types'

interface InsightsTabProps {
  sessions: CoachTrainingSessionRow[]
  feedbacks: CoachFeedbackRow[]
  stravaActivities: CoachStravaActivityRow[]
  today: string
  nextRace?: { name: string; date: string; distance: string | null } | null
}

type InsightView = 'decision' | 'load' | 'response'

// ── Shared sub-components ──────────────────────────────────────────────

function ViewButton({ active, label, detail, onClick }: { active: boolean; label: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl px-4 py-3 text-left transition-colors cursor-pointer"
      style={{ background: active ? 'rgba(255,92,27,0.12)' : 'var(--bg-card)', border: `1px solid ${active ? 'rgba(255,92,27,0.22)' : 'var(--border)'}` }}>
      <div className="text-sm font-semibold" style={{ color: active ? '#FF5C1B' : 'var(--text-primary)' }}>{label}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{detail}</div>
    </button>
  )
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold cursor-help"
        style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>?</span>
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-30 hidden w-64 whitespace-normal rounded-xl px-3 py-2 text-[11px] leading-5 shadow-lg group-hover:block"
        style={{ background: 'rgba(15,23,42,0.96)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
        {text}
      </span>
    </span>
  )
}

function Stat({ label, value, detail, tone = 'default', tooltip }: {
  label: string; value: string; detail: string; tone?: 'default' | 'green' | 'orange' | 'red' | 'blue'; tooltip?: string
}) {
  const styles = {
    default: { bg: 'var(--bg-elevated)', color: 'var(--text-primary)' },
    green: { bg: 'rgba(46,204,113,0.10)', color: '#2ECC71' },
    orange: { bg: 'rgba(255,92,27,0.10)', color: '#FF5C1B' },
    red: { bg: 'rgba(231,76,60,0.10)', color: '#E74C3C' },
    blue: { bg: 'rgba(96,165,250,0.10)', color: '#60A5FA' },
  }[tone]
  return (
    <div className="rounded-xl p-3" style={{ background: styles.bg, border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>{label}</span>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className="text-xl font-semibold mt-1" style={{ color: styles.color }}>{value}</div>
      <div className="text-xs mt-0.5 leading-5" style={{ color: 'var(--text-muted)' }}>{detail}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      {children}
    </div>
  )
}

function SimpleBarChart({ items, color = 'linear-gradient(180deg, #FF5C1B, #FF7A42)' }: { items: Array<{ label: string; value: number; detail?: string }>; color?: string }) {
  const maxValue = Math.max(...items.map(i => i.value), 1)
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="flex items-end gap-3 h-44">
        {items.map(item => {
          const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 h-full">
              <div className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>{item.value}</div>
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t-xl" style={{ height: `${Math.max(height, 10)}%`, minHeight: '8px', background: color }} />
              </div>
              <div className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
              {item.detail && <div className="text-[10px] text-center leading-4" style={{ color: 'var(--text-muted)' }}>{item.detail}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeeklyZonesChart({ weeks }: { weeks: Array<{ label: string; total: number; z1: number; z2: number; z3: number; z4: number; z5: number }> }) {
  const tones = [
    { label: 'Z1', key: 'z1' as const, color: '#7DD3FC' },
    { label: 'Z2', key: 'z2' as const, color: '#34D399' },
    { label: 'Z3', key: 'z3' as const, color: '#FBBF24' },
    { label: 'Z4', key: 'z4' as const, color: '#FB923C' },
    { label: 'Z5', key: 'z5' as const, color: '#F87171' },
  ]
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap gap-3 items-center mb-3">
        {tones.map(t => (
          <span key={t.label} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} /> {t.label}
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {weeks.map(week => (
          <div key={week.label}>
            <div className="flex items-center justify-between gap-3 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              <span>{week.label}</span><span>{week.total} min</span>
            </div>
            <div className="h-7 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              {week.total > 0 && (
                <div className="flex h-full">
                  {tones.map(t => <div key={t.label} style={{ width: `${(week[t.key] / week.total) * 100}%`, background: t.color }} />)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────

export function InsightsTab({ sessions, feedbacks, stravaActivities, today, nextRace }: InsightsTabProps) {
  const [view, setView] = useState<InsightView>('load')
  const insights = buildAthleteInsights({ sessions, feedbacks, stravaActivities, today, nextRace })

  if (insights.overview.dueSessions === 0 && feedbacks.length === 0) {
    return (
      <ProfileEmptyState
        icon="📈"
        title="Za mało danych do analizy"
        description="Analiza pojawi się, gdy zawodnik zacznie wykonywać treningi i wysyłać feedback. Potrzeba minimum 3-4 sesji z potwierdzeniem."
      />
    )
  }

  const completionTone = insights.overview.completionRate != null && insights.overview.completionRate >= 75 ? 'green' : insights.overview.completionRate != null && insights.overview.completionRate >= 50 ? 'orange' : 'red'
  const loadTone = insights.load.deltaPercent != null && insights.load.deltaPercent >= 15 ? 'orange' : insights.load.deltaPercent != null && insights.load.deltaPercent <= -15 ? 'red' : 'blue'
  const reactionTone = insights.reaction.avgRpe != null && insights.reaction.avgRpe >= 7 ? 'orange' : insights.reaction.painCount > 0 ? 'orange' : 'green'

  // Prepared data
  const weeklyLoadItems = insights.weeklyLoad.map(w => ({ label: formatDate(w.start, { day: 'numeric', month: 'short' }), value: w.actualLoad, detail: `${w.actualDuration} min` }))
  const weeklyZones = insights.zones.weekly.map(w => ({ label: `${formatDate(w.start, { day: 'numeric', month: 'short' })}`, total: w.z1 + w.z2 + w.z3 + w.z4 + w.z5, z1: w.z1, z2: w.z2, z3: w.z3, z4: w.z4, z5: w.z5 }))
  const topTypes = insights.typeStats.slice(0, 6)
  const pva = insights.planVsActual
  const distDevPct = pva.distance && pva.distance.planned > 0 ? Math.round(((pva.distance.actual - pva.distance.planned) / pva.distance.planned) * 100) : null
  const durDevPct = pva.duration && pva.duration.planned > 0 ? Math.round(((pva.duration.actual - pva.duration.planned) / pva.duration.planned) * 100) : null

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <div className="grid gap-2 md:grid-cols-3">
        <ViewButton active={view === 'load'} label="1. Obciążenie" detail="Ile treningu było i czy tempo wzrostu jest bezpieczne." onClick={() => setView('load')} />
        <ViewButton active={view === 'response'} label="2. Reakcja" detail="Jak organizm odpowiada — samopoczucie, ból, tolerancja." onClick={() => setView('response')} />
        <ViewButton active={view === 'decision'} label="3. Decyzja" detail="Wniosek: kontynuować, zredukować czy wstrzymać plan." onClick={() => setView('decision')} />
      </div>

      {/* ── DECISION VIEW ── */}
      {view === 'decision' && (
        <div className="space-y-4">
          {/* Recommendation */}
          <div className="rounded-2xl p-4" style={{
            background: { green: 'rgba(46,204,113,0.08)', orange: 'rgba(255,92,27,0.08)', red: 'rgba(231,76,60,0.08)', blue: 'rgba(96,165,250,0.08)' }[insights.recommendation.tone],
            border: `1px solid ${{ green: 'rgba(46,204,113,0.2)', orange: 'rgba(255,92,27,0.2)', red: 'rgba(231,76,60,0.2)', blue: 'rgba(96,165,250,0.2)' }[insights.recommendation.tone]}`,
          }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: { green: '#2ECC71', orange: '#FF5C1B', red: '#E74C3C', blue: '#60A5FA' }[insights.recommendation.tone] }}>Werdykt trenerski</div>
                <h2 className="text-lg font-semibold mt-1">{insights.recommendation.title}</h2>
              </div>
              <span className="text-xs rounded-full px-2.5 py-1" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                title={insights.recommendation.confidence === 'high' ? '5+ sesji z feedbackiem' : insights.recommendation.confidence === 'medium' ? '3-4 sesje z feedbackiem' : 'Mniej niż 3 sesje z feedbackiem'}>
                Pewność: {insights.recommendation.confidence === 'high' ? 'wysoka' : insights.recommendation.confidence === 'medium' ? 'średnia' : 'niska'}
              </span>
            </div>
            {insights.recommendation.reasons.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {insights.recommendation.reasons.map(r => (
                  <div key={r} className="text-sm flex items-start gap-2"><span style={{ color: 'var(--text-muted)' }}>•</span><span>{r}</span></div>
                ))}
              </div>
            )}
          </div>

          {/* Phase context */}
          {insights.phase.detected !== 'build' && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{
              background: insights.phase.detected === 'taper' ? 'rgba(96,165,250,0.08)' : insights.phase.detected === 'recovery' ? 'rgba(46,204,113,0.08)' : 'rgba(255,92,27,0.08)',
              border: `1px solid ${insights.phase.detected === 'taper' ? 'rgba(96,165,250,0.2)' : insights.phase.detected === 'recovery' ? 'rgba(46,204,113,0.2)' : 'rgba(255,92,27,0.2)'}`,
            }}>
              <span className="text-lg">{insights.phase.detected === 'taper' ? '🏁' : insights.phase.detected === 'recovery' ? '🛌' : '🎯'}</span>
              <div>
                <div className="text-sm font-semibold">{insights.phase.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{insights.phase.detail}</div>
              </div>
            </div>
          )}

          {/* Key stats */}
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <Stat label="Realizacja planu" value={insights.overview.completionRate != null ? `${insights.overview.completionRate}%` : '—'} detail={`${insights.overview.completedSessions} z ${insights.overview.dueSessions} sesji`} tone={completionTone} />
            <Stat label="Obciążenie" value={insights.load.currentWeekLoad != null ? `${insights.load.currentWeekLoad}` : '—'} detail={insights.load.deltaPercent != null ? `${insights.load.deltaPercent > 0 ? '+' : ''}${insights.load.deltaPercent}% vs poprzedni tydzień` : 'Za mało danych'} tone={loadTone} tooltip="Łączy czas treningu i trudność (RPE). Im dłużej i ciężej, tym wyższe." />
            <Stat label="Średnie RPE" value={insights.reaction.avgRpe != null ? `${insights.reaction.avgRpe}` : '—'} detail={insights.reaction.rpeDelta != null ? `${insights.reaction.rpeDelta > 0 ? '+' : ''}${insights.reaction.rpeDelta} vs poprzednie 14 dni` : 'Brak porównania'} tone={reactionTone} tooltip="Rating of Perceived Exertion — subiektywna skala trudności 1-10." />
            <Stat label="Kluczowe sesje" value={insights.keySessions.completionRate != null ? `${insights.keySessions.completionRate}%` : '—'} detail={`${insights.keySessions.completed} wykonane · ${insights.keySessions.skipped} pominięte`} tone={insights.keySessions.completionRate != null && insights.keySessions.completionRate >= 75 ? 'green' : 'orange'} tooltip="Sesje oznaczone przez trenera jako najważniejsze dla mikrocyklu." />
          </div>

          {/* Plan vs Actual */}
          {(pva.distance || pva.duration) && (
            <Section title="Plan vs wykonanie (28 dni)">
              <div className="grid gap-2 md:grid-cols-2">
                {pva.distance && (
                  <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Dystans</div>
                      <div className="text-sm mt-0.5"><span style={{ color: 'var(--text-muted)' }}>{pva.distance.planned.toFixed(1)} km →</span> <span className="font-semibold">{pva.distance.actual.toFixed(1)} km</span></div>
                    </div>
                    {distDevPct != null && <span className="text-sm font-semibold" style={{ color: Math.abs(distDevPct) <= 10 ? '#2ECC71' : Math.abs(distDevPct) <= 25 ? '#F1C40F' : '#E74C3C' }}>{distDevPct > 0 ? '+' : ''}{distDevPct}%</span>}
                  </div>
                )}
                {pva.duration && (
                  <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Czas</div>
                      <div className="text-sm mt-0.5"><span style={{ color: 'var(--text-muted)' }}>{pva.duration.planned} min →</span> <span className="font-semibold">{pva.duration.actual} min</span></div>
                    </div>
                    {durDevPct != null && <span className="text-sm font-semibold" style={{ color: Math.abs(durDevPct) <= 10 ? '#2ECC71' : Math.abs(durDevPct) <= 25 ? '#F1C40F' : '#E74C3C' }}>{durDevPct > 0 ? '+' : ''}{durDevPct}%</span>}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Data quality */}
          <Section title="Jakość danych">
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Feedback: {insights.overview.feedbackCoverage ?? 0}% sesji ({insights.reaction.feedbackCount} feedbacków)</span>
              <span>Dane faktyczne: {insights.overview.actualCoverage ?? 0}% sesji</span>
              {insights.overview.unresolvedSessions > 0 && <span style={{ color: '#E74C3C' }}>{insights.overview.unresolvedSessions} sesji niewyjaśnionych</span>}
              {insights.actualSources.length > 0 && <span>Źródła: {insights.actualSources.map(s => s.label).join(', ')}</span>}
            </div>
          </Section>

          {/* Recent sessions */}
          {insights.recentSessions.length > 0 && (
            <Section title="Ostatnie sesje">
              <div className="space-y-1">
                {insights.recentSessions.slice(0, 7).map(s => (
                  <div key={s.id} className="flex items-center gap-3 text-xs py-1.5 px-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                    <span className="w-14 shrink-0" style={{ color: 'var(--text-muted)' }}>{formatDate(s.date, { day: 'numeric', month: 'short' })}</span>
                    <span className="flex-1 truncate font-medium">{s.title}</span>
                    <span className="rounded-full px-2 py-0.5" style={{
                      background: s.status === 'completed' ? 'rgba(46,204,113,0.12)' : s.status === 'detected' ? 'rgba(96,165,250,0.12)' : 'rgba(231,76,60,0.12)',
                      color: s.status === 'completed' ? '#2ECC71' : s.status === 'detected' ? '#60A5FA' : '#E74C3C',
                    }}>{s.status === 'completed' ? '✓' : s.status === 'detected' ? '⌚' : '✗'}</span>
                    {s.rpe != null && <span style={{ color: s.rpe >= 7 ? '#FF5C1B' : 'var(--text-muted)' }}>RPE {s.rpe}</span>}
                    {s.feeling && <span>{s.feeling} {FEELING_LABELS[s.feeling] ?? ''}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Flags */}
          {insights.flags.length > 0 && (
            <Section title="Sygnały">
              <div className="grid gap-2 md:grid-cols-2">
                {insights.flags.map(flag => (
                  <div key={`${flag.title}-${flag.detail}`} className="rounded-xl p-3 text-sm" style={{
                    background: flag.tone === 'green' ? 'rgba(46,204,113,0.08)' : flag.tone === 'red' ? 'rgba(231,76,60,0.08)' : flag.tone === 'orange' ? 'rgba(255,92,27,0.08)' : 'rgba(241,196,15,0.08)',
                    border: '1px solid var(--border)',
                  }}>
                    <div className="font-semibold">{flag.title}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{flag.detail}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Discipline section */}
          {(insights.advanced.monotony != null || insights.advanced.unplannedRatio != null || insights.advanced.chaosSignals.length > 0) && (
            <Section title="Dyscyplina planu">
              <div className="grid gap-2 md:grid-cols-3">
                {insights.advanced.monotony != null && (() => {
                  const m = insights.advanced.monotony
                  const mTone = m > 2.0 ? 'red' : m > 1.5 ? 'orange' : 'green'
                  const mLabel = m > 2.0 ? 'Za monotonne — brak kontrastu między dniami'
                    : m > 1.5 ? 'Umiarkowana zmienność'
                    : 'Dobra zmienność — ciężkie i lekkie dni się różnią'
                  return (
                    <Stat label="Zmienność treningowa" value={`${m}`} detail={mLabel} tone={mTone}
                      tooltip="Stosunek średniego dziennego obciążenia do jego odchylenia. >2.0 = za monotonne, badania łączą to z większym ryzykiem choroby i kontuzji." />
                  )
                })()}
                {insights.advanced.unplannedRatio != null && (
                  <Stat label="Poza planem" value={`${insights.advanced.unplannedRatio}%`}
                    detail={insights.advanced.unplannedRatio >= 30 ? 'Dużo aktywności nieplanowanych' : 'W normie'}
                    tone={insights.advanced.unplannedRatio >= 30 ? 'orange' : 'green'} />
                )}
              </div>
              {insights.advanced.chaosSignals.length > 0 && (
                <div className="mt-2 space-y-1">
                  {insights.advanced.chaosSignals.map(s => (
                    <div key={s} className="text-xs flex items-start gap-2 py-1" style={{ color: '#FF5C1B' }}>
                      <span>⚠️</span><span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}
        </div>
      )}

      {/* ── LOAD VIEW ── */}
      {view === 'load' && (() => {
        const acwr = insights.load.acwr
        const acwrTone = acwr == null ? 'default' : acwr >= 1.5 ? 'red' : acwr >= 1.3 ? 'orange' : acwr < 0.8 ? 'orange' : 'green'
        const acwrLabel = acwr == null ? 'Za mało danych'
          : acwr >= 1.5 ? 'Ryzyko — obciążenie rośnie za szybko. Zredukuj objętość.'
          : acwr >= 1.3 ? 'Ostrożność — blisko progu bezpieczeństwa. Nie zwiększaj.'
          : acwr < 0.8 ? 'Uwaga — obciążenie spada. Forma może uciekać.'
          : 'W normie — możesz utrzymać lub lekko zwiększyć.'
        const avgDist = weeklyLoadItems.length > 0 ? (insights.weeklyLoad.reduce((s, w) => s + w.actualDistance, 0) / insights.weeklyLoad.length).toFixed(1) : '0'
        const avgPlannedDist = insights.weeklyLoad.length > 0 ? (insights.weeklyLoad.reduce((s, w) => s + w.plannedDistance, 0) / insights.weeklyLoad.length).toFixed(1) : '0'
        const loadInterpretation = insights.load.deltaPercent != null
          ? `Obciążenie ${insights.load.deltaPercent > 0 ? 'wzrosło' : 'spadło'} o ${Math.abs(insights.load.deltaPercent)}% vs poprzedni tydzień. ${Math.abs(insights.load.deltaPercent) > 15 ? 'Powyżej 15% = ostrożność.' : 'W bezpiecznym zakresie.'}`
          : 'Za mało danych do porównania tygodni.'
        const zoneInterpretation = insights.zones.lowShare != null
          ? `Rozkład: ${insights.zones.lowShare}% łatwo / ${100 - insights.zones.lowShare}% ciężko. ${insights.zones.lowShare >= 75 ? 'Blisko modelu 80/20.' : insights.zones.lowShare >= 60 ? 'Za dużo intensywności — rozważ więcej łatwych biegów.' : 'Zdecydowanie za dużo ciężkich sesji.'}`
          : 'Brak danych o strefach tętna.'
        return (
          <div className="space-y-4">
            {/* ACWR gauge */}
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>Bezpieczeństwo obciążenia</span>
                    <InfoTooltip text="Stosunek obciążenia z ostatniego tygodnia do średniej z 4 tygodni. 0.8-1.3 = bezpiecznie, 1.3-1.5 = ostrożność, >1.5 = ryzyko kontuzji, <0.8 = spadek formy." />
                  </div>
                  <div className="text-2xl font-bold mt-1" style={{ color: { default: 'var(--text-muted)', green: '#2ECC71', orange: '#FF5C1B', red: '#E74C3C' }[acwrTone] }}>
                    {acwr ?? '—'}
                  </div>
                </div>
                {/* Visual gauge bar */}
                <div className="w-48 shrink-0">
                  <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-subtle)' }}>
                    <div style={{ width: '26.7%', background: '#F1C40F' }} />
                    <div style={{ width: '16.7%', background: '#2ECC71' }} />
                    <div style={{ width: '6.7%', background: '#F1C40F' }} />
                    <div style={{ width: '50%', background: '#E74C3C' }} />
                  </div>
                  <div className="flex justify-between text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>0.8</span><span>1.3</span><span>1.5</span><span>2.0</span>
                  </div>
                  {acwr != null && (
                    <div className="relative h-0">
                      <div className="absolute -top-4" style={{ left: `${Math.min(Math.max((acwr / 2) * 100, 2), 98)}%`, transform: 'translateX(-50%)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: { default: 'var(--text-muted)', green: '#2ECC71', orange: '#FF5C1B', red: '#E74C3C' }[acwrTone] }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{acwrLabel}</div>
            </div>

            {/* What is load - inline explanation */}
            <div className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
              Obciążenie treningowe łączy czas treningu i jego trudność w jedną liczbę. Im dłużej i ciężej zawodnik trenował, tym wyższe obciążenie. Pozwala porównywać tygodnie, nawet gdy składały się z różnych typów sesji.
            </div>

            {/* Load stats + chart */}
            <Section title="Obciążenie — tydzień po tygodniu">
              <div className="grid gap-2 md:grid-cols-4 mb-2">
                <Stat label="Ten tydzień" value={insights.load.currentWeekLoad != null ? `${insights.load.currentWeekLoad}` : '—'} detail="Suma obciążenia bieżącego tygodnia" tone="blue" tooltip="Obliczane jako: czas treningu (min) × trudność (RPE 1-10) ÷ 10. Np. 60 min przy RPE 7 = obciążenie 42." />
                <Stat label="Średnia 4 tyg." value={insights.load.rolling4WeekAverage != null ? `${insights.load.rolling4WeekAverage}` : '—'} detail="Bazowy poziom — do tego porównujemy" />
                <Stat label="Zmiana" value={insights.load.deltaPercent != null ? `${insights.load.deltaPercent > 0 ? '+' : ''}${insights.load.deltaPercent}%` : '—'} detail={`vs poprzedni tydzień. ${Math.abs(insights.load.deltaPercent ?? 0) > 15 ? 'Wzrost >15% = ostrożność.' : ''}`} tone={loadTone} />
                <Stat label="Trend" value={insights.load.trendLabel} detail="Ogólny kierunek zmian" />
              </div>
              <SimpleBarChart items={weeklyLoadItems} />
              <div className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>
                Każdy słupek to suma obciążenia z jednego tygodnia. {loadInterpretation}
              </div>
            </Section>

            {/* Km/week chart */}
            <Section title="Dystans — ile kilometrów tygodniowo">
              <SimpleBarChart items={insights.weeklyLoad.map(w => ({
                label: formatDate(w.start, { day: 'numeric', month: 'short' }),
                value: w.actualDistance,
                detail: w.plannedDistance > 0 ? `plan: ${w.plannedDistance} km` : undefined,
              }))} color="linear-gradient(180deg, #60A5FA, #93C5FD)" />
              <div className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>
                Każdy słupek to faktyczny dystans w danym tygodniu. Średnio {avgDist} km/tydz.{Number(avgPlannedDist) > 0 ? ` Plan zakładał ${avgPlannedDist} km/tydz.` : ''} Pod słupkiem widać planowany dystans do porównania.
              </div>
            </Section>

            {/* Zones */}
            <Section title="Strefy tętna">
              <div className="grid gap-2 md:grid-cols-4 mb-2">
                <Stat label="Z1 + Z2 (łatwo)" value={insights.zones.lowShare != null ? `${insights.zones.lowShare}%` : '—'} detail="Cel: ~80%" tone="green" tooltip="Strefa łatwa / aerobowa. Buduje bazę tlenową." />
                <Stat label="Z3 (średnio)" value={insights.zones.moderateShare != null ? `${insights.zones.moderateShare}%` : '—'} detail="Próg tlenowy" tone="orange" />
                <Stat label="Z4 + Z5 (ciężko)" value={insights.zones.highShare != null ? `${insights.zones.highShare}%` : '—'} detail={`Cel: ~20%. ${insights.zones.highShare != null && insights.zones.highShare > 30 ? '⚠️ Za dużo!' : ''}`} tone={insights.zones.highShare != null && insights.zones.highShare > 30 ? 'red' : 'default'} tooltip="Strefa progowa i VO2max. >30% = ryzyko." />
                <Stat label="Łączny czas" value={`${insights.zones.totalMinutes} min`} detail={`Z4 ${insights.zones.z4} · Z5 ${insights.zones.z5} min`} tone="blue" />
              </div>
              <WeeklyZonesChart weeks={weeklyZones} />
              <div className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>{zoneInterpretation}</div>
            </Section>
          </div>
        )
      })()}

      {/* ── RESPONSE VIEW ── */}
      {view === 'response' && (() => {
        const adv = insights.advanced
        const easyTrend = adv.easyRunRpeTrend
        const easyRising = easyTrend.length >= 3 && easyTrend[easyTrend.length - 1] - easyTrend[0] >= 1
        const keySess = insights.keySessions
        const keyInterpretation = keySess.due > 0
          ? `${keySess.completed} z ${keySess.due} kluczowych wykonane. ${keySess.skipped > 0 ? `${keySess.skipped} pominięte.` : ''} ${keySess.avgRpe != null ? `Reakcja: RPE ${keySess.avgRpe}.` : ''} ${keySess.painCount > 0 ? `Ból: ${keySess.painCount}×.` : 'Bez bólu.'}`
          : 'Brak kluczowych sesji w oknie analizy.'
        // Stimulus summary
        const stimulusSummary: string[] = []
        if (adv.bestToleratedType) stimulusSummary.push(`Najlepiej tolerowany: ${adv.bestToleratedType}`)
        if (adv.highestRpeType) stimulusSummary.push(`Najtrudniejszy: ${adv.highestRpeType}`)
        if (adv.mostSkippedType) stimulusSummary.push(`Najczęściej pomijany: ${adv.mostSkippedType}`)
        if (adv.painHeavyType) stimulusSummary.push(`Ból przy: ${adv.painHeavyType}`)

        return (
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-4">
              <Stat label="Średnie RPE" value={insights.reaction.avgRpe != null ? `${insights.reaction.avgRpe}` : '—'} detail={insights.reaction.rpeDelta != null ? `${insights.reaction.rpeDelta > 0 ? '+' : ''}${insights.reaction.rpeDelta} vs poprzednie 14 dni` : '—'} tone={reactionTone} tooltip="RPE (Rating of Perceived Exertion) to subiektywna ocena trudności treningu w skali 1-10, którą zawodnik podaje po sesji. Średnie RPE pokazuje jak ciężko zawodnik odczuwa treningi. Powyżej 7 = ciężko, powyżej 8 = bardzo ciężko." />
              <Stat label="Zgłoszenia bólu" value={`${insights.reaction.painCount}`} detail="Ostatnie 14 dni" tone={insights.reaction.painCount > 0 ? 'orange' : 'green'} tooltip="Ile razy zawodnik zgłosił ból lub problem w feedbacku po treningu." />
              <Stat label="Pokrycie feedbackiem" value={insights.overview.feedbackCoverage != null ? `${insights.overview.feedbackCoverage}%` : '—'} detail={`${insights.reaction.feedbackCount} feedbacków`} tooltip="Ile procent sesji ma feedback od zawodnika. Im wyższe pokrycie, tym bardziej wiarygodna analiza." />
              <Stat label="Samopoczucie" value={insights.reaction.dominantFeeling ? `${insights.reaction.dominantFeeling} ${FEELING_LABELS[insights.reaction.dominantFeeling] ?? ''}` : '—'} detail={insights.reaction.dominantFeelingLabel ?? 'Brak wzorca'} tooltip="Najczęściej wybierane emoji samopoczucia w feedbackach z ostatnich 28 dni." />
            </div>

            {/* Easy run RPE trend — fatigue signal */}
            {easyTrend.length >= 3 && (
              <div className="rounded-xl p-3" style={{
                background: easyRising ? 'rgba(255,92,27,0.08)' : 'var(--bg-card)',
                border: `1px solid ${easyRising ? 'rgba(255,92,27,0.2)' : 'var(--border)'}`,
              }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: easyRising ? '#FF5C1B' : 'var(--text-muted)' }}>
                    RPE na łatwych biegach
                  </span>
                  <InfoTooltip text="Jeśli RPE na łatwych biegach rośnie przy stałej objętości — to sygnał narastającego zmęczenia bazowego." />
                </div>
                <div className="flex items-end gap-1 h-10">
                  {easyTrend.map((rpe, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{
                      height: `${Math.max((rpe / 10) * 100, 15)}%`,
                      background: rpe >= 6 ? '#FF5C1B' : rpe >= 5 ? '#F1C40F' : '#2ECC71',
                    }} title={`RPE ${rpe}`} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span>starsze →</span>
                  <span>→ nowsze</span>
                </div>
                <div className="text-xs mt-2 italic" style={{ color: easyRising ? '#FF5C1B' : 'var(--text-muted)' }}>
                  {easyRising
                    ? `RPE na łatwych biegach rośnie (${easyTrend[0]} → ${easyTrend[easyTrend.length - 1]}). To może oznaczać narastające zmęczenie.`
                    : `RPE stabilne (~${(easyTrend.reduce((s, v) => s + v, 0) / easyTrend.length).toFixed(1)}). Brak sygnału zmęczenia bazowego.`
                  }
                </div>
              </div>
            )}

            {/* Key sessions review */}
            {keySess.due > 0 && (
              <Section title="Kluczowe sesje">
                <div className="grid gap-2 md:grid-cols-3">
                  <Stat label="Wykonane" value={`${keySess.completed}/${keySess.due}`} detail={keySess.completionRate != null ? `${keySess.completionRate}% realizacji` : '—'} tone={keySess.completionRate != null && keySess.completionRate >= 75 ? 'green' : 'orange'} />
                  <Stat label="Reakcja" value={keySess.avgRpe != null ? `RPE ${keySess.avgRpe}` : '—'} detail={keySess.painCount > 0 ? `${keySess.painCount} zgłoszeń bólu` : 'Bez bólu'} tone={keySess.painCount > 0 ? 'orange' : 'green'} />
                  <Stat label="Pominięte" value={`${keySess.skipped}`} detail={keySess.skipped > 0 ? 'Warto sprawdzić przyczynę' : 'Brak pominięć'} tone={keySess.skipped > 0 ? 'red' : 'green'} />
                </div>
                <div className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>{keyInterpretation}</div>
              </Section>
            )}

            {/* Session types with mini-trend */}
            {topTypes.length > 0 && (
              <Section title="Typy sesji — jak zawodnik radzi sobie z poszczególnymi bodźcami">
                <div className="text-xs mb-3 px-1" style={{ color: 'var(--text-muted)' }}>
                  Każda karta to jeden typ treningu z ostatnich 56 dni. Procent oznacza ile sesji tego typu zostało wykonanych. RPE to średnia trudność odczuwana przez zawodnika. Mini-wykres pokazuje jak RPE zmieniało się w ostatnich sesjach tego typu.
                </div>
                <div className="grid gap-2 xl:grid-cols-2">
                  {topTypes.map(stat => (
                    <div key={stat.type} className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{stat.label}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sessions} sesji (56 dni)</div>
                        </div>
                        <span className="text-[11px] rounded-full px-2 py-0.5" style={{
                          background: stat.completionRate != null && stat.completionRate >= 80 ? 'rgba(46,204,113,0.12)' : stat.completionRate != null && stat.completionRate >= 60 ? 'rgba(255,92,27,0.12)' : 'rgba(231,76,60,0.12)',
                          color: stat.completionRate != null && stat.completionRate >= 80 ? '#2ECC71' : stat.completionRate != null && stat.completionRate >= 60 ? '#FF5C1B' : '#E74C3C',
                        }}>{stat.completionRate != null ? `${stat.completionRate}%` : '—'}</span>
                      </div>
                      <div className="flex gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span>RPE {stat.avgRpe ?? '—'}</span>
                        <span>Pominięte {stat.skipped}</span>
                        {stat.painCount > 0 && <span style={{ color: '#E74C3C' }}>Ból {stat.painCount}</span>}
                      </div>
                      {/* Mini RPE trend */}
                      {stat.recentRpe.length >= 2 && (
                        <div className="flex items-end gap-0.5 h-5 mt-2">
                          {[...stat.recentRpe].reverse().map((rpe, i) => (
                            <div key={i} className="flex-1 rounded-t" style={{
                              height: `${Math.max((rpe / 10) * 100, 15)}%`,
                              background: rpe >= 7 ? '#FF5C1B' : rpe >= 5 ? '#F1C40F' : '#2ECC71',
                            }} title={`RPE ${rpe}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Stimulus summary */}
            {stimulusSummary.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs px-2" style={{ color: 'var(--text-muted)' }}>
                {stimulusSummary.map(s => <span key={s}>{s}</span>)}
              </div>
            )}

            {/* Unplanned + Flags */}
            {insights.unplannedActivities.length > 0 && (
              <Section title={`Aktywności poza planem (${insights.unplannedActivities.length})`}>
                <div className="space-y-1">
                  {insights.unplannedActivities.slice(0, 5).map(a => (
                    <div key={a.stravaId} className="flex items-center gap-3 text-xs py-1.5 px-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                      <span className="w-14 shrink-0" style={{ color: 'var(--text-muted)' }}>{formatDate(a.startDate, { day: 'numeric', month: 'short' })}</span>
                      <span className="flex-1 truncate">{a.distanceKm != null ? `${a.distanceKm.toFixed(1)} km` : '—'} · {a.movingTime != null ? `${Math.round(a.movingTime / 60)} min` : '—'}</span>
                      {a.averageHeartrate && <span style={{ color: 'var(--text-muted)' }}>{a.averageHeartrate} bpm</span>}
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {insights.flags.length > 0 && (
              <Section title="Sygnały">
                <div className="grid gap-2 md:grid-cols-2">
                  {insights.flags.map(flag => (
                    <div key={`${flag.title}-${flag.detail}`} className="rounded-xl p-3 text-sm" style={{
                      background: flag.tone === 'green' ? 'rgba(46,204,113,0.08)' : flag.tone === 'red' ? 'rgba(231,76,60,0.08)' : flag.tone === 'orange' ? 'rgba(255,92,27,0.08)' : 'rgba(241,196,15,0.08)',
                      border: '1px solid var(--border)',
                    }}>
                      <div className="font-semibold">{flag.title}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{flag.detail}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )
      })()}
    </div>
  )
}
