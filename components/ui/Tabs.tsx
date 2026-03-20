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
    <div className={`flex gap-1 p-1.5 rounded-2xl overflow-x-auto ${className}`} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className="flex-1 min-w-max px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
          style={{
            background: active === tab.id ? 'var(--bg-card)' : undefined,
            color: active === tab.id ? '#FF5C1B' : 'var(--text-muted)',
            border: active === tab.id ? '1px solid var(--border)' : '1px solid transparent',
            boxShadow: active === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : undefined,
          }}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
