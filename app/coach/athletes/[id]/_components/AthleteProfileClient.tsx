'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { getBusinessToday } from '@/lib/date'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { NotesTab } from './tabs/NotesTab'
import { FeedbackTab } from './tabs/FeedbackTab'
import { RacesTab } from './tabs/RacesTab'
import { FinanceTab } from './tabs/FinanceTab'
import { DataTab } from './tabs/DataTab'
import { HistoryTab } from './tabs/HistoryTab'
import { PlanTab } from './tabs/PlanTab'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'
import { getActiveAthleteInjuries, parseAthleteInjuryHistory } from '@/lib/athlete-injuries'
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
  initialTab?: string
}

const PROFILE_TABS = ['plan', 'history', 'feedback', 'races', 'notes', 'data', 'finance'] as const

function getSafeProfileTab(tab?: string) {
  return PROFILE_TABS.includes((tab ?? '') as (typeof PROFILE_TABS)[number]) ? tab! : 'plan'
}

export function AthleteProfileClient({ athlete, sessions: initialSessions, feedbacks: athleteFeedbacks, invoices: athleteInvoices, packages, races: initialRaces, unreadMessagesCount, appUrl, accessInfo, summaryInfo, initialTab }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(getSafeProfileTab(initialTab))
  const [linkPanelOpen, setLinkPanelOpen] = useState(false)
  const [attentionModalOpen, setAttentionModalOpen] = useState(false)

  // Feedback lookup (memoized — avoids rebuilding on every render)
  const feedbackBySession: FeedbackBySessionMap = useMemo(
    () => Object.fromEntries(athleteFeedbacks.filter(f => f.session_id).map(f => [f.session_id as string, f])),
    [athleteFeedbacks],
  )
  const feedbackByDate: FeedbackByDateMap = useMemo(
    () => Object.fromEntries(athleteFeedbacks.filter(f => !f.session_id).map(f => [f.date, f])),
    [athleteFeedbacks],
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
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function copyInviteLink() {
    setInviteError(null)
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setLinkCopied(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      setInviteError('Nie udało się skopiować — skopiuj ręcznie z pola powyżej')
    }
  }

  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(() => athleteFeedbacks.filter(f => !f.read).length)
  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'history', label: 'Historia' },
    { id: 'feedback', label: unreadFeedbackCount > 0 ? `Feedback (${unreadFeedbackCount})` : 'Feedback' },
    { id: 'races', label: 'Zawody' },
    { id: 'notes', label: 'Notatki' },
    { id: 'data', label: 'Dane' },
    { id: 'finance', label: 'Finanse' },
  ]

  const lastCompletedSession = initialSessions
    .filter(s => s.completed)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  const daysSinceLastTraining = lastCompletedSession
    ? Math.floor((new Date(`${today}T12:00:00`).getTime() - new Date(`${lastCompletedSession.date}T12:00:00`).getTime()) / 86400000)
    : null
  const nextSession = initialSessions
    .filter((session) => !session.completed && session.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))[0] ?? null
  const activeInjuries = getActiveAthleteInjuries(parseAthleteInjuryHistory(athlete.injury_history, athlete.injuries))
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
    activeInjuries.length > 0 ? { tone: 'yellow' as const, label: `${activeInjuries.length} ${activeInjuries.length === 1 ? 'aktywna kontuzja' : activeInjuries.length < 5 ? 'aktywne kontuzje' : 'aktywnych kontuzji'}`, detail: activeInjuries.slice(0, 2).map((injury) => injury.name).join(' · ') } : null,
    !accessInfo.hasActiveSession && !accessInfo.inviteUsedAt ? { tone: 'gray' as const, label: 'Dostęp jeszcze nieaktywny', detail: 'Zawodnik nie wszedł jeszcze do swojego panelu.' } : null,
  ].filter((item): item is { tone: 'red' | 'orange' | 'yellow' | 'gray'; label: string; detail: string } => !!item)
  const attentionToneDots: Record<'red' | 'orange' | 'yellow' | 'gray', string> = {
    red: '#E74C3C',
    orange: '#FF5C1B',
    yellow: '#F1C40F',
    gray: '#8A92A8',
  }

  useEffect(() => {
    setActiveTab(getSafeProfileTab(initialTab))
  }, [initialTab])

  useEffect(() => {
    setUnreadFeedbackCount(athleteFeedbacks.filter(f => !f.read).length)
  }, [athleteFeedbacks])

  function handleTabChange(tabId: string) {
    const safeTab = getSafeProfileTab(tabId)
    setActiveTab(safeTab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', safeTab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
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
          <div className="space-y-5">
            <div className="flex items-start gap-5 flex-wrap xl:flex-nowrap">
              <Avatar initials={athlete.avatar} size="xl" />
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-[220px]">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-2xl font-bold">{athlete.name}</h2>
                      {athlete.archived_at && <Badge variant="gray">Archiwum</Badge>}
                      <Badge variant="gray">
                        {athlete.package} — {formatCurrency(athlete.package_price)}/mies.
                      </Badge>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: accessInfo.hasActiveSession ? '#2ECC71' : '#E74C3C' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accessInfo.hasActiveSession ? '#2ECC71' : '#E74C3C' }} />
                        {accessInfo.hasActiveSession ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-sm" style={{ color: 'var(--text-muted)' }}>
                      {athlete.goal && <span>🎯 {athlete.goal}</span>}
                      {athlete.city && <span>📍 {athlete.city}</span>}
                      {athlete.age && <span>🎂 {athlete.age} lat</span>}
                      <span>📅 Od {formatDate(athlete.join_date, { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/coach/chat?athlete=${athlete.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium shrink-0 transition-colors"
                      style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                      💬 Chat
                      {unreadMessagesCount > 0 && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FF5C1B', color: 'white', lineHeight: 1 }}>
                          {unreadMessagesCount}
                        </span>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setAttentionModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        background: attentionItems.length > 0 ? 'rgba(255,92,27,0.12)' : 'var(--bg-elevated)',
                        color: attentionItems.length > 0 ? '#FF5C1B' : 'var(--text-muted)',
                        border: attentionItems.length > 0 ? '1px solid rgba(255,92,27,0.25)' : '1px solid var(--border)',
                      }}
                    >
                      Powiadomienia ({attentionItems.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Ostatni trening</div>
                {lastCompletedSession ? (
                  <>
                    <div className="mt-2 text-sm font-semibold truncate">{lastCompletedSession.title}</div>
                    <div className="text-xs mt-1" style={{ color: daysSinceLastTraining !== null && daysSinceLastTraining > 7 ? '#E74C3C' : 'var(--text-muted)' }}>
                      {daysSinceLastTraining === 0 ? 'Dziś' : daysSinceLastTraining === 1 ? 'Wczoraj' : `${daysSinceLastTraining} dni temu`}
                      {' · '}{formatDate(lastCompletedSession.date, { day: 'numeric', month: 'short' })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Brak aktywności</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Zawodnik nie ukończył jeszcze żadnej sesji</div>
                  </>
                )}
              </div>

              <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Feedback i wiadomości</div>
                <div className="mt-2 text-lg font-semibold">{unreadFeedbackCount + unreadMessagesCount}</div>
                <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {unreadFeedbackCount} nieprzeczytanych feedbacków, {unreadMessagesCount} wiadomości do sprawdzenia.
                </div>
              </div>

              <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Finanse</div>
                <div className="mt-2 text-lg font-semibold">
                  {summaryInfo.unpaidInvoicesCount > 0 ? `${summaryInfo.unpaidInvoicesCount} otwarte` : 'Brak zaległości'}
                </div>
                <div className="text-xs mt-2" style={{ color: summaryInfo.unpaidInvoicesCount > 0 ? '#E74C3C' : 'var(--text-muted)' }}>
                  {summaryInfo.unpaidInvoicesCount > 0 ? 'Faktury oczekujące lub przeterminowane' : 'Wszystkie płatności rozliczone'}
                </div>
              </div>

              <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>Najbliższy start</div>
                <div className="mt-2 text-lg font-semibold">
                  {summaryInfo.nextRace ? summaryInfo.nextRace.name : 'Brak startu'}
                </div>
                <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {summaryInfo.nextRace ? `${formatDate(summaryInfo.nextRace.date, { day: 'numeric', month: 'long' })}${summaryInfo.nextRace.distance ? ` · ${summaryInfo.nextRace.distance}` : ''}` : 'Brak najbliższego startu w kalendarzu'}
                </div>
              </div>
            </div>

            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-[13px] font-semibold">Link dla zawodnika</div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Wyślij zawodnikowi ten link. To jego prywatny adres dostępu do profilu.
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => void copyInviteLink()}
                    className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                    style={{ background: linkCopied ? 'rgba(46,204,113,0.15)' : 'rgba(255,92,27,0.08)', color: linkCopied ? '#2ECC71' : '#FF5C1B' }}
                  >
                    {linkCopied ? '✓ Skopiowano' : '📋 Kopiuj link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkPanelOpen((prev) => !prev)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  >
                    {linkPanelOpen ? 'Ukryj link' : 'Pokaż link'}
                  </button>
                </div>
              </div>
              {inviteError && (
                <div className="mt-2 text-[11px]" style={{ color: '#E74C3C' }}>{inviteError}</div>
              )}
              {linkPanelOpen && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                    To jest link dostępu do prywatnego profilu zawodnika.
                  </div>
                  <code className="block w-full px-3 py-2 rounded-xl text-[11px] font-mono select-all break-all" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                    {inviteUrl}
                  </code>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Tabs tabs={tabs} active={activeTab} onChange={handleTabChange} className="mb-6" />

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
          <FeedbackTab athleteId={athlete.id} feedbacks={athleteFeedbacks} onFeedbackRead={() => setUnreadFeedbackCount(c => Math.max(0, c - 1))} />
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
          />
        )}

        {activeTab === 'finance' && (
          <FinanceTab athleteId={athlete.id} athletePackage={athlete.package} invoices={athleteInvoices} />
        )}
      </div>

      <Modal open={attentionModalOpen} onClose={() => setAttentionModalOpen(false)} title="Powiadomienia i status" size="md">
        {attentionItems.length > 0 ? (
          <div className="space-y-3">
            {attentionItems.map((item) => (
              <div key={`${item.label}-${item.detail}`} className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: attentionToneDots[item.tone] }} />
                  <div className="text-sm font-semibold">{item.label}</div>
                </div>
                <div className="text-xs pl-4" style={{ color: 'var(--text-muted)' }}>
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl px-4 py-4 text-sm" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.16)', color: '#A7F3D0' }}>
            Profil wygląda spokojnie: plan jest uzupełniony, nie ma nowych zaległości ani pilnych sygnałów.
          </div>
        )}
      </Modal>
    </div>
  )
}
