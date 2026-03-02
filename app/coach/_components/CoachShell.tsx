'use client'

import { useState } from 'react'
import { CoachSidebar } from '@/components/coach/CoachSidebar'
import { ThemeProvider } from '@/lib/theme'

interface Props {
  coachName: string
  coachPlan: string
  children: React.ReactNode
}

export function CoachShell({ coachName, coachPlan, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        <CoachSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          coachName={coachName}
          coachPlan={coachPlan}
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
