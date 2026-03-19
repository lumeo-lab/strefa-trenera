'use client'

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

import {
  DEFAULT_PREFS,
  SECTION_META, type SectionId,
  useDashboardPrefs,
} from './useDashboardPrefs'
import { DashboardKPI } from './DashboardKPI'
import { DashboardSettings } from './DashboardSettings'

import { TodayActionsSection } from './sections/ActionSections'
import { TodayPlanSection } from './sections/TodaySections'
import { FeedbackListSection, MessagesSection } from './sections/CommunicationSections'
import { AlertsSection, NoSessionsSection, RecentAthletesSection } from './sections/AthleteSections'
import { OverdueInvoicesSection, UpcomingRacesSection } from './sections/FinanceRaceSections'

import type {
  DashboardAlertItem,
  DashboardAthleteRow,
  DashboardFeedbackRow,
  DashboardInvoiceRow,
  DashboardMessageRow,
  DashboardRaceRow,
  DashboardSessionRow,
  DashboardWeekSessionRow,
} from './types'
import { isSessionCompleted, isSessionOpenForExecution } from '@/lib/session-status'

// ── Collapsible section wrapper ───────────────────────────────────────────────

const COLLAPSED_KEY = 'dashboard-collapsed-sections'

function useCollapsedSections() {
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY)
      if (stored) return new Set(JSON.parse(stored))
    } catch { /* ignore */ }
    return new Set()
  })

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }, [])

  return { collapsed: hydrated ? collapsed : new Set<string>(), toggle }
}

