'use client'

import { ProfileEmptyState } from '../ProfileStates'
import { FEELING_LABELS } from '@/lib/constants'
import { buildAthleteInsights } from '@/lib/athlete-insights'
import { formatDate, sessionTypeLabel } from '@/lib/utils'
import { getSessionCompletionSourceLabel, getSessionExecutionLabel } from '@/lib/session-status'
import type { CoachFeedbackRow, CoachTrainingSessionRow } from '../types'

interface InsightsTabProps {
  sessions: CoachTrainingSessionRow[]
  feedbacks: CoachFeedbackRow[]
  today: string
}

function StatCard({
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
    default: { color: 'var(--text-primary)', detail: 'var(--text-muted)' },
    green: { color: '#2ECC71', detail: '#A7F3D0' },
    orange: { color: '#FF5C1B', detail: '#FDBA74' },
    red: { color: '#E74C3C', detail: '#FCA5A5' },
    blue: { color: '#60A5FA', detail: '#BFDBFE' },
  }[tone]

  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="mt-2 text-2xl font-semibold" style={{ color: styles.color }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: styles.detail }}>{detail}</div>
    </div>
  )
}

function FlagCard({
  tone,
  title,
  detail,
}: {
  tone: 'red' | 'orange' | 'yellow' | 'green'
  title: string
  detail: string
}) {
  const toneStyles = {
    red: { bg: 'rgba(231,76,60,0.10)', border: 'rgba(231,76,60,0.2)', color: '#E74C3C' },
    orange: { bg: 'rgba(255,92,27,0.10)', border: 'rgba(255,92,27,0.2)', color: '#FF5C1B' },
    yellow: { bg: 'rgba(241,196,15,0.10)', border: 'rgba(241,196,15,0.2)', color: '#F1C40F' },
    green: { bg: 'rgba(46,204,113,0.10)', border: 'rgba(46,204,113,0.2)', color: '#2ECC71' },
  }[tone]

  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: toneStyles.bg, border: `1px solid ${toneStyles.border}` }}>
      <div className="text-sm font-semibold" style={{ color: toneStyles.color }}>{title}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{detail}</div>
    </div>
  )
}

