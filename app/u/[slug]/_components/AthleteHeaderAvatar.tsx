'use client'

import Link from 'next/link'
import { getInitials } from '@/lib/utils'
import { GRADIENT_MAP } from '@/lib/constants'

interface Props {
  slug: string
  name: string
  avatar: string
}

export function AthleteHeaderAvatar({ slug, name, avatar }: Props) {
  const initials = getInitials(name)

  if (avatar.startsWith('http')) {
    return (
      <Link href={`/u/${slug}/profile`} title="Profil">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />
      </Link>
    )
  }

  if (avatar.startsWith('emoji:')) {
    const emoji = avatar.slice(6)
    return (
      <Link href={`/u/${slug}/profile`} title="Profil"
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-lg"
        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
        {emoji}
      </Link>
    )
  }

  const color = avatar.startsWith('color:') ? avatar.slice(6) : 'orange'
  const gradient = GRADIENT_MAP[color] ?? GRADIENT_MAP.orange

  return (
    <Link href={`/u/${slug}/profile`} title="Profil"
      className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
      {initials}
    </Link>
  )
}
