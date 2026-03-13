'use client'

import { useId } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  iconOnly?: boolean
  stacked?: boolean
}

/**
 * Strefa Trenera — logo
 *
 * Mark: three diagonal bars at irregular heights (18 / 30 / 34 px).
 * Mark height = height of the full wordmark stack (name + slogan),
 * so the mark and text are visually the same size.
 * Slogan hidden at size="sm" (sidebar) to avoid crowding.
 *
 * Wordmark: "Strefa" #E8EAF0 800 · "Trenera" #FF5C1B 800
 * Slogan:   "Plany. Postęp. Wyniki."  #8A92A8 500
 */
export function Logo({
  size = 'md',
  className,
  iconOnly = false,
  stacked = false,
}: LogoProps) {
  const uid        = useId().replace(/:/g, '')
  const s          = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : size === 'xl' ? 1.6 : 1
  const showSlogan = size !== 'sm'
  const fS         = Math.round(19 * s)
  const sloganFS   = Math.round(9 * s)
  const innerGap   = Math.round(3 * s)          // gap between name and slogan
  const gap        = Math.round(11 * s)          // gap between mark and wordmark

  // Mark height = combined height of name + (gap + slogan) if shown,
  // or a comfortable fixed height at sm.
  const iH = showSlogan
    ? fS + innerGap + sloganFS
    : Math.round(24 * s)
  const iW = Math.round(iH * 38 / 34)

  const gId    = `g-${uid}`
  const clipId = `c-${uid}`

  const mark = (
    <svg
      width={iW}
      height={iH}
      viewBox="0 0 38 34"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="38" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B83200" />
          <stop offset="45%"  stopColor="#FF5C1B" />
          <stop offset="100%" stopColor="#FF8C50" />
        </linearGradient>
        <clipPath id={clipId}>
          <polygon points="0,34 7,34 12,16 5,16" />
          <polygon points="11,34 18,34 26,4 19,4" />
          <polygon points="22,34 29,34 38,0 31,0" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="38" height="34"
        fill={`url(#${gId})`}
        clipPath={`url(#${clipId})`}
      />
    </svg>
  )

  const wordmark = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: innerGap }}>
      <span style={{ lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap', display: 'block' }}>
        <span style={{ fontSize: fS, fontWeight: 800, color: '#E8EAF0' }}>Strefa</span>
        <span style={{ fontSize: fS, fontWeight: 800, color: '#FF5C1B' }}> Trenera</span>
      </span>
      {showSlogan && (
        <span style={{
          fontSize: sloganFS,
          fontWeight: 500,
          color: '#8A92A8',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          lineHeight: 1,
          display: 'block',
        }}>
          Plany. Postęp. Wyniki.
        </span>
      )}
    </div>
  )

  if (iconOnly) return mark

  if (stacked) {
    return (
      <div
        className={`inline-flex flex-col items-center ${className ?? ''}`}
        style={{ gap: Math.round(8 * s) }}
      >
        {mark}
        {wordmark}
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center ${className ?? ''}`}
      style={{ gap }}
    >
      {mark}
      {wordmark}
    </div>
  )
}

/** Standalone mark — for collapsed sidebar, favicons, etc. */
export function LogoMark({ size = 40 }: { size?: number }) {
  const uid    = useId().replace(/:/g, '')
  const gId    = `mg-${uid}`
  const clipId = `mc-${uid}`
  const h      = Math.round(size * 34 / 38)

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 38 34"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="38" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B83200" />
          <stop offset="45%"  stopColor="#FF5C1B" />
          <stop offset="100%" stopColor="#FF8C50" />
        </linearGradient>
        <clipPath id={clipId}>
          <polygon points="0,34 7,34 12,16 5,16" />
          <polygon points="11,34 18,34 26,4 19,4" />
          <polygon points="22,34 29,34 38,0 31,0" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="38" height="34"
        fill={`url(#${gId})`}
        clipPath={`url(#${clipId})`}
      />
    </svg>
  )
}