export function InsightsTab({ sessions, feedbacks, today }: InsightsTabProps) {
  const insights = buildAthleteInsights({ sessions, feedbacks, today })

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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Realizacja planu"
          value={insights.overview.completionRate != null ? `${insights.overview.completionRate}%` : '—'}
          detail={`${insights.overview.completedSessions} z ${insights.overview.dueSessions} sesji wykonanych w ostatnich 28 dniach`}
          tone={completionTone}
        />
        <StatCard
          label="Feedback pokrycie"
          value={insights.overview.feedbackCoverage != null ? `${insights.overview.feedbackCoverage}%` : '—'}
          detail={`${insights.reaction.feedbackCount} feedbacków w oknie 28 dni`}
          tone={insights.overview.feedbackCoverage != null && insights.overview.feedbackCoverage >= 60 ? 'green' : 'default'}
        />
        <StatCard
          label="Reakcja zawodnika"
          value={insights.reaction.avgRpe != null ? `RPE ${insights.reaction.avgRpe}` : 'Brak RPE'}
          detail={insights.reaction.dominantFeeling ? `${insights.reaction.dominantFeeling} ${insights.reaction.dominantFeelingLabel}` : 'Brak dominującego samopoczucia'}
          tone={reactionTone}
        />
        <StatCard
          label="Dane wykonania"
          value={insights.overview.actualCoverage != null ? `${insights.overview.actualCoverage}%` : '—'}
          detail={insights.actualSources.length > 0 ? insights.actualSources.map((source) => `${source.label}: ${source.count}`).join(' · ') : 'Brak actual danych w analizowanym oknie'}
          tone={actualTone}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold">Sygnały i ryzyka</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Automatyczny przegląd ostatnich 14-28 dni. To ma pomagać w decyzjach planistycznych, nie zastępować oceny trenera.
            </p>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Okno: {formatDate(insights.window.last28Start, { day: 'numeric', month: 'short' })} - {formatDate(today, { day: 'numeric', month: 'short' })}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {insights.flags.map((flag) => (
            <FlagCard key={`${flag.title}-${flag.detail}`} tone={flag.tone} title={flag.title} detail={flag.detail} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold">Wykonanie planu</h3>
          <div className="grid gap-3 md:grid-cols-2 mt-4">
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status sesji w 28 dni</div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <div className="font-semibold" style={{ color: '#2ECC71' }}>{insights.overview.completedSessions}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Wykonane</div>
                </div>
                <div>
                  <div className="font-semibold" style={{ color: '#E74C3C' }}>{insights.overview.skippedSessions}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Pominięte</div>
                </div>
                <div>
                  <div className="font-semibold" style={{ color: '#60A5FA' }}>{insights.overview.detectedSessions}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Wykryte</div>
                </div>
                <div>
                  <div className="font-semibold" style={{ color: '#F1C40F' }}>{insights.overview.unresolvedSessions}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Bez potwierdzenia</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Plan vs wykonanie</div>
              <div className="space-y-3 mt-3">
                {insights.planVsActual.distance ? (
                  <div>
                    <div className="text-sm font-semibold">
                      Dystans: {insights.planVsActual.distance.actual} / {insights.planVsActual.distance.planned} km
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {insights.planVsActual.distance.deltaPercent === null ? 'Bez porównania' : `${insights.planVsActual.distance.deltaPercent > 0 ? '+' : ''}${insights.planVsActual.distance.deltaPercent}% vs plan · ${insights.planVsActual.distance.coverage} sesji`}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Za mało sparowanych danych dystansu, żeby liczyć plan vs wykonanie.
                  </div>
                )}

                {insights.planVsActual.duration ? (
                  <div>
                    <div className="text-sm font-semibold">
                      Czas: {insights.planVsActual.duration.actual} / {insights.planVsActual.duration.planned} min
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {insights.planVsActual.duration.deltaPercent === null ? 'Bez porównania' : `${insights.planVsActual.duration.deltaPercent > 0 ? '+' : ''}${insights.planVsActual.duration.deltaPercent}% vs plan · ${insights.planVsActual.duration.coverage} sesji`}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Za mało sparowanych danych czasu, żeby liczyć plan vs wykonanie.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold">Reakcja zawodnika</h3>
          <div className="space-y-3 mt-4">
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>RPE i samopoczucie</div>
              <div className="mt-2 text-sm font-semibold">
                {insights.reaction.avgRpe != null ? `Średnie RPE ${insights.reaction.avgRpe}` : 'Brak wystarczających danych RPE'}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {insights.reaction.rpeDelta != null
                  ? `${insights.reaction.rpeDelta > 0 ? '+' : ''}${insights.reaction.rpeDelta} vs poprzednie 14 dni`
                  : 'Za mało danych do porównania trendu'}
              </div>
              {insights.reaction.dominantFeeling && (
                <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Dominujące samopoczucie: {insights.reaction.dominantFeeling} {FEELING_LABELS[insights.reaction.dominantFeeling] ?? insights.reaction.dominantFeeling}
                </div>
              )}
            </div>

            <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Ból / problem</div>
              <div className="mt-2 text-sm font-semibold">
                {insights.reaction.painCount > 0 ? `${insights.reaction.painCount} sygnałów bólu` : 'Brak zgłoszonych problemów'}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Liczone z feedbacków z ostatnich 28 dni.
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Źródła actual danych</div>
              {insights.actualSources.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {insights.actualSources.map((source) => (
                    <span
                      key={source.source}
                      className="px-2.5 py-1 rounded-full text-xs"
                      style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
                    >
                      {source.label}: {source.count}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  W tym oknie nie ma jeszcze actual danych do porównania.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold">Typy sesji</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Ostatnie 56 dni. Tu widać, które bodźce są realizowane stabilnie, a które zaczynają się sypać.
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              {['Typ', 'Sesje', 'Wykonane', 'Pominięte', 'Wykryte', 'Bez potw.', 'Śr. RPE', 'Ból'].map((header) => (
                <th key={header} className="text-left px-4 py-3 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {insights.typeStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <ProfileEmptyState
                    icon="🏃"
                    title="Brak danych typów sesji"
                    description="Typy sesji pojawią się tutaj po kilku wykonanych albo pominiętych jednostkach."
                  />
                </td>
              </tr>
            ) : (
              insights.typeStats.map((stat) => (
                <tr key={stat.type} style={{ borderBottom: '1px solid var(--bg-subtle)' }}>
                  <td className="px-4 py-3 font-medium text-xs">{stat.label}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{stat.sessions}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#2ECC71' }}>{stat.completed}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#E74C3C' }}>{stat.skipped}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#60A5FA' }}>{stat.detected}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#F1C40F' }}>{stat.unresolved}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{stat.avgRpe != null ? stat.avgRpe : '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: stat.painCount > 0 ? '#FF5C1B' : 'var(--text-muted)' }}>{stat.painCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold">Ostatnie sesje</h3>
        <div className="space-y-3 mt-4">
          {insights.recentSessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl px-3 py-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-[180px]">
                  <div className="text-sm font-semibold">{session.title}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(session.date, { day: 'numeric', month: 'short' })} · {getSessionExecutionLabel(session)} · {sessionTypeLabel(session.type)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
                  {session.completionSource && <span>{getSessionCompletionSourceLabel({ completion_source: session.completionSource, date: session.date, status: session.status })}</span>}
                  {session.actualDataSource && <span>· actual: {session.actualDataSource}</span>}
                  {session.rpe != null && <span>· RPE {session.rpe}</span>}
                  {session.feeling && <span>· {session.feeling} {FEELING_LABELS[session.feeling] ?? ''}</span>}
                  {session.painFlag && <span style={{ color: '#FF5C1B' }}>· ból/problem</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
