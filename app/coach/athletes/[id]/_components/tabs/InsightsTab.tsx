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

function ViewButton({
  active,
  label,
  detail,
  onClick,
}: {
  active: boolean
  label: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl px-4 py-3 text-left transition-colors cursor-pointer"
      style={{
        background: active ? 'rgba(255,92,27,0.12)' : 'var(--bg-card)',
        border: `1px solid ${active ? 'rgba(255,92,27,0.22)' : 'var(--border)'}`,
      }}
    >
      <div className="text-sm font-semibold" style={{ color: active ? '#FF5C1B' : 'var(--text-primary)' }}>
        {label}
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        {detail}
      </div>
    </button>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl p-5 md:p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="mb-5">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm mt-2 max-w-3xl" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function SmallStat({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'green' | 'orange' | 'red' | 'blue'
}) {
  const styles = {
    default: { bg: 'var(--bg-elevated)', color: 'var(--text-primary)' },
    green: { bg: 'rgba(46,204,113,0.10)', color: '#2ECC71' },
    orange: { bg: 'rgba(255,92,27,0.10)', color: '#FF5C1B' },
    red: { bg: 'rgba(231,76,60,0.10)', color: '#E74C3C' },
    blue: { bg: 'rgba(96,165,250,0.10)', color: '#60A5FA' },
  }[tone]

  return (
    <div className="rounded-2xl p-4" style={{ background: styles.bg, border: '1px solid var(--border)' }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-2xl font-semibold mt-2" style={{ color: styles.color }}>{value}</div>
      <div className="text-xs mt-1 leading-5" style={{ color: 'var(--text-muted)' }}>{detail}</div>
    </div>
  )
}

function InfoCallout({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs mt-2 leading-6" style={{ color: 'var(--text-muted)' }}>
        {description}
      </div>
    </div>
  )
}

function RecommendationCard({
  tone,
  title,
  confidence,
  reasons,
}: {
  tone: 'green' | 'orange' | 'red' | 'blue'
  title: string
  confidence: 'high' | 'medium' | 'low'
  reasons: string[]
}) {
  const styles = {
    green: { bg: 'rgba(46,204,113,0.10)', border: 'rgba(46,204,113,0.24)', color: '#2ECC71' },
    orange: { bg: 'rgba(255,92,27,0.10)', border: 'rgba(255,92,27,0.24)', color: '#FF5C1B' },
    red: { bg: 'rgba(231,76,60,0.10)', border: 'rgba(231,76,60,0.24)', color: '#E74C3C' },
    blue: { bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.24)', color: '#60A5FA' },
  }[tone]

  return (
    <div className="rounded-3xl p-5 md:p-6" style={{ background: styles.bg, border: `1px solid ${styles.border}` }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: styles.color }}>Werdykt trenerski</div>
          <h2 className="text-lg md:text-xl font-semibold mt-2" style={{ color: styles.color }}>{title}</h2>
          <p className="text-xs mt-2 leading-5" style={{ color: 'var(--text-muted)' }}>
            To jest syntetyczna rekomendacja na podstawie realizacji planu, obciążenia, stref tętna i reakcji zawodnika.
          </p>
        </div>
        <div className="text-xs rounded-full px-3 py-1.5 shrink-0" style={{ background: 'rgba(15,23,42,0.22)', color: 'var(--text-muted)' }}>
          Pewność: {confidence === 'high' ? 'wysoka' : confidence === 'medium' ? 'średnia' : 'niska'}
        </div>
      </div>
      <div className="grid gap-2 mt-5">
        {reasons.map((reason) => (
          <div
            key={reason}
            className="rounded-2xl px-4 py-3 text-sm flex items-start gap-3"
            style={{ background: 'rgba(15,23,42,0.16)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}
          >
            <span style={{ color: styles.color }}>•</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SimpleBarChart({
  items,
  color = 'linear-gradient(180deg, #FF5C1B, #FF7A42)',
}: {
  items: Array<{ label: string; value: number; detail?: string }>
  color?: string
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="flex items-end gap-3 h-56 md:h-64">
        {items.map((item) => {
          const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2 h-full">
              <div className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                {item.value}
              </div>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-2xl"
                  style={{
                    height: `${Math.max(height, 10)}%`,
                    minHeight: '10px',
                    background: color,
                  }}
                />
              </div>
              <div className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                {item.label}
              </div>
              {item.detail ? (
                <div className="text-[10px] text-center leading-4" style={{ color: 'var(--text-muted)' }}>
                  {item.detail}
                </div>
              ) : <span className="h-8" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeeklyZonesChart({
  weeks,
}: {
  weeks: Array<{
    label: string
    total: number
    z1: number
    z2: number
    z3: number
    z4: number
    z5: number
  }>
}) {
  const tones = [
    { label: 'Z1', key: 'z1' as const, color: '#7DD3FC' },
    { label: 'Z2', key: 'z2' as const, color: '#34D399' },
    { label: 'Z3', key: 'z3' as const, color: '#FBBF24' },
    { label: 'Z4', key: 'z4' as const, color: '#FB923C' },
    { label: 'Z5', key: 'z5' as const, color: '#F87171' },
  ]

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        {tones.map((tone) => (
          <span key={tone.label} className="inline-flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone.color }} />
            {tone.label}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {weeks.map((week) => (
          <div key={week.label}>
            <div className="flex items-center justify-between gap-3 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              <span>{week.label}</span>
              <span>{week.total} min</span>
            </div>
            <div className="h-5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              {week.total > 0 ? (
                <div className="flex h-full">
                  {tones.map((tone) => {
                    const width = (week[tone.key] / week.total) * 100
                    return <div key={tone.label} style={{ width: `${width}%`, background: tone.color }} />
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReactionTrend({
  items,
}: {
  items: Array<{ label: string; rpe: number | null; pain: number; feeling: string | null }>
}) {
  const maxRpe = Math.max(...items.map((item) => item.rpe ?? 0), 1)

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              <span>{item.label}</span>
              <span>
                RPE {item.rpe ?? '—'} · pain {item.pain}
                {item.feeling ? ` · ${item.feeling} ${FEELING_LABELS[item.feeling] ?? item.feeling}` : ''}
              </span>
            </div>
            <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              {item.rpe != null ? (
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max((item.rpe / maxRpe) * 100, 8)}%`,
                    background: item.rpe >= 7 ? 'linear-gradient(90deg, #FF5C1B, #FF7A42)' : 'linear-gradient(90deg, #60A5FA, #93C5FD)',
                  }}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionTypeCard({
  label,
  sessions,
  completionRate,
  avgRpe,
  painCount,
  skipped,
}: {
  label: string
  sessions: number
  completionRate: number | null
  avgRpe: number | null
  painCount: number
  skipped: number
}) {
  const tone = completionRate != null && completionRate >= 80
    ? 'green'
    : completionRate != null && completionRate >= 60
      ? 'orange'
      : 'red'

  const badgeStyles = {
    green: { bg: 'rgba(46,204,113,0.12)', color: '#2ECC71' },
    orange: { bg: 'rgba(255,92,27,0.12)', color: '#FF5C1B' },
    red: { bg: 'rgba(231,76,60,0.12)', color: '#E74C3C' },
  }[tone]

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sessions} sesji w oknie 56 dni</div>
        </div>
        <span className="text-[11px] rounded-full px-2.5 py-1" style={{ background: badgeStyles.bg, color: badgeStyles.color }}>
          {completionRate != null ? `${completionRate}% realizacji` : 'Brak realizacji'}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 mt-4 text-xs">
        <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-subtle)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Śr. RPE</div>
          <div className="font-semibold mt-1">{avgRpe ?? '—'}</div>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-subtle)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Pominięte</div>
          <div className="font-semibold mt-1">{skipped}</div>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-subtle)' }}>
          <div style={{ color: 'var(--text-muted)' }}>Pain flags</div>
          <div className="font-semibold mt-1">{painCount}</div>
        </div>
      </div>
    </div>
  )
}

export function InsightsTab({ sessions, feedbacks, stravaActivities, today }: InsightsTabProps) {
  const [view, setView] = useState<InsightView>('load')
  const insights = buildAthleteInsights({ sessions, feedbacks, stravaActivities, today })

  if (insights.overview.dueSessions === 0 && feedbacks.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <ProfileEmptyState
          icon="📈"
          title="Za mało danych do analizy"
          description="Insighty pojawią się, gdy zawodnik zacznie wykonywać treningi i zostawiać pierwsze potwierdzenia lub feedback."
        />
      </div>
    )
  }

  const completionTone = insights.overview.completionRate != null && insights.overview.completionRate >= 75
    ? 'green'
    : insights.overview.completionRate != null && insights.overview.completionRate >= 50
      ? 'orange'
      : 'red'
  const reactionTone = insights.reaction.avgRpe != null && insights.reaction.avgRpe >= 7
    ? 'orange'
    : insights.reaction.painCount > 0
      ? 'orange'
      : 'green'
  const loadTone = insights.load.deltaPercent != null && insights.load.deltaPercent >= 15
    ? 'orange'
    : insights.load.deltaPercent != null && insights.load.deltaPercent <= -15
      ? 'red'
      : 'blue'

  const weeklyLoadItems = insights.weeklyLoad.map((week) => ({
    label: formatDate(week.start, { day: 'numeric', month: 'short' }),
    value: week.actualLoad,
    detail: `${week.actualDuration} min · Z4-Z5 ${week.highIntensityMinutes}`,
  }))

  const weeklyZones = insights.zones.weekly.map((week) => ({
    label: `${formatDate(week.start, { day: 'numeric', month: 'short' })} - ${formatDate(week.end, { day: 'numeric', month: 'short' })}`,
    total: week.z1 + week.z2 + week.z3 + week.z4 + week.z5,
    z1: week.z1,
    z2: week.z2,
    z3: week.z3,
    z4: week.z4,
    z5: week.z5,
  }))

  const reactionItems = [
    {
      label: 'Ostatnie 14 dni',
      rpe: insights.reaction.avgRpe,
      pain: insights.reaction.painCount,
      feeling: insights.reaction.dominantFeeling,
    },
    {
      label: 'Poprzednie 14 dni',
      rpe: insights.reaction.previousAvgRpe,
      pain: 0,
      feeling: null,
    },
  ]

  const topTypes = insights.typeStats.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl px-4 py-3 md:px-5 md:py-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#FF5C1B' }}>Analiza trenerska</div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Widok jest podzielony na trzy części: decyzja, obciążenie i reakcja. Każda odpowiada na inne pytanie planistyczne.
            </p>
          </div>
          <div className="text-xs rounded-xl px-3 py-2 shrink-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Okno analizy: {formatDate(insights.window.last28Start, { day: 'numeric', month: 'short' })} - {formatDate(today, { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ViewButton
          active={view === 'load'}
          label="Obciążenie i strefy"
          detail="Ile pracy zawodnik zrobił i w jakiej intensywności."
          onClick={() => setView('load')}
        />
        <ViewButton
          active={view === 'response'}
          label="Reakcja i bodźce"
          detail="Jak organizm reaguje i które typy sesji działają."
          onClick={() => setView('response')}
        />
        <ViewButton
          active={view === 'decision'}
          label="Decyzja"
          detail="Czy progresować, utrzymać czy odpuścić."
          onClick={() => setView('decision')}
        />
      </div>

      {view === 'decision' && (
        <div className="space-y-6">
          <RecommendationCard
            tone={insights.recommendation.tone}
            title={insights.recommendation.title}
            confidence={insights.recommendation.confidence}
            reasons={insights.recommendation.reasons}
          />

          <Section
            title="Najważniejsze wskaźniki"
            description="To jest skrót decyzji. Tu mają zostać tylko wskaźniki, które naprawdę pomagają ocenić kolejny tydzień."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SmallStat
                label="Realizacja planu"
                value={insights.overview.completionRate != null ? `${insights.overview.completionRate}%` : '—'}
                detail={`${insights.overview.completedSessions} z ${insights.overview.dueSessions} sesji wykonanych`}
                tone={completionTone}
              />
              <SmallStat
                label="Aktualny load"
                value={insights.load.currentWeekLoad != null ? `${insights.load.currentWeekLoad}` : '—'}
                detail={insights.load.deltaPercent != null ? `${insights.load.deltaPercent > 0 ? '+' : ''}${insights.load.deltaPercent}% vs poprzedni tydzień` : 'Za mało danych'}
                tone={loadTone}
              />
              <SmallStat
                label="Średnie RPE"
                value={insights.reaction.avgRpe != null ? `${insights.reaction.avgRpe}` : '—'}
                detail={insights.reaction.rpeDelta != null ? `${insights.reaction.rpeDelta > 0 ? '+' : ''}${insights.reaction.rpeDelta} vs poprzednie 14 dni` : 'Brak porównania'}
                tone={reactionTone}
              />
              <SmallStat
                label="Kluczowe sesje"
                value={insights.keySessions.completionRate != null ? `${insights.keySessions.completionRate}%` : '—'}
                detail={`${insights.keySessions.completed} wykonane · ${insights.keySessions.skipped} pominięte`}
                tone={insights.keySessions.completionRate != null && insights.keySessions.completionRate >= 75 ? 'green' : 'orange'}
              />
            </div>
          </Section>

          <Section
            title="Jak czytać tę decyzję"
            description="Te pojęcia pojawiają się w analizie często, więc tu są wyjaśnione w prosty sposób."
          >
            <div className="grid gap-3 xl:grid-cols-3">
              <InfoCallout
                title="Obciążenie treningowe"
                description="To uproszczony wskaźnik, który łączy czas i trudność sesji. Pomaga ocenić, czy tydzień był wyraźnie cięższy lub lżejszy niż zwykle."
              />
              <InfoCallout
                title="Kluczowe sesje"
                description="To jednostki oznaczone przez trenera jako najważniejsze dla mikrocyklu. Ich realizacja mówi więcej niż ogólny procent wykonania."
              />
              <InfoCallout
                title="Pewność rekomendacji"
                description="Jeśli danych jest mało albo są niepełne, system obniża pewność i traktuje rekomendację bardziej jako sygnał niż twardą decyzję."
              />
            </div>
          </Section>
        </div>
      )}

      {view === 'load' && (
        <div className="space-y-6">
          <Section
            title="Obciążenie tygodniowe"
            description="Najważniejszy wykres do oceny progresji. Pokazuje, czy zawodnik dokłada pracy stabilnie, za szybko albo zbyt skokowo."
          >
            <div className="grid gap-3 md:grid-cols-4 mb-5">
              <SmallStat
                label="Aktualny load"
                value={insights.load.currentWeekLoad != null ? `${insights.load.currentWeekLoad}` : '—'}
                detail="Bieżący tydzień"
                tone="blue"
              />
              <SmallStat
                label="Średnia 4 tyg."
                value={insights.load.rolling4WeekAverage != null ? `${insights.load.rolling4WeekAverage}` : '—'}
                detail="Rolling baseline"
              />
              <SmallStat
                label="Zmiana load"
                value={insights.load.deltaPercent != null ? `${insights.load.deltaPercent > 0 ? '+' : ''}${insights.load.deltaPercent}%` : '—'}
                detail="vs poprzedni tydzień"
                tone={loadTone}
              />
              <SmallStat
                label="Trend"
                value={insights.load.trendLabel}
                detail="Szybka interpretacja tygodnia"
              />
            </div>
            <SimpleBarChart items={weeklyLoadItems} />
          </Section>

          <Section
            title="Czas w strefach tętna"
            description="To tygodniowy rozkład czasu w Z1-Z5. Jeśli trener pilnuje proporcji intensywności, ten wykres mówi najwięcej o charakterze tygodnia."
          >
            <div className="grid gap-3 md:grid-cols-4 mb-5">
              <SmallStat label="Z1 + Z2" value={insights.zones.lowShare != null ? `${insights.zones.lowShare}%` : '—'} detail="Niska intensywność" tone="green" />
              <SmallStat label="Z3" value={insights.zones.moderateShare != null ? `${insights.zones.moderateShare}%` : '—'} detail="Środkowa intensywność" tone="orange" />
              <SmallStat label="Z4 + Z5" value={insights.zones.highShare != null ? `${insights.zones.highShare}%` : '—'} detail="Wysoka intensywność" tone={insights.zones.highShare != null && insights.zones.highShare > 30 ? 'red' : 'default'} />
              <SmallStat label="Łączny czas" value={`${insights.zones.totalMinutes} min`} detail={`Z4 ${insights.zones.z4} min · Z5 ${insights.zones.z5} min`} tone="blue" />
            </div>
            <WeeklyZonesChart weeks={weeklyZones} />
          </Section>

          <Section
            title="Co to znaczy"
            description="Ta część wyjaśnia, po co w ogóle patrzeć na load i strefy."
          >
            <div className="grid gap-3 xl:grid-cols-2">
              <InfoCallout
                title="Dlaczego load jest ważny"
                description="Sam dystans lub sam czas nie wystarczy. Dwa tygodnie mogą mieć podobny czas, ale zupełnie inne obciążenie, jeśli zawodnik zrobił więcej mocnych sesji."
              />
              <InfoCallout
                title="Dlaczego strefy są ważne"
                description="Rozkład Z1-Z5 pokazuje, czy zawodnik naprawdę trzyma założoną strukturę intensywności. To pomaga zdecydować, czy dokładać jakości, czy wrócić do większej kontroli."
              />
            </div>
          </Section>
        </div>
      )}

      {view === 'response' && (
        <div className="space-y-6">
          <Section
            title="Reakcja zawodnika"
            description="Ta sekcja odpowiada na pytanie, jak zawodnik znosi aktualny plan: czy robi swoje bez problemu, czy pojawiają się sygnały przeciążenia."
          >
            <div className="grid gap-3 md:grid-cols-4 mb-5">
              <SmallStat
                label="Średnie RPE"
                value={insights.reaction.avgRpe != null ? `${insights.reaction.avgRpe}` : '—'}
                detail={insights.reaction.rpeDelta != null ? `${insights.reaction.rpeDelta > 0 ? '+' : ''}${insights.reaction.rpeDelta} vs poprzednie 14 dni` : 'Za mało danych'}
                tone={reactionTone}
              />
              <SmallStat
                label="Pain flags"
                value={`${insights.reaction.painCount}`}
                detail="Liczba zgłoszonych problemów"
                tone={insights.reaction.painCount > 0 ? 'orange' : 'green'}
              />
              <SmallStat
                label="Feedback coverage"
                value={insights.overview.feedbackCoverage != null ? `${insights.overview.feedbackCoverage}%` : '—'}
                detail={`${insights.reaction.feedbackCount} feedbacków w 28 dni`}
              />
              <SmallStat
                label="Dominujący feeling"
                value={insights.reaction.dominantFeeling ?? '—'}
                detail={insights.reaction.dominantFeelingLabel ?? 'Brak dominującego wzorca'}
              />
            </div>
            <ReactionTrend items={reactionItems} />
          </Section>

          <Section
            title="Typy sesji i bodźce"
            description="Tu widać, które bodźce wchodzą dobrze, a które są regularnie pomijane albo kończą się wysokim RPE i problemami."
          >
            {topTypes.length === 0 ? (
              <ProfileEmptyState
                icon="🏃"
                title="Brak danych typów sesji"
                description="Typy sesji pojawią się tutaj po kilku wykonanych albo pominiętych jednostkach."
              />
            ) : (
              <div className="grid gap-3 xl:grid-cols-2">
                {topTypes.map((stat) => (
                  <SessionTypeCard
                    key={stat.type}
                    label={stat.label}
                    sessions={stat.sessions}
                    completionRate={stat.completionRate}
                    avgRpe={stat.avgRpe}
                    painCount={stat.painCount}
                    skipped={stat.skipped}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Najważniejsze sygnały"
            description="To są najważniejsze ostrzeżenia i obserwacje do kolejnego mikrocyklu. Ma być krótko, konkretnie i bez szumu."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {insights.flags.map((flag) => (
                <div
                  key={`${flag.title}-${flag.detail}`}
                  className="rounded-2xl p-4"
                  style={{
                    background:
                      flag.tone === 'green'
                        ? 'rgba(46,204,113,0.10)'
                        : flag.tone === 'red'
                          ? 'rgba(231,76,60,0.10)'
                          : flag.tone === 'orange'
                            ? 'rgba(255,92,27,0.10)'
                            : 'rgba(241,196,15,0.10)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="text-sm font-semibold">{flag.title}</div>
                  <div className="text-xs mt-2 leading-6" style={{ color: 'var(--text-muted)' }}>
                    {flag.detail}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}
