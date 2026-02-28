'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/lib/theme'

const navItems = [
  { href: '/athlete', icon: '🏠', label: 'Dziś' },
  { href: '/athlete/plan', icon: '📅', label: 'Plan tygodnia' },
  { href: '/athlete/history', icon: '📈', label: 'Historia' },
  { href: '/athlete/chat', icon: '💬', label: 'Czat z trenerem' },
]

export function AthleteSidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r z-30"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-xl font-black tracking-tight" style={{ color: '#FF5C1B' }}>CoachBiz</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Panel zawodnika</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
              style={{
                background: isActive ? 'rgba(255,92,27,0.1)' : 'transparent',
                color: isActive ? '#FF5C1B' : 'var(--text-muted)',
                borderLeft: isActive ? '2px solid #FF5C1B' : '2px solid transparent',
              }}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + theme */}
      <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">KW</div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>Katarzyna W.</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Plan Pro</div>
          </div>
        </div>
        <button onClick={toggle}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}>
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}</span>
        </button>
      </div>
    </aside>
  )
}
