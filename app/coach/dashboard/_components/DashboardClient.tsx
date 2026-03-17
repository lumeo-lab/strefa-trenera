'use client'

import { useMemo } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, plural } from '@/lib/utils'
import Link from 'next/link'

import {
  DEFAULT_PREFS,
  KPI_META, type KpiId, SECTION_COL, SECTION_META, type SectionId,
  SETTINGS_GROUPS, useDashboardPrefs,
} from './useDashboardPrefs'

import { TodayActionsSection } from './sections/ActionSections'
import { TodayPlanSection } from './sections/TodaySections'
import { FeedbackListSection, MessagesSection } from './sections/CommunicationSections'
import { AlertsSection, NoSessionsSection, RecentAthletesSection } from './sections/AthleteSections'
import { OverdueInvoicesSection, UpcomingRacesSection } from './sections/FinanceRaceSections'

import type {
  DashboardAthleteRow,
  DashboardFeedbackRow,
  DashboardInvoiceRow,
  DashboardMessageRow,
  DashboardRaceRow,
  DashboardSessionRow,
  DashboardWeekSessionRow,
} from './types'

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
        <button onClick={onUp} disabled={!canUp}
          className="text-xs cursor-pointer disabled:opacity-20 hover:opacity-70 leading-none px-1 py-0.5">▲</button>
        <button onClick={onDown} disabled={!canDown}
          className="text-xs cursor-pointer disabled:opacity-20 hover:opacity-70 leading-none px-1 py-0.5">▼</button>
      </div>
      <span className="text-base shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      <button onClick={onToggle}
        className="relative w-10 h-6 rounded-full transition-colors shrink-0"
        style={{ background: visible ? '#FF5C1B' : 'var(--bg-raised)' }}>
        <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: visible ? 'calc(100% - 22px)' : '2px' }} />
      </button>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  coachName: string
  todayIso: string
  todayLabel: string
  allAthletes: DashboardAthleteRow[]
  feedbacks: DashboardFeedbackRow[]
  messages: DashboardMessageRow[]
  sessions: DashboardSessionRow[]
  weekSessions: DashboardWeekSessionRow[]
  races: DashboardRaceRow[]
  overdueInvoices: DashboardInvoiceRow[]
  totalUnread: number
  totalUnreadMessages: number
  estimatedMonthlyRevenue: number
  activeCount: number
  pendingAmount: number
  overdueAmount: number
  pendingCount: number
  overdueCount: number
  raceSoonCount: number
  alertAthletes: DashboardAthleteRow[]
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardClient({
  coachName, todayIso, todayLabel, allAthletes, feedbacks, messages, sessions,
  weekSessions, races, overdueInvoices, totalUnread, totalUnreadMessages,
  estimatedMonthlyRevenue, activeCount, pendingAmount, overdueAmount,
  pendingCount, overdueCount, raceSoonCount, alertAthletes,
}: Props) {

  const {
    prefs, savePrefs,
    settingsOpen, setSettingsOpen,
    hintDismissed, dismissHint,
    toggleKpi, toggleSection, moveKpi, moveSection,
    visibleKpi, fullSections, leftSections, rightSections,
  } = useDashboardPrefs()

  const weekAthleteIds = useMemo(
    () => new Set(weekSessions.map((s: { athlete_id?: string }) => s.athlete_id).filter(Boolean)),
    [weekSessions],
  )
  const noSessionsAthletes = useMemo(
    () => allAthletes.filter(a => a.status !== 'inactive' && !weekAthleteIds.has(a.id)),
    [allAthletes, weekAthleteIds],
  )
  const todayCompleted = sessions.filter((s: { completed: boolean }) => s.completed).length
  const recentAthletesData = useMemo(
    () => [...allAthletes].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).slice(0, 4),
    [allAthletes],
  )

  // ── KPI renderer ──────────────────────────────────────────────────────────

  function renderKpi(id: KpiId) {
    switch (id) {
      case 'athletes': return (
        <Link href="/coach/athletes">
          <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">👟</span>
              {alertAthletes.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>
                  {alertAthletes.length} {plural(alertAthletes.length, 'alert', 'alerty', 'alertów')}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold mb-1">{activeCount}</div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Aktywni zawodnicy</div>
            <div className="text-xs font-medium" style={{ color: '#2ECC71' }}>{allAthletes.length} wszystkich w bazie</div>
          </Card>
        </Link>
      )
      case 'feedback': return (
        <Link href="/coach/feedback">
          <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="mb-3 text-2xl">📥</div>
            <div className="text-2xl font-bold mb-1">{totalUnread}</div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Feedback do przeczytania</div>
            <div className="text-xs font-medium" style={{ color: totalUnread > 0 ? '#F1C40F' : '#2ECC71' }}>
              {totalUnread > 0 ? 'Wymaga uwagi' : 'Wszystko odczytane'}
            </div>
          </Card>
        </Link>
      )
      case 'revenue': return (
        <Link href="/coach/analytics">
          <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="mb-3 text-2xl">💰</div>
            <div className="text-2xl font-bold mb-1">{formatCurrency(estimatedMonthlyRevenue)}</div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Szacowany przychód w miesiącu</div>
            <div className="text-xs font-medium" style={{ color: '#FF5C1B' }}>Na podstawie aktywnych pakietów</div>
          </Card>
        </Link>
      )
      case 'payments': return (
        <Link href="/coach/invoices">
          <Card className="p-5 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">💳</span>
              {overdueAmount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#E74C3C' }}>Po terminie</span>
              )}
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: overdueAmount > 0 ? '#E74C3C' : 'inherit' }}>
              {formatCurrency(pendingAmount + overdueAmount)}
            </div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Faktury do opłacenia</div>
            <div className="text-xs font-medium" style={{ color: overdueAmount > 0 ? '#E74C3C' : pendingAmount > 0 ? '#F1C40F' : '#2ECC71' }}>
              {overdueAmount > 0
                ? `${overdueCount} po terminie płatności`
                : pendingAmount > 0
                ? `${pendingCount} czekają na wpłatę`
                : 'Brak zaległości'}
            </div>
          </Card>
        </Link>
      )
    }
  }

  // ── Section renderer ──────────────────────────────────────────────────────

  function renderSection(id: SectionId) {
    switch (id) {
      case 'today_actions':     return (
        <TodayActionsSection
          unreadFeedbackCount={totalUnread}
          unreadMessagesCount={totalUnreadMessages}
          overdueInvoiceCount={overdueCount}
          overdueAmount={overdueAmount}
          noPlanCount={noSessionsAthletes.length}
          raceSoonCount={raceSoonCount}
        />
      )
      case 'today_plan':        return <TodayPlanSection sessions={sessions} todayCompleted={todayCompleted} />
      case 'messages':          return <MessagesSection messages={messages} />
      case 'alerts':            return <AlertsSection alertAthletes={alertAthletes} />
      case 'no_sessions_week':  return <NoSessionsSection noSessionsAthletes={noSessionsAthletes} />
      case 'feedback_list':     return <FeedbackListSection feedbacks={feedbacks} />
      case 'upcoming_races':    return <UpcomingRacesSection races={races} todayIso={todayIso} />
      case 'recent_athletes':   return <RecentAthletesSection recentAthletesData={recentAthletesData} />
      case 'overdue_invoices':  return <OverdueInvoicesSection overdueInvoices={overdueInvoices} todayIso={todayIso} />
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const hasLeft = leftSections.length > 0
  const hasRight = rightSections.length > 0

  return (
    <div>
      <CoachTopbar
        title={`Dzień dobry, ${coachName}! 👋`}
        subtitle={todayLabel}
        actions={
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,92,27,0.12)', color: '#FF5C1B', border: '1px solid rgba(255,92,27,0.3)' }}
          >
            ⚙️ Dostosuj widok
          </button>
        }
      />

      <div className="p-6 max-w-6xl mx-auto space-y-5">

        {/* Onboarding hint */}
        {!hintDismissed && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'rgba(255,92,27,0.08)', border: '1px solid rgba(255,92,27,0.2)' }}>
            <span className="text-lg shrink-0">💡</span>
            <span style={{ color: 'var(--text-primary)' }}>
              Dashboard możesz dostosować do swoich potrzeb — ukrywać sekcje i zmieniać ich kolejność klikając{' '}
              <button onClick={() => setSettingsOpen(true)} className="font-semibold underline cursor-pointer" style={{ color: '#FF5C1B' }}>
                ⚙️ Dostosuj widok
              </button>.
            </span>
            <button
              onClick={dismissHint}
              className="shrink-0 text-lg leading-none cursor-pointer hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >×</button>
          </div>
        )}

        {/* KPI row */}
        {visibleKpi.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {visibleKpi.map(k => (
              <div key={k.id}>{renderKpi(k.id)}</div>
            ))}
          </div>
        )}

        {/* Full-width sections */}
        {fullSections.map(s => (
          <div key={s.id}>{renderSection(s.id)}</div>
        ))}

        {/* 2-col grid */}
        {(hasLeft || hasRight) && (
          <div className={hasLeft && hasRight ? 'grid grid-cols-1 xl:grid-cols-5 gap-6' : 'block'}>
            {hasLeft && (
              <div className={hasRight ? 'xl:col-span-3 space-y-5' : 'space-y-5'}>
                {leftSections.map(s => (
                  <div key={s.id}>{renderSection(s.id)}</div>
                ))}
              </div>
            )}
            {hasRight && (
              <div className={hasLeft ? 'xl:col-span-2 space-y-5' : 'space-y-5'}>
                {rightSections.map(s => (
                  <div key={s.id}>{renderSection(s.id)}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings modal */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Dostosuj dashboard"
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <button
              onClick={() => savePrefs(DEFAULT_PREFS)}
              className="text-sm cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              Przywróć domyślne
            </button>
            <button
              onClick={() => setSettingsOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: '#FF5C1B', color: 'white' }}
            >
              Gotowe
            </button>
          </div>
        }
      >
        <div className="space-y-6">
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
      </Modal>
    </div>
  )
}
