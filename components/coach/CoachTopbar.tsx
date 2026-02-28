'use client'
import { useTheme } from '@/lib/theme'

interface CoachTopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function CoachTopbar({ title, subtitle, actions }: CoachTopbarProps) {
  const { theme, toggle } = useTheme()
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b sticky top-0 z-20"
      style={{ background: theme === 'dark' ? 'rgba(13,15,20,0.9)' : 'rgba(244,246,251,0.95)', backdropFilter: 'blur(20px)', borderColor: 'var(--border)' }}>
      <div>
        <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button
          onClick={toggle}
          className="p-2 rounded-xl transition-colors cursor-pointer"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          title={theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="relative p-2 rounded-xl transition-colors" style={{ color: 'var(--text-muted)' }}>
          🔔
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
        </button>
      </div>
    </header>
  )
}
