'use client'

interface Tab { id: string; label: string }

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div
      className={`flex gap-1.5 p-1.5 rounded-2xl overflow-x-auto ${className}`}
      style={{ background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-elevated) 100%)', border: '1px solid var(--border)' }}
    >
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className="flex-1 min-w-max px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          style={{
            background: active === tab.id ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: active === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
            border: active === tab.id ? '1px solid var(--border)' : '1px solid transparent',
            boxShadow: active === tab.id ? '0 10px 24px rgba(0,0,0,0.12)' : 'none',
          }}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
