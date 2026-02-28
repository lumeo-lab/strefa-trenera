'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/lib/theme'

const navItems = [
  { href: '/athlete', icon: '🏠', label: 'Dziś' },
  { href: '/athlete/plan', icon: '📅', label: 'Plan' },
  { href: '/athlete/history', icon: '📈', label: 'Historia' },
  { href: '/athlete/chat', icon: '💬', label: 'Czat' },
]

export function AthleteBottomNav() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 max-w-sm mx-auto"
      style={{ background: theme === 'dark' ? 'rgba(22,25,32,0.95)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)', paddingTop: '8px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      {navItems.map(item => {
        const isActive = pathname === item.href
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all"
            style={{ color: isActive ? '#FF5C1B' : 'var(--text-muted)' }}>
            <span className="text-2xl leading-none">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        )
      })}
      <button onClick={toggle} className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer"
        style={{ color: 'var(--text-muted)' }}>
        <span className="text-2xl leading-none">{theme === 'dark' ? '☀️' : '🌙'}</span>
        <span className="text-xs font-medium">Motyw</span>
      </button>
    </nav>
  )
}
