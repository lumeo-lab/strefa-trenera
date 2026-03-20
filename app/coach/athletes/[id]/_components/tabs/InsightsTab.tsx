'use client'

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

function SectionCard({
  eyebrow,
  title,
  description,
  children,
  tone = 'default',
}: {
  eyebrow?: string
  title: string
  description?: string
  children: React.ReactNode
  tone?: 'default' | 'accent' | 'warning'
}) {
  const tones = {
    default: {
      bg: 'var(--bg-card)',
      border: 'var(--border)',
      eyebrow: 'var(--text-muted)',
    },
    accent: {
      bg: 'linear-gradient(135deg, rgba(255,92,27,0.10), rgba(96,165,250,0.08))',
      border: 'rgba(255,92,27,0.18)',
      eyebrow: '#FF5C1B',
    },
    warning: {
      bg: 'linear-gradient(135deg, rgba(231,76,60,0.08), rgba(255,92,27,0.06))',
      border: 'rgba(231,76,60,0.18)',
      eyebrow: '#E74C3C',
    },
  }[tone]

  return (
    <section className="rounded-3xl p-5 md:p-6" style={{ background: tones.bg, border: `1px solid ${tones.border}` }}>
      {(eyebrow || description) && (
        <div className="mb-5">
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: tones.eyebrow }}>
              {eyebrow}
            </div>
          )}
          <h3 className="text-lg font-semibold mt-2">{title}</h3>
          {description && (
            <p className="text-sm mt-2 max-w-3xl" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
          )}
        </div>
      )}
      {!eyebrow && !description && <h3 className="text-lg font-semibold mb-5">{title}</h3>}
      {children}
    </section>
  )
}

function MetricCard({
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
    default: { color: 'var(--text-primary)', detail: 'var(--text-muted)', bg: 'var(--bg-elevated)' },
    green: { color: '#2ECC71', detail: '#A7F3D0', bg: 'rgba(46,204,113,0.10)' },
    orange: { color: '#FF5C1B', detail: '#FDBA74', bg: 'rgba(255,92,27,0.10)' },
    red: { color: '#E74C3C', detail: '#FCA5A5', bg: 'rgba(231,76,60,0.10)' },
    blue: { color: '#60A5FA', detail: '#BFDBFE', bg: 'rgba(96,165,250,0.10)' },
  }[tone]

  return (
    <div className="rounded-2xl px-4 py-4" style={{ background: styles.bg, border: '1px solid var(--border)' }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="mt-2 text-2xl font-semibold" style={{ color: styles.color }}>{value}</div>
      <div className="text-xs mt-1 leading-5" style={{ color: styles.detail }}>{detail}</div>
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: styles.color }}>Werdykt trenerski</div>
          <h2 className="text-xl md:text-2xl font-semibold mt-2" style={{ color: styles.color }}>{title}</h2>
        </div>
        <div className="text-xs rounded-full px-3 py-1.5" style={{ background: 'rgba(15,23,42,0.22)', color: 'var(--text-muted)' }}>
          Pewność: {confidence === 'high' ? 'wysoka' : confidence === 'medium' ? 'średnia' : 'niska'}
        </div>
      </div>
      <div className="grid gap-3 mt-5 md:grid-cols-2">
        {reasons.map((reason) => (
          <div
            key={reason}
            className="rounded-2xl px-4 py-3 text-sm"
            style={{ background: 'rgba(15,23,42,0.16)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}
          >
            {reason}
          </div>
        ))}
      </div>
    </div>
  )
}

function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'green' | 'orange' | 'red' | 'blue' }) {
  const styles = {
    default: { bg: 'var(--bg-subtle)', color: 'var(--text-muted)' },
    green: { bg: 'rgba(46,204,113,0.12)', color: '#2ECC71' },
    orange: { bg: 'rgba(255,92,27,0.12)', color: '#FF5C1B' },
    red: { bg: 'rgba(231,76,60,0.12)', color: '#E74C3C' },
    blue: { bg: 'rgba(96,165,250,0.12)', color: '#60A5FA' },
  }[tone]

  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: styles.bg, color: styles.color }}>
      {label}
    </span>
  )
}