function CollapsibleSection({ title, icon, collapsed, onToggle, children }: {
  title: string
  icon: string
  collapsed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left mb-0 cursor-pointer group"
        aria-expanded={!collapsed}
      >
        <span className="text-xs transition-transform" style={{ color: 'var(--text-muted)', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{icon} {title}</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)', opacity: 0.5 }} />
      </button>
      {!collapsed && <div className="mt-2">{children}</div>}
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
  archivedAthleteCount: number
  pendingAmount: number
  overdueAmount: number
  pendingCount: number
  overdueCount: number
  raceSoonCount: number
  alertAthletes: DashboardAlertItem[]
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardClient({
  coachName, todayIso, todayLabel, allAthletes, feedbacks, messages, sessions,
  weekSessions, races, overdueInvoices, totalUnread, totalUnreadMessages,
  estimatedMonthlyRevenue, activeCount, archivedAthleteCount, pendingAmount, overdueAmount,
  pendingCount, overdueCount, raceSoonCount, alertAthletes,
}: Props) {

  const {
    prefs, savePrefs,
    settingsOpen, setSettingsOpen,
    hintDismissed, dismissHint,
    toggleKpi, toggleSection, moveKpi, moveSection,
    visibleKpi, fullSections, leftSections, rightSections,
  } = useDashboardPrefs()

  const { collapsed: collapsedSections, toggle: toggleCollapse } = useCollapsedSections()

  const athleteIdsWithUpcomingPlan = useMemo(
    () =>
      new Set(
        weekSessions
          .filter((session) => session.date > todayIso || (session.date === todayIso && isSessionOpenForExecution(session)))
          .map((session) => session.athlete_id)
          .filter(Boolean),
      ),
    [todayIso, weekSessions],
  )
  const noSessionsAthletes = useMemo(
    () => allAthletes.filter(a => a.status !== 'inactive' && !athleteIdsWithUpcomingPlan.has(a.id)),
    [allAthletes, athleteIdsWithUpcomingPlan],
  )
  const todayCompleted = sessions.filter((session) => isSessionCompleted(session)).length
  const recentAthletesData = useMemo(
    () => [...allAthletes].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')).slice(0, 4),
    [allAthletes],
  )

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
      case 'messages':          return <MessagesSection messages={messages} totalUnreadMessages={totalUnreadMessages} />
      case 'alerts':            return <AlertsSection alertAthletes={alertAthletes} />
      case 'no_sessions_week':  return <NoSessionsSection noSessionsAthletes={noSessionsAthletes} />
      case 'feedback_list':     return <FeedbackListSection feedbacks={feedbacks} totalUnreadFeedback={totalUnread} />
      case 'upcoming_races':    return <UpcomingRacesSection races={races} todayIso={todayIso} />
      case 'recent_athletes':   return <RecentAthletesSection recentAthletesData={recentAthletesData} />
      case 'overdue_invoices':  return <OverdueInvoicesSection overdueInvoices={overdueInvoices} todayIso={todayIso} />
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const hasLeft = leftSections.length > 0
  const hasRight = rightSections.length > 0
  const hasAnyVisibleContent = visibleKpi.length > 0 || fullSections.length > 0 || hasLeft || hasRight

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
        <DashboardKPI
          visibleKpi={visibleKpi}
          activeCount={activeCount}
          archivedAthleteCount={archivedAthleteCount}
          alertAthletes={alertAthletes}
          totalUnread={totalUnread}
          estimatedMonthlyRevenue={estimatedMonthlyRevenue}
          pendingAmount={pendingAmount}
          overdueAmount={overdueAmount}
          pendingCount={pendingCount}
          overdueCount={overdueCount}
        />

        {!hasAnyVisibleContent && (
          <Card className="p-8">
            <div className="mx-auto max-w-xl text-center">
              <div className="text-3xl mb-3">🧩</div>
              <h3 className="text-lg font-semibold">Dashboard jest teraz pusty</h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                Ukryto wszystkie karty KPI i sekcje. Przywróć domyślny układ albo włącz wybrane moduły w ustawieniach widoku.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={() => savePrefs(DEFAULT_PREFS)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: '#FF5C1B', color: 'white' }}
                >
                  Przywróć domyślne
                </button>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  Otwórz ustawienia
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Full-width sections */}
        {fullSections.map(s => (
          <CollapsibleSection
            key={s.id}
            title={SECTION_META[s.id].label}
            icon={SECTION_META[s.id].icon}
            collapsed={collapsedSections.has(s.id)}
            onToggle={() => toggleCollapse(s.id)}
          >
            {renderSection(s.id)}
          </CollapsibleSection>
        ))}

        {/* 2-col grid */}
        {(hasLeft || hasRight) && (
          <div className={hasLeft && hasRight ? 'grid grid-cols-1 xl:grid-cols-5 gap-6' : 'block'}>
            {hasLeft && (
              <div className={hasRight ? 'xl:col-span-3 space-y-5' : 'space-y-5'}>
                {leftSections.map(s => (
                  <CollapsibleSection
                    key={s.id}
                    title={SECTION_META[s.id].label}
                    icon={SECTION_META[s.id].icon}
                    collapsed={collapsedSections.has(s.id)}
                    onToggle={() => toggleCollapse(s.id)}
                  >
                    {renderSection(s.id)}
                  </CollapsibleSection>
                ))}
              </div>
            )}
            {hasRight && (
              <div className={hasLeft ? 'xl:col-span-2 space-y-5' : 'space-y-5'}>
                {rightSections.map(s => (
                  <CollapsibleSection
                    key={s.id}
                    title={SECTION_META[s.id].label}
                    icon={SECTION_META[s.id].icon}
                    collapsed={collapsedSections.has(s.id)}
                    onToggle={() => toggleCollapse(s.id)}
                  >
                    {renderSection(s.id)}
                  </CollapsibleSection>
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
        <DashboardSettings
          prefs={prefs}
          visibleKpiCount={visibleKpi.length}
          visibleSectionsCount={fullSections.length + leftSections.length + rightSections.length}
          toggleKpi={toggleKpi}
          toggleSection={toggleSection}
          moveKpi={moveKpi}
          moveSection={moveSection}
        />
      </Modal>
    </div>
  )
}
