'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/coach', icon: '⊞', label: 'Dashboard' },
  { href: '/coach/planner', icon: '📅', label: 'Planer' },
  { href: '/coach/feedback', icon: '📥', label: 'Feedback' },
  { href: '/coach/athletes', icon: '👟', label: 'Zawodnicy' },
  { href: '/coach/crm', icon: '🗂️', label: 'CRM' },
  { href: '/coach/invoices', icon: '💳', label: 'Faktury' },
  { href: '/coach/analytics', icon: '📊', label: 'Analityka' },
  { href: '/coach/chat', icon: '💬', label: 'Czat' },
]

export function CoachSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen flex flex-col fixed left-0 top-0 z-30" style={{ background: '#161920', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <Link href="/" className="text-xl font-black tracking-tight">
          Coach<span style={{ color: '#FF5C1B' }}>Biz</span>
        </Link>
        <div className="text-xs mt-1" style={{ color: '#8A92A8' }}>Panel trenera</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/coach' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'text-white' : 'hover:text-white hover:bg-white/5'}`}
                  style={{
                    background: isActive ? 'rgba(255,92,27,0.12)' : undefined,
                    color: isActive ? '#FF5C1B' : '#8A92A8',
                    borderLeft: isActive ? '2px solid #FF5C1B' : '2px solid transparent',
                  }}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-sm text-white">TC</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Tomasz Czajka</div>
            <div className="text-xs truncate" style={{ color: '#8A92A8' }}>Plan Pro</div>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-sm transition-colors hover:text-white" style={{ color: '#8A92A8' }}>
          <span>←</span> Strona główna
        </Link>
      </div>
    </aside>
  )
}
