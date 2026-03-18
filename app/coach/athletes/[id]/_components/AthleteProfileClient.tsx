'use client'

import { useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { getBusinessToday } from '@/lib/date'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { NotesTab } from './tabs/NotesTab'
import { FeedbackTab } from './tabs/FeedbackTab'
import { RacesTab } from './tabs/RacesTab'
import { FinanceTab } from './tabs/FinanceTab'
import { DataTab } from './tabs/DataTab'
import { HistoryTab } from './tabs/HistoryTab'
import { PlanTab } from './tabs/PlanTab'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'
import type {
  CoachAthleteRow,
  CoachFeedbackRow,
  CoachInvoiceRow,
  CoachPackageRow,
  CoachRaceRow,
  CoachTrainingSessionRow,
  FeedbackByDateMap,
  FeedbackBySessionMap,
} from './types'

interface Props {
  athlete: CoachAthleteRow
  sessions: CoachTrainingSessionRow[]
  feedbacks: CoachFeedbackRow[]
  invoices: CoachInvoiceRow[]
  packages: CoachPackageRow[]
  races: CoachRaceRow[]
  unreadMessagesCount: number
  appUrl: string
  accessInfo: {
    inviteUsedAt: string | null
    hasActiveSession: boolean
    lastSeenAt: string | null
    sessionCreatedAt: string | null
  }
  summaryInfo: {
    unpaidInvoicesCount: number
    nextRace: {
      name: string
      date: string
      distance: string | null
    } | null
  }
}

export function AthleteProfileClient({ athlete, sessions: initialSessions, feedbacks: athleteFeedbacks, invoices: athleteInvoices, packages, races: initialRaces, unreadMessagesCount, appUrl, accessInfo, summaryInfo }: Props) {
  const [activeTab, setActiveTab] = useState('plan')

  // Feedback lookup
  const feedbackBySession: FeedbackBySessionMap = Object.fromEntries(
    athleteFeedbacks.filter(f => f.session_id).map(f => [f.session_id as string, f])
  )
  const feedbackByDate: FeedbackByDateMap = Object.fromEntries(
    athleteFeedbacks.filter(f => !f.session_id).map(f => [f.date, f])
  )

  // Date helpers
  const today = getBusinessToday()
  const currentMonth = today.slice(0, 7)

  // Session types
  const { all: allSessionTypes } = useCustomSessionTypes()

  // Invite link
  const [linkCopied, setLinkCopied] = useState(false)
  const inviteToken = athlete.invite_token
  const inviteBaseUrl = appUrl.replace(/\/$/, '')
  const inviteUrl = `${inviteBaseUrl}/u/${athlete.slug}?t=${inviteToken}`
  const [inviteError, setInviteError] = useState<string | null>(null)
  const attentionStorageKey = `athlete-profile-attention-collapsed:${athlete.id}`
  const [attentionCollapsed, setAttentionCollapsed] = useState(() => {
    try {
      if (typeof window === 'undefined') return false
      return window.localStorage.getItem(attentionStorageKey) === '1'
    } catch {
      return false
    }
  })

  async function copyInviteLink() {
    setInviteError(null)
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      setInviteError('Nie udało się skopiować — skopiuj ręcznie z pola powyżej')
    }
  }

  function toggleAttentionCollapsed() {
    setAttentionCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(attentionStorageKey, next ? '1' : '0')
      } catch {}
      return next
    })
  }

  const unreadFeedbackCount = athleteFeedbacks.filter(f => !f.read).length

  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'history', label: 'Historia' },
    { id: 'feedback', label: unreadFeedbackCount > 0 ? `Feedback (${unreadFeedbackCount})` : 'Feedback' },
    { id: 'races', label: 'Zawody' },
    { id: 'notes', label: 'Notatki' },
    { id: 'data', label: 'Dane' },
    { id: 'finance', label: 'Finanse' },
  ]

  const completedSessions = initialSessions.filter(s => s.completed && s.actual_distance)
  const totalKm = completedSessions.reduce((sum, s) => sum + (s.actual_distance || 0), 0)
  const accessTone = accessInfo.hasActiveSession ? '#2ECC71' : accessInfo.inviteUsedAt ? '#F1C40F' : '#6B7280'
  const accessLabel = accessInfo.hasActiveSession
    ? 'Dostęp aktywowany'
    : accessInfo.inviteUsedAt
      ? 'Link użyty, brak aktywnej sesji'
      : 'Dostęp jeszcze nieaktywowany'
  const nextSession = initialSessions
    .filter((session) => !session.completed && session.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))[0] ?? null
  const activeInjuries = Array.isArray(athlete.injuries) ? athlete.injuries.filter(Boolean) : []
  const daysToRace = summaryInfo.nextRace
    ? Math.ceil((new Date(summaryInfo.nextRace.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const attentionItems = [
    !nextSession ? { tone: 'red' as const, label: 'Brak najbliższej sesji', detail: 'Warto uzupełnić plan zawodnika.' } : null,
    unreadMessagesCount > 0 ? { tone: 'orange' as const, label: `${unreadMessagesCount} ${unreadMessagesCount === 1 ? 'nieprzeczytana wiadomość' : unreadMessagesCount < 5 ? 'nieprzeczytane wiadomości' : 'nieprzeczytanych wiadomości'}`, detail: 'Na czacie czeka odpowiedź zawodnika.' } : null,
    unreadFeedbackCount > 0 ? { tone: 'yellow' as const, label: `${unreadFeedbackCount} ${unreadFeedbackCount === 1 ? 'nieprzeczytany feedback' : unreadFeedbackCount < 5 ? 'nieprzeczytane feedbacki' : 'nieprzeczytanych feedbacków'}`, detail: 'Warto sprawdzić ostatnie odczucia zawodnika.' } : null,
    summaryInfo.unpaidInvoicesCount > 0 ? { tone: 'red' as const, label: `${summaryInfo.unpaidInvoicesCount} ${summaryInfo.unpaidInvoicesCount === 1 ? 'otwarta płatność' : summaryInfo.unpaidInvoicesCount < 5 ? 'otwarte płatności' : 'otwartych płatności'}`, detail: 'Są faktury oczekujące lub przeterminowane.' } : null,
    summaryInfo.nextRace && daysToRace !== null && daysToRace <= 21
      ? { tone: 'orange' as const, label: daysToRace <= 0 ? 'Start już dziś lub zaległy wynik' : `Start za ${daysToRace} ${daysToRace === 1 ? 'dzień' : 'dni'}`, detail: summaryInfo.nextRace.name }
      : null,
    activeInjuries.length > 0 ? { tone: 'yellow' as const, label: `${activeInjuries.length} ${activeInjuries.length === 1 ? 'aktywna kontuzja' : activeInjuries.length < 5 ? 'aktywne kontuzje' : 'aktywnych kontuzji'}`, detail: activeInjuries.slice(0, 2).join(' · ') } : null,
    !accessInfo.hasActiveSession && !accessInfo.inviteUsedAt ? { tone: 'gray' as const, label: 'Dostęp jeszcze nieaktywny', detail: 'Zawodnik nie wszedł jeszcze do swojego panelu.' } : null,
  ].filter((item): item is { tone: 'red' | 'orange' | 'yellow' | 'gray'; label: string; detail: string } => !!item)
  const attentionToneDots: Record<'red' | 'orange' | 'yellow' | 'gray', string> = {
    red: '#E74C3C',
    orange: '#FF5C1B',
    yellow: '#F1C40F',
    gray: '#8A92A8',
  }

  return (
    <div>
      <CoachTopbar
        title={athlete.name}
        subtitle={[athlete.goal, athlete.package].filter(Boolean).join(' · ')}
        actions={
          <Link href="/coach/athletes" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← Zawodnicy
          </Link>
        }
      />

      <div className="p-6">
        {/* Profile header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-5">
            <Avatar initials={athlete.avatar} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{athlete.name}</h2>
                {athlete.archived_at && (
                  <Badge variant="gray">Archiwum</Badge>
                )}
                <Badge variant="gray">
                  {athlete.package} — {formatCurrency(athlete.package_price)}/mies.
                </Badge>
                <Link href={`/coach/chat?athlete=${athlete.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ml-auto shrink-0 transition-colors"
                  style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                  💬 Chat
                  {unreadMessagesCount > 0 && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FF5C1B', color: 'white', lineHeight: 1 }}>
                      {unreadMessagesCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className="mb-2 flex items-center gap-2 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-flex items-center gap-1.5" style={{ color: accessTone }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: accessTone }} />
                  {accessLabel}
                </span>
                {accessInfo.lastSeenAt && (
                  <span>
                    Ostatnia aktywność: {formatDate(accessInfo.lastSeenAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
                {!accessInfo.lastSeenAt && accessInfo.inviteUsedAt && (
                  <span>
                    Link użyty: {formatDate(accessInfo.inviteUsedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
                {athlete.goal && <span>🎯 {athlete.goal}</span>}
                {athlete.city && <span>📍 {athlete.city}</span>}
                {athlete.age && <span>🎂 {athlete.age} lat</span>}
                <span>📅 Od {formatDate(athlete.join_date, { month: 'long', year: 'numeric' })}</span>
                {totalKm > 0 && <span>🏃 {totalKm.toFixed(0)} km łącznie</span>}
              </div>
              <div className="mt-4 rounded-2xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--text-muted)' }}>
                  Link dla zawodnika
                </div>
                <div className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  Wyślij zawodnikowi ten link. To stały adres dostępu do jego panelu.
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-xl text-xs font-mono truncate select-all" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    {inviteUrl}
                  </code>
                  <button
                    onClick={() => void copyInviteLink()}
                    className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                    style={{ background: linkCopied ? 'rgba(46,204,113,0.15)' : 'rgba(255,92,27,0.1)', color: linkCopied ? '#2ECC71' : '#FF5C1B' }}
                  >
                    {linkCopied ? '✓ Skopiowano' : '📋 Kopiuj link'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </Card>

        <Card className="p-5 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                Sygnały i status
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Najważniejsze informacje i sygnały dotyczące bieżącej sytuacji zawodnika.
              </div>
            </div>
            <div className="flex items-center gap-2">
              {attentionItems.length === 0 && (
                <Badge variant="green">Bez pilnych tematów</Badge>
              )}
              <button
                type="button"
                onClick={toggleAttentionCollapsed}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                {attentionCollapsed ? 'Rozwiń sekcję' : 'Zwiń sekcję'}
              </button>
            </div>
          </div>
          {!attentionCollapsed && (
            attentionItems.length > 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {attentionItems.map((item, index) => (
                  <div
                    key={`${item.label}-${item.detail}`}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                    style={{
                      background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-elevated)',
                      borderTop: index === 0 ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: attentionToneDots[item.tone] }} />
                        <div className="text-sm font-semibold">{item.label}</div>
                      </div>
                    </div>
                    <div className="text-xs text-right max-w-[45%]" style={{ color: 'var(--text-muted)' }}>
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl px-4 py-4 text-sm" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.16)', color: '#A7F3D0' }}>
                Profil wygląda spokojnie: plan jest uzupełniony, nie ma nowych zaległości ani pilnych sygnałów.
              </div>
            )
          )}
        </Card>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

        {activeTab === 'plan' && (
          <PlanTab
            athleteId={athlete.id}
            sessions={initialSessions}
            feedbackBySession={feedbackBySession}
            feedbackByDate={feedbackByDate}
            today={today}
            currentMonth={currentMonth}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            sessions={initialSessions}
            feedbackBySession={feedbackBySession}
            feedbackByDate={feedbackByDate}
            today={today}
            currentMonth={currentMonth}
            allSessionTypes={allSessionTypes}
          />
        )}

        {activeTab === 'feedback' && (
          <FeedbackTab athleteId={athlete.id} feedbacks={athleteFeedbacks} />
        )}

        {activeTab === 'races' && (
          <RacesTab athleteId={athlete.id} races={initialRaces} today={today} />
        )}

        {activeTab === 'notes' && (
          <NotesTab athleteId={athlete.id} initialNotes={athlete.coach_notes ?? ''} />
        )}

        {activeTab === 'data' && (
          <DataTab
            athlete={athlete}
            packages={packages}
            accessInfo={accessInfo}
            inviteUrl={inviteUrl}
            inviteError={inviteError}
            linkCopied={linkCopied}
            onCopyInviteLink={copyInviteLink}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceTab athleteId={athlete.id} athletePackage={athlete.package} invoices={athleteInvoices} />
        )}
      </div>
    </div>
  )
}
