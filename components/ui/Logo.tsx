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
 * Mark: three diagonal bars at irregular heights (18 / 30 / 34 px),
 * suggesting a training-load chart.  All three are clipped to one
 * horizontal gradient so they read as a single cohesive mark.
 * Bars tilt ~16° right; height jumps (+12 / +4) feel data-driven,
 * not mechanical.
 *
 * Wordmark: "Strefa" #E8EAF0 800 · "Trenera" #FF5C1B 800.
 */
export function Logo({
  size = 'md',
  className,
  iconOnly = false,
  stacked = false,
}: LogoProps) {
  const uid    = useId().replace(/:/g, '')
  const s      = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : size === 'xl' ? 1.6 : 1
  const iW     = Math.round(38 * s)
  const iH     = Math.round(34 * s)
  const fS     = Math.round(19 * s)
  const gap    = Math.round(11 * s)
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
        {/* Gradient runs full mark width — left bar darkest, right bar lightest */}
        <linearGradient id={gId} x1="0" y1="0" x2="38" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B83200" />
          <stop offset="45%"  stopColor="#FF5C1B" />
          <stop offset="100%" stopColor="#FF8C50" />
        </linearGradient>

        {/*
          Three right-leaning (/) parallelogram bars.
          Bar widths = 7 px each, gaps = 4 px, tilt proportional to height.
          Heights: 18 / 30 / 34 — intentionally irregular (jumps +12 / +4).

          Tilt per bar = 9 * h / 34  (full-height bar shifts 9 px right).

          Bar 1  h=18  tilt≈5  → (0,34)(7,34)(12,16)(5,16)
          Bar 2  h=30  tilt≈8  → (11,34)(18,34)(26,4)(19,4)
          Bar 3  h=34  tilt=9  → (22,34)(29,34)(38,0)(31,0)
        */}
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
