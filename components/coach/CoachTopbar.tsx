'use client'

interface CoachTopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function CoachTopbar({ title, subtitle, actions }: CoachTopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b sticky top-0 z-20" style={{ background: 'rgba(13,15,20,0.9)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div>
        <h1 className="text-base font-semibold">{title}</h1>
        {subtitle && <p className="text-xs" style={{ color: '#8A92A8' }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="relative p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: '#8A92A8' }}>
          🔔
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
        </button>
      </div>
    </header>
  )
}
