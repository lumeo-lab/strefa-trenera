'use client'

import { useId } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  textColor?: string
  className?: string
  iconOnly?: boolean
  stacked?: boolean
}

export function Logo({
  size = 'md',
  textColor = '#E8EAF0',
  className,
  iconOnly = false,
  stacked = false,
}: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const s = size === 'sm' ? 0.72 : size === 'lg' ? 1.2 : size === 'xl' ? 1.7 : 1
  const iW = Math.round(28 * s)
  const iH = Math.round(36 * s)
  const fS = Math.round(18 * s)
  const gap = Math.round(9 * s)

  const mark = (
    <svg width={iW} height={iH} viewBox="0 0 28 36" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`sg${uid}`} x1="22" y1="3" x2="6" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFA070" />
          <stop offset="45%" stopColor="#FF5C1B" />
          <stop offset="100%" stopColor="#D43E00" />
        </linearGradient>
        {/* Subtle glow filter */}
        <filter id={`glow${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Single-stroke S — top curve opens left, bottom curve opens right */}
      <path
        d="M 22,3.5 C 4,3.5 4,18 14,18 C 24,18 24,32.5 6,32.5"
        fill="none"
        stroke={`url(#sg${uid})`}
        strokeWidth="7.5"
        strokeLinecap="round"
        filter={`url(#glow${uid})`}
      />
    </svg>
  )

  const wordmark = (
    <span style={{ color: textColor, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
      <span style={{ fontSize: fS, fontWeight: 900 }}>Strefa</span>
      <span style={{ fontSize: fS, fontWeight: 300 }}> Trenera</span>
    </span>
  )

  if (iconOnly) return mark

  if (stacked) {
    return (
      <div className={`inline-flex flex-col items-center ${className ?? ''}`} style={{ gap: Math.round(6 * s) }}>
        {mark}
        {wordmark}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center ${className ?? ''}`} style={{ gap }}>
      {mark}
      {wordmark}
    </div>
  )
}

/** Small badge — just the S mark, no text. For favicons, collapsed sidebars etc. */
export function LogoMark({ size = 32 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg width={size} height={Math.round(size * 36 / 28)} viewBox="0 0 28 36" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`sm${uid}`} x1="22" y1="3" x2="6" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFA070" />
          <stop offset="45%" stopColor="#FF5C1B" />
          <stop offset="100%" stopColor="#D43E00" />
        </linearGradient>
      </defs>
      <path
        d="M 22,3.5 C 4,3.5 4,18 14,18 C 24,18 24,32.5 6,32.5"
        fill="none"
        stroke={`url(#sm${uid})`}
        strokeWidth="7.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
