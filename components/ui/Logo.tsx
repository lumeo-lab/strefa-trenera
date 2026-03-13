'use client'

import { useId } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  textColor?: string
  className?: string
  iconOnly?: boolean
  stacked?: boolean
}

/**
 * Strefa Trenera logo
 *
 * Mark: three concentric arcs — the bend of a running track (3 racing lanes).
 * The concentric rings also visualise "Strefa" (zone) — like HRZ zones 1-3.
 * Gradient: deep orange-red at the base → vivid orange → warm light-orange at peaks.
 *
 * Wordmark: "Strefa" (700) + "Trenera" (300) — heavy/light contrast, tight tracking.
 */
export function Logo({
  size = 'md',
  textColor = '#E8EAF0',
  className,
  iconOnly = false,
  stacked = false,
}: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const s = size === 'sm' ? 0.72 : size === 'lg' ? 1.22 : size === 'xl' ? 1.75 : 1

  // icon natural size: 52 × 30 px (landscape — the track bend shape)
  const iW = Math.round(52 * s)
  const iH = Math.round(30 * s)
  const fS = Math.round(19 * s)
  const gap = Math.round(11 * s)

  const gradId = `tg-${uid}`

  const mark = (
    <svg
      width={iW}
      height={iH}
      viewBox="-3 -1 58 32"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/*
          Gradient runs from bottom-left (deep red-orange) to top-right (warm peach).
          Because all arcs share the same coordinate space, the gradient flows
          naturally across all three: darkest where arcs emerge from the ground,
          lightest at the peak — exactly like race-track lane markings lit from above.
        */}
        <linearGradient id={gradId} x1="0" y1="32" x2="48" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#C73E00" />
          <stop offset="38%"  stopColor="#FF5C1B" />
          <stop offset="75%"  stopColor="#FF7E3F" />
          <stop offset="100%" stopColor="#FFBA8A" />
        </linearGradient>
      </defs>

      {/* ── Outer lane (longest arc, lightest at peak) ── */}
      <path
        d="M 0,32 A 24 24 0 0 1 48,32"
        stroke={`url(#${gradId})`}
        strokeWidth="6.5"
        strokeLinecap="butt"
      />

      {/* ── Middle lane ── */}
      <path
        d="M 8,32 A 16 16 0 0 1 40,32"
        stroke={`url(#${gradId})`}
        strokeWidth="6.5"
        strokeLinecap="butt"
      />

      {/* ── Inner lane (shortest arc, most intense colour) ── */}
      <path
        d="M 16,32 A 8 8 0 0 1 32,32"
        stroke={`url(#${gradId})`}
        strokeWidth="6.5"
        strokeLinecap="butt"
      />
    </svg>
  )

  const wordmark = (
    <span
      style={{
        color: textColor,
        lineHeight: 1,
        letterSpacing: '-0.025em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: fS, fontWeight: 800 }}>Strefa</span>
      <span style={{ fontSize: fS, fontWeight: 300, letterSpacing: '0.01em' }}> Trenera</span>
    </span>
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

/** Standalone mark — just the 3 arcs, no wordmark. For collapsed sidebar, favicons etc. */
export function LogoMark({ size = 36 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `mg-${uid}`
  const h = Math.round(size * 30 / 52)
  return (
    <svg
      width={size}
      height={h}
      viewBox="-3 -1 58 32"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="32" x2="48" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#C73E00" />
          <stop offset="38%"  stopColor="#FF5C1B" />
          <stop offset="75%"  stopColor="#FF7E3F" />
          <stop offset="100%" stopColor="#FFBA8A" />
        </linearGradient>
      </defs>
      <path d="M 0,32 A 24 24 0 0 1 48,32" stroke={`url(#${gradId})`} strokeWidth="6.5" strokeLinecap="butt"/>
      <path d="M 8,32 A 16 16 0 0 1 40,32" stroke={`url(#${gradId})`} strokeWidth="6.5" strokeLinecap="butt"/>
      <path d="M 16,32 A 8 8 0 0 1 32,32" stroke={`url(#${gradId})`} strokeWidth="6.5" strokeLinecap="butt"/>
    </svg>
  )
}
