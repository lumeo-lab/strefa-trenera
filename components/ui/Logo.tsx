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
 * Mark: three bold diagonal parallelogram stripes leaning right (/).
 * A single horizontal gradient sweeps across all three stripes as one
 * object — burnt orange (#CC3A00) → brand orange (#FF5C1B) → peach (#FF8A50).
 * Stripes share the same angle, width and spacing, forming a tight sport mark
 * instantly readable at any size from 22 px (collapsed sidebar) to full-page hero.
 *
 * Wordmark: "Strefa" white 800 · "Trenera" orange 800.
 */
export function Logo({
  size = 'md',
  className,
  iconOnly = false,
  stacked = false,
}: LogoProps) {
  const uid    = useId().replace(/:/g, '')
  const s      = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : size === 'xl' ? 1.8 : 1
  const iW     = Math.round(41 * s)
  const iH     = Math.round(34 * s)
  const fS     = Math.round(20 * s)
  const gap    = Math.round(12 * s)
  const gId    = `g-${uid}`
  const clipId = `c-${uid}`

  const mark = (
    <svg
      width={iW}
      height={iH}
      viewBox="0 0 41 34"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Horizontal gradient sweeps left-to-right across the full mark width */}
        <linearGradient id={gId} x1="0" y1="0" x2="41" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#CC3A00" />
          <stop offset="50%"  stopColor="#FF5C1B" />
          <stop offset="100%" stopColor="#FF8A50" />
        </linearGradient>

        {/*
          Three right-leaning parallelogram stripes (/).
          Each stripe: width=7, tilt-offset=10 (top shifts 10 px right vs bottom).
          Gap between stripes at baseline = 5 px.
          Stripe 1 bottom-left x=0, Stripe 2 x=12, Stripe 3 x=24.
        */}
        <clipPath id={clipId}>
          <polygon points="0,34 7,34 17,0 10,0" />
          <polygon points="12,34 19,34 29,0 22,0" />
          <polygon points="24,34 31,34 41,0 34,0" />
        </clipPath>
      </defs>

      {/* Single gradient rect clipped to the three stripes */}
      <rect x="0" y="0" width="41" height="34" fill={`url(#${gId})`} clipPath={`url(#${clipId})`} />
    </svg>
  )

  const wordmark = (
    <span style={{ lineHeight: 1.05, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: fS, fontWeight: 800, color: '#E8EAF0' }}>Strefa</span>
      <span style={{ fontSize: fS, fontWeight: 800, color: '#FF5C1B' }}> Trenera</span>
    </span>
  )

  if (iconOnly) return mark

  if (stacked) {
    return (
      <div
        className={`inline-flex flex-col items-center ${className ?? ''}`}
        style={{ gap: Math.round(9 * s) }}
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
  const h      = Math.round(size * 34 / 41)

  return (
    <svg width={size} height={h} viewBox="0 0 41 34" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="41" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#CC3A00" />
          <stop offset="50%"  stopColor="#FF5C1B" />
          <stop offset="100%" stopColor="#FF8A50" />
        </linearGradient>
        <clipPath id={clipId}>
          <polygon points="0,34 7,34 17,0 10,0" />
          <polygon points="12,34 19,34 29,0 22,0" />
          <polygon points="24,34 31,34 41,0 34,0" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="41" height="34" fill={`url(#${gId})`} clipPath={`url(#${clipId})`} />
    </svg>
  )
}
