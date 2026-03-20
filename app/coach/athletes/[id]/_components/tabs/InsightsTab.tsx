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
        {tooltip && <span className="text-[10px] cursor-help" title={tooltip} style={{ color: 'var(--text-muted)' }}>ℹ️</span>}
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

function SessionTypeCard({ label, sessions, completionRate, avgRpe, painCount, skipped }: {
  label: string; sessions: number; completionRate: number | null; avgRpe: number | null; painCount: number; skipped: number
}) {
  const tone = completionRate != null && completionRate >= 80 ? 'green' : completionRate != null && completionRate >= 60 ? 'orange' : 'red'
  const badgeStyles = { green: { bg: 'rgba(46,204,113,0.12)', color: '#2ECC71' }, orange: { bg: 'rgba(255,92,27,0.12)', color: '#FF5C1B' }, red: { bg: 'rgba(231,76,60,0.12)', color: '#E74C3C' } }[tone]
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sessions} sesji (56 dni)</div>
        </div>
        <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: badgeStyles.bg, color: badgeStyles.color }}>
          {completionRate != null ? `${completionRate}%` : '—'}
        </span>
      </div>
      <div className="flex gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <span>RPE {avgRpe ?? '—'}</span>
        <span>Pominięte {skipped}</span>
        {painCount > 0 && <span style={{ color: '#E74C3C' }}>Ból {painCount}</span>}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────

export function InsightsTab({ sessions, feedbacks, stravaActivities, today }: InsightsTabProps) {
  const [view, setView] = useState<InsightView>('decision')
  const insights = buildAthleteInsights({ sessions, feedbacks, stravaActivities, today })

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
        <ViewButton active={view === 'decision'} label="Decyzja" detail="Co robić dalej z planem." onClick={() => setView('decision')} />
        <ViewButton active={view === 'load'} label="Obciążenie" detail="Ile pracy i w jakiej intensywności." onClick={() => setView('load')} />
        <ViewButton active={view === 'response'} label="Reakcja" detail="Jak znosi treningi i co sygnalizuje." onClick={() => setView('response')} />
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
        </div>
      )}

      {/* ── LOAD VIEW ── */}
      {view === 'load' && (
        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <Stat label="Obciążenie" value={insights.load.currentWeekLoad != null ? `${insights.load.currentWeekLoad}` : '—'} detail="Bieżący tydzień" tone="blue" tooltip="Czas (min) × RPE (1-10) ÷ 10" />
            <Stat label="Średnia 4 tyg." value={insights.load.rolling4WeekAverage != null ? `${insights.load.rolling4WeekAverage}` : '—'} detail="Bazowy poziom" />
            <Stat label="Zmiana" value={insights.load.deltaPercent != null ? `${insights.load.deltaPercent > 0 ? '+' : ''}${insights.load.deltaPercent}%` : '—'} detail="vs poprzedni tydzień" tone={loadTone} />
            <Stat label="Trend" value={insights.load.trendLabel} detail="Kierunek zmian" />
          </div>
          <SimpleBarChart items={weeklyLoadItems} />

          <Section title="Strefy tętna">
            <div className="grid gap-2 md:grid-cols-4 mb-3">
              <Stat label="Z1 + Z2 (łatwo)" value={insights.zones.lowShare != null ? `${insights.zones.lowShare}%` : '—'} detail="Cel: ~80%" tone="green" tooltip="Strefa łatwa / aerobowa. Buduje bazę tlenową." />
              <Stat label="Z3 (średnio)" value={insights.zones.moderateShare != null ? `${insights.zones.moderateShare}%` : '—'} detail="Próg tlenowy" tone="orange" />
              <Stat label="Z4 + Z5 (ciężko)" value={insights.zones.highShare != null ? `${insights.zones.highShare}%` : '—'} detail={`Cel: ~20%. ${insights.zones.highShare != null && insights.zones.highShare > 30 ? '⚠️ Wysoki udział!' : ''}`} tone={insights.zones.highShare != null && insights.zones.highShare > 30 ? 'red' : 'default'} tooltip="Strefa progowa i VO2max. >30% = ryzyko przeciążenia." />
              <Stat label="Łączny czas" value={`${insights.zones.totalMinutes} min`} detail={`Z4 ${insights.zones.z4} · Z5 ${insights.zones.z5} min`} tone="blue" />
            </div>
            <WeeklyZonesChart weeks={weeklyZones} />
          </Section>
        </div>
      )}

      {/* ── RESPONSE VIEW ── */}
      {view === 'response' && (
        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <Stat label="Średnie RPE" value={insights.reaction.avgRpe != null ? `${insights.reaction.avgRpe}` : '—'} detail={insights.reaction.rpeDelta != null ? `${insights.reaction.rpeDelta > 0 ? '+' : ''}${insights.reaction.rpeDelta} vs poprzednie 14 dni` : '—'} tone={reactionTone} />
            <Stat label="Zgłoszenia bólu" value={`${insights.reaction.painCount}`} detail="Ostatnie 14 dni" tone={insights.reaction.painCount > 0 ? 'orange' : 'green'} />
            <Stat label="Pokrycie feedbackiem" value={insights.overview.feedbackCoverage != null ? `${insights.overview.feedbackCoverage}%` : '—'} detail={`${insights.reaction.feedbackCount} feedbacków`} />
            <Stat label="Samopoczucie" value={insights.reaction.dominantFeeling ? `${insights.reaction.dominantFeeling} ${FEELING_LABELS[insights.reaction.dominantFeeling] ?? ''}` : '—'} detail={insights.reaction.dominantFeelingLabel ?? 'Brak wzorca'} />
          </div>

          {/* Session types */}
          {topTypes.length > 0 && (
            <Section title="Typy sesji">
              <div className="grid gap-2 xl:grid-cols-2">
                {topTypes.map(stat => (
                  <SessionTypeCard key={stat.type} label={stat.label} sessions={stat.sessions} completionRate={stat.completionRate} avgRpe={stat.avgRpe} painCount={stat.painCount} skipped={stat.skipped} />
                ))}
              </div>
            </Section>
          )}

          {/* Unplanned activities */}
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
        </div>
      )}
    </div>
  )
}
