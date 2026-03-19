'use client'

import { useState, useSyncExternalStore } from 'react'
import { CoachSidebar } from '@/components/coach/CoachSidebar'
import { ThemeProvider } from '@/lib/theme'

const COLLAPSED_KEY = 'coach_sidebar_collapsed'

interface Props {
  coachName: string
  coachPlan: string
  coachAvatar: string
  unreadFeedback: number
  unreadMessages: number
  children: React.ReactNode
}

export function CoachShell({ coachName, coachPlan, coachAvatar, unreadFeedback, unreadMessages, children }: Props) {
  // Hydration-safe: default false on server, read from localStorage on client
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false)

  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const collapsed = collapsedOverride ?? (hydrated ? (() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true' } catch { return false }
  })() : false)

  function handleToggle() {
    const next = !collapsed
    setCollapsedOverride(next)
    try { localStorage.setItem(COLLAPSED_KEY, String(next)) } catch { /* ignore */ }
  }

  function handleMobileToggle() {
    setMobileOpen(o => !o)
  }

  function handleMobileClose() {
    setMobileOpen(false)
  }

  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={handleMobileClose}
          />
        )}

        <CoachSidebar
          collapsed={collapsed}
          onToggle={handleToggle}
          coachName={coachName}
          coachPlan={coachPlan}
          coachAvatar={coachAvatar}
          unreadFeedback={unreadFeedback}
          unreadMessages={unreadMessages}
          mobileOpen={mobileOpen}
          onMobileClose={handleMobileClose}
        />
        <main
          className="flex-1 min-h-screen overflow-auto transition-all duration-200 pb-20 ml-0 md:ml-[var(--sidebar-w)]"
          style={{ '--sidebar-w': collapsed ? '64px' : '256px', background: 'var(--bg-base)' } as React.CSSProperties}
        >
          {/* Mobile hamburger */}
          <button
            onClick={handleMobileToggle}
            className="fixed top-4 left-4 z-30 w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer md:hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            aria-label="Otwórz menu"
          >
            ☰
          </button>
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
