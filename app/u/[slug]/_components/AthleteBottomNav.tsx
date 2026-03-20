'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getInitials } from '@/lib/utils'
import { GRADIENT_MAP } from '@/lib/constants'

interface Props {
  slug: string
  athleteName: string
  athleteAvatar: string
}

export function AthleteBottomNav({ slug, athleteName, athleteAvatar }: Props) {
  const pathname = usePathname()
  const isProfileActive = pathname.startsWith(`/u/${slug}/profile`)

  const items = [
    { href: `/u/${slug}`, icon: '🏠', label: 'Dziś' },
    { href: `/u/${slug}/plan`, icon: '📅', label: 'Plan' },
    { href: `/u/${slug}/history`, icon: '📊', label: 'Wykonanie' },
    { href: `/u/${slug}/chat`, icon: '💬', label: 'Czat' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20"
      style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      <div className="flex items-center justify-around max-w-sm mx-auto py-1.5">
        {items.map(item => {
          const isActive = item.href === `/u/${slug}` ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              style={{ color: isActive ? '#FF5C1B' : 'var(--text-muted)' }}>
              <span className="text-lg">{item.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
            </Link>
          )
        })}

        {/* Avatar — profile link */}
        <Link href={`/u/${slug}/profile`}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all">
          <NavAvatar avatar={athleteAvatar} name={athleteName} active={isProfileActive} />
          <span style={{ fontSize: '11px', fontWeight: isProfileActive ? '600' : '400', color: isProfileActive ? '#FF5C1B' : 'var(--text-muted)' }}>Profil</span>
        </Link>
      </div>
    </nav>
  )
}

function NavAvatar({ avatar, name, active }: { avatar: string; name: string; active: boolean }) {
  const size = 'w-5 h-5'
  const ring = active ? '2px solid #FF5C1B' : '1.5px solid var(--border)'

  if (avatar.startsWith('http')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={name} className={`${size} rounded-full object-cover`} style={{ border: ring }} />
  }

  if (avatar.startsWith('emoji:')) {
    return (
      <div className={`${size} rounded-full flex items-center justify-center`}
        style={{ background: 'var(--bg-hover)', border: ring, fontSize: '10px' }}>
        {avatar.slice(6)}
      </div>
    )
  }

  const color = avatar.startsWith('color:') ? avatar.slice(6) : 'orange'
  const gradient = GRADIENT_MAP[color] ?? GRADIENT_MAP.orange

  return (
    <div className={`${size} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}
      style={{ fontSize: '8px', border: ring }}>
      {getInitials(name)}
    </div>
  )
}
