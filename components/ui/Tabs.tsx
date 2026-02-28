'use client'

interface Tab {
  id: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 p-1 bg-[#1E2330] rounded-xl ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            active === tab.id
              ? 'bg-[#252B3B] text-white'
              : 'text-[#8A92A8] hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