function clampHeight(percent: number, min = 10) {
  if (percent <= 0) return min
  return Math.max(percent, min)
}

function LoadChart({
  weeks,
}: {
  weeks: Array<{
    start: string
    end: string
    actualLoad: number
    actualDuration: number
    highIntensityMinutes: number
  }>
}) {
  const maxLoad = Math.max(...weeks.map((week) => week.actualLoad), 1)

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold">Trend obciążenia 4 tygodnie</div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Każdy słupek pokazuje faktyczny load tygodnia. Pod spodem widać czas i minuty wysokiej intensywności.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-end gap-3 h-56 md:h-64">
          {weeks.map((week, index) => {
            const height = (week.actualLoad / maxLoad) * 100
            const isLast = index === weeks.length - 1

            return (
              <div key={week.start} className="flex min-w-0 flex-1 flex-col items-center gap-2 h-full">
                <div className="text-[11px] font-semibold" style={{ color: isLast ? '#FF5C1B' : 'var(--text-muted)' }}>
                  {week.actualLoad}
                </div>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-2xl transition-all"
                    style={{
                      height: `${clampHeight(height, 12)}%`,
                      background: isLast
                        ? 'linear-gradient(180deg, #FF5C1B, #FF7A42)'
                        : 'linear-gradient(180deg, rgba(96,165,250,0.95), rgba(96,165,250,0.45))',
                      minHeight: '12px',
                    }}
                  />
                </div>
                <div className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(week.start, { day: 'numeric', month: 'short' })}
                </div>
                <div className="text-[11px] text-center leading-4" style={{ color: 'var(--text-muted)' }}>
                  {week.actualDuration} min
                  <br />
                  Z4-Z5: {week.highIntensityMinutes}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ZonesChart({
  weeks,
}: {
  weeks: Array<{
    start: string
    end: string
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold">Rozkład intensywności tydzień po tygodniu</div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            To jest najkrótsza odpowiedź na pytanie, czy zawodnik trzyma właściwy balans Z1-Z5.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tones.map((tone) => (
            <span key={tone.label} className="inline-flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone.color }} />
              {tone.label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 mt-5">
        {weeks.map((week) => {
          const total = week.z1 + week.z2 + week.z3 + week.z4 + week.z5
          return (
            <div key={week.start}>
              <div className="flex items-center justify-between gap-3 mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{formatDate(week.start, { day: 'numeric', month: 'short' })} - {formatDate(week.end, { day: 'numeric', month: 'short' })}</span>
                <span>{total} min</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full" style={{ background: 'var(--bg-subtle)' }}>
                {total > 0 ? (
                  <div className="flex h-full w-full">
                    {tones.map((tone) => {
                      const value = week[tone.key]
                      const width = (value / total) * 100
                      return <div key={tone.label} style={{ width: `${width}%`, background: tone.color }} />
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
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
  unresolved,
}: {
  label: string
  sessions: number
  completionRate: number | null
  avgRpe: number | null
  painCount: number
  skipped: number
  unresolved: number
}) {
  const tone = completionRate != null && completionRate >= 80
    ? 'green'
    : completionRate != null && completionRate >= 60
      ? 'orange'
      : 'red'

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sessions} sesji w oknie 56 dni</div>
        </div>
        <Badge
          label={completionRate != null ? `${completionRate}% realizacji` : 'Brak realizacji'}
          tone={tone}
        />
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
          <div style={{ color: 'var(--text-muted)' }}>Pain / bez potw.</div>
          <div className="font-semibold mt-1">{painCount} / {unresolved}</div>
        </div>
      </div>
    </div>
  )
}

export function InsightsTab({ sessions, feedbacks, stravaActivities, today }: InsightsTabProps) {
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
  const actualTone = insights.actualSources.some((source) => source.source === 'strava')
    ? 'blue'
    : insights.overview.actualCoverage && insights.overview.actualCoverage >= 60
      ? 'green'
      : 'default'
  const loadTone = insights.load.deltaPercent != null && insights.load.deltaPercent >= 15
    ? 'orange'
    : insights.load.deltaPercent != null && insights.load.deltaPercent <= -15
      ? 'red'
      : 'blue'

  const topTypes = insights.typeStats.slice(0, 4)

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Analiza planistyczna"
        title="Tu trener ma dostać decyzję, a nie tylko raport z wykonania."
        description="Ta zakładka zbiera trend obciążenia, rozkład intensywności, reakcję zawodnika i jakość bodźców. Operacyjny log sesji, aktywności poza planem i szczegóły potwierdzeń są w `Historii`."
        tone="accent"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            <Badge label={`Okno 28 dni: ${formatDate(insights.window.last28Start, { day: 'numeric', month: 'short' })} - ${formatDate(today, { day: 'numeric', month: 'short' })}`} tone="blue" />
            <Badge label={`56 dni bodźców: od ${formatDate(insights.window.last56Start, { day: 'numeric', month: 'short' })}`} />
          </div>
          <div className="text-xs max-w-xl" style={{ color: 'var(--text-muted)' }}>
            Jeśli trener ma wejść tu na 20 sekund i wiedzieć co zrobić z kolejnym tygodniem, to ten ekran ma dostarczyć właśnie to.
          </div>
        </div>
      </SectionCard>

      <RecommendationCard
        tone={insights.recommendation.tone}
        title={insights.recommendation.title}
        confidence={insights.recommendation.confidence}
        reasons={insights.recommendation.reasons}
      />

      <SectionCard
        eyebrow="1. Sygnał główny"
        title="Czy zawodnik dowozi plan i czy obecny kierunek nadal się broni?"
        description="To jest warstwa szybkiej orientacji. Ma powiedzieć, czy trener widzi stabilny progres, rosnące tarcie czy brak danych do mocnej decyzji."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Realizacja planu"
            value={insights.overview.completionRate != null ? `${insights.overview.completionRate}%` : '—'}
            detail={`${insights.overview.completedSessions} z ${insights.overview.dueSessions} sesji wykonanych w 28 dni`}
            tone={completionTone}
          />
          <MetricCard
            label="Obciążenie"
            value={insights.load.currentWeekLoad != null ? `${insights.load.currentWeekLoad}` : '—'}
            detail={insights.load.deltaPercent != null ? `${insights.load.deltaPercent > 0 ? '+' : ''}${insights.load.deltaPercent}% vs poprzedni tydzień` : 'Za mało danych load'}
            tone={loadTone}
          />
          <MetricCard
            label="Reakcja"
            value={insights.reaction.avgRpe != null ? `RPE ${insights.reaction.avgRpe}` : 'Brak RPE'}
            detail={insights.reaction.dominantFeeling ? `${insights.reaction.dominantFeeling} ${FEELING_LABELS[insights.reaction.dominantFeeling] ?? insights.reaction.dominantFeeling}` : 'Brak dominującego samopoczucia'}
            tone={reactionTone}
          />
          <MetricCard
            label="Dane wykonania"
            value={insights.overview.actualCoverage != null ? `${insights.overview.actualCoverage}%` : '—'}
            detail={insights.actualSources.length > 0 ? insights.actualSources.map((source) => `${source.label}: ${source.count}`).join(' · ') : 'Brak actual danych'}
            tone={actualTone}
          />
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="2. Obciążenie"
        title="Czy zawodnik buduje obciążenie sensownie, czy wchodzi w zbyt agresywny skok?"
        description="Ten blok ma pomóc ocenić kierunek mikrocyklu. Widzisz load, czas, wysoką intensywność i tygodniowy trend bez przekopywania się przez log sesji."
      >
        <div className="grid gap-3 md:grid-cols-4 mb-5">
          <MetricCard
            label="Aktualny load"
            value={insights.load.currentWeekLoad != null ? `${insights.load.currentWeekLoad}` : '—'}
            detail="Bieżący tydzień"
            tone="blue"
          />
          <MetricCard
            label="Średnia 4 tyg."
            value={insights.load.rolling4WeekAverage != null ? `${insights.load.rolling4WeekAverage}` : '—'}
            detail="Rolling baseline"
          />
          <MetricCard
            label="Zmiana load"
            value={insights.load.deltaPercent != null ? `${insights.load.deltaPercent > 0 ? '+' : ''}${insights.load.deltaPercent}%` : '—'}
            detail="vs poprzedni tydzień"
            tone={loadTone}
          />
          <MetricCard
            label="Trend"
            value={insights.load.trendLabel}
            detail={`${insights.advanced.weeklyDistanceDelta != null ? `Dystans ${insights.advanced.weeklyDistanceDelta > 0 ? '+' : ''}${insights.advanced.weeklyDistanceDelta}%` : 'Dystans —'} · ${insights.advanced.weeklyDurationDelta != null ? `czas ${insights.advanced.weeklyDurationDelta > 0 ? '+' : ''}${insights.advanced.weeklyDurationDelta}%` : 'czas —'}`}
          />
        </div>
        <LoadChart weeks={insights.weeklyLoad} />
      </SectionCard>

      <SectionCard
        eyebrow="3. Intensywność"
        title="Jak naprawdę rozkłada się praca w strefach i czy bodziec nie uciekł za wysoko?"
        description="To jest dokładnie ten blok, który pomaga pilnować równowagi między objętością tlenową a jakością. Jeśli strefy są dobrze zasilone, trener widzi to od razu."
      >
        <div className="grid gap-3 md:grid-cols-4 mb-5">
          <MetricCard
            label="Low intensity"
            value={insights.zones.lowShare != null ? `${insights.zones.lowShare}%` : '—'}
            detail="Z1 + Z2"
            tone="green"
          />
          <MetricCard
            label="Moderate"
            value={insights.zones.moderateShare != null ? `${insights.zones.moderateShare}%` : '—'}
            detail="Z3"
            tone="orange"
          />
          <MetricCard
            label="High intensity"
            value={insights.zones.highShare != null ? `${insights.zones.highShare}%` : '—'}
            detail="Z4 + Z5"
            tone={insights.zones.highShare != null && insights.zones.highShare > 30 ? 'red' : 'default'}
          />
          <MetricCard
            label="Czas w strefach"
            value={`${insights.zones.totalMinutes} min`}
            detail={`Z4 ${insights.zones.z4} min · Z5 ${insights.zones.z5} min`}
            tone="blue"
          />
        </div>
        <ZonesChart weeks={insights.zones.weekly} />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard
          eyebrow="4. Reakcja zawodnika"
          title="Czy organizm i odczucie idą za obciążeniem?"
          description="Tu widać, czy rosnące obciążenie jest tolerowane, czy zaczynają pojawiać się czerwone flagi w feedbacku."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <MetricCard
              label="Średnie RPE"
              value={insights.reaction.avgRpe != null ? `${insights.reaction.avgRpe}` : '—'}
              detail={insights.reaction.rpeDelta != null ? `${insights.reaction.rpeDelta > 0 ? '+' : ''}${insights.reaction.rpeDelta} vs poprzednie 14 dni` : 'Za mało danych do porównania'}
              tone={reactionTone}
            />
            <MetricCard
              label="Pain flags"
              value={`${insights.reaction.painCount}`}
              detail="Liczba sygnałów bólu / problemu w 28 dni"
              tone={insights.reaction.painCount > 0 ? 'orange' : 'green'}
            />
            <MetricCard
              label="Feedback coverage"
              value={insights.overview.feedbackCoverage != null ? `${insights.overview.feedbackCoverage}%` : '—'}
              detail={`${insights.reaction.feedbackCount} feedbacków w oknie analizy`}
              tone={insights.overview.feedbackCoverage != null && insights.overview.feedbackCoverage >= 60 ? 'green' : 'default'}
            />
            <MetricCard
              label="Dominujące samopoczucie"
              value={insights.reaction.dominantFeeling ?? '—'}
              detail={insights.reaction.dominantFeelingLabel ?? 'Brak wyraźnego wzorca w feeling'}
            />
          </div>
          <div className="grid gap-3 mt-5">
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
                <div className="text-xs mt-1 leading-5" style={{ color: 'var(--text-muted)' }}>{flag.detail}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="5. Bodźce"
          title="Które typy sesji zawodnik absorbuje dobrze, a które zaczynają się sypać?"
          description="To nie jest ogólna statystyka. To odpowiedź na pytanie, które bodźce można zostawić, a które trzeba uprościć albo przeformułować."
        >
          {topTypes.length === 0 ? (
            <ProfileEmptyState
              icon="🏃"
              title="Brak danych typów sesji"
              description="Typy sesji pojawią się tutaj po kilku wykonanych albo pominiętych jednostkach."
            />
          ) : (
            <div className="grid gap-3">
              {topTypes.map((stat) => (
                <SessionTypeCard
                  key={stat.type}
                  label={stat.label}
                  sessions={stat.sessions}
                  completionRate={stat.completionRate}
                  avgRpe={stat.avgRpe}
                  painCount={stat.painCount}
                  skipped={stat.skipped}
                  unresolved={stat.unresolved}
                />
              ))}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2 mt-5">
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Kluczowe sesje</div>
              <div className="mt-2 text-lg font-semibold">
                {insights.keySessions.due > 0 ? `${insights.keySessions.completionRate ?? '—'}% realizacji` : 'Brak kluczowych sesji'}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {insights.keySessions.completed} wykonane · {insights.keySessions.skipped} pominięte · {insights.keySessions.unresolved} bez potwierdzenia
              </div>
              <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Śr. RPE: {insights.keySessions.avgRpe ?? '—'} · Pain flags: {insights.keySessions.painCount}
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Szybki wniosek</div>
              <div className="space-y-2 mt-3 text-sm">
                <div>Najtrudniejszy bodziec: <span className="font-semibold">{insights.advanced.highestRpeType ?? 'Za mało danych'}</span></div>
                <div>Najczęściej pomijany typ: <span className="font-semibold">{insights.advanced.mostSkippedType ?? 'Brak wyraźnego wzorca'}</span></div>
                <div>Plan vs dystans: <span className="font-semibold">{insights.planVsActual.distance ? `${insights.planVsActual.distance.deltaPercent ?? 0}% vs plan` : 'Brak danych'}</span></div>
                <div>Plan vs czas: <span className="font-semibold">{insights.planVsActual.duration ? `${insights.planVsActual.duration.deltaPercent ?? 0}% vs plan` : 'Brak danych'}</span></div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="6. Rekomendacja planistyczna"
        title="Co trener powinien zrobić z kolejnym tygodniem?"
        description="Ta sekcja ma zamknąć analizę konkretem. Nie zastępuje decyzji coacha, ale ma uporządkować sygnały i skrócić czas dojścia do decyzji."
        tone={insights.recommendation.tone === 'red' ? 'warning' : 'default'}
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Co mówi system</div>
            <div className="text-xl font-semibold mt-2">{insights.recommendation.title}</div>
            <div className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Poziom pewności: {insights.recommendation.confidence === 'high' ? 'wysoki' : insights.recommendation.confidence === 'medium' ? 'średni' : 'niski'}.
            </div>
            <div className="space-y-2 mt-4">
              {insights.recommendation.reasons.map((reason) => (
                <div key={reason} className="rounded-xl px-3 py-3 text-sm" style={{ background: 'var(--bg-subtle)' }}>
                  {reason}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Jak to czytać</div>
            <div className="space-y-3 mt-3 text-sm">
              <div>
                <div className="font-semibold">Progresuj</div>
                <div style={{ color: 'var(--text-muted)' }}>Load rośnie pod kontrolą, realizacja jest dobra, a reakcja zawodnika nie pokazuje wyraźnego tarcia.</div>
              </div>
              <div>
                <div className="font-semibold">Utrzymaj / monitoruj</div>
                <div style={{ color: 'var(--text-muted)' }}>Pojawiają się pierwsze ostrzeżenia: wzrost intensywności, słabsze key sessions albo rosnące RPE.</div>
              </div>
              <div>
                <div className="font-semibold">Lżejszy tydzień</div>
                <div style={{ color: 'var(--text-muted)' }}>Ból, wysoka trudność i skok obciążenia zaczynają układać się w spójny wzorzec przeciążenia.</div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
