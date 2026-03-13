'use client'

import { useState } from 'react'
import { CoachSidebar } from '@/components/coach/CoachSidebar'
import { ThemeProvider } from '@/lib/theme'

interface Props {
  coachName: string
  coachPlan: string
  coachAvatar: string
  children: React.ReactNode
}

export function CoachShell({ coachName, coachPlan, coachAvatar, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        <CoachSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          coachName={coachName}
          coachPlan={coachPlan}
          coachAvatar={coachAvatar}
        />
        <main
          className="flex-1 min-h-screen overflow-auto transition-all duration-200"
          style={{ marginLeft: collapsed ? '64px' : '256px', background: 'var(--bg-base)' }}
        >
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
