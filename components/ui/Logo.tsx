'use client'

import { useId } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  iconOnly?: boolean
  stacked?: boolean
}

/**
 * Strefa Trenera logo
 *
 * Mark  — 5 vertical bars, bottom-aligned, each representing one training day
 *         in a classic weekly plan: Easy · Intervals · Recovery · Tempo · Long run.
 *         Heights deliberately irregular — a real coach's weekly load signature,
 *         not a generic growing bar chart.
 *         Gradient: deep red-orange at base → vivid orange mid → warm peach at tips.
 *
 * Wordmark — "Strefa" white-primary · "Trenera" orange — the two-colour treatment
 *             that makes the name memorable at a glance.
 */
export function Logo({
  size = 'md',
  className,
  iconOnly = false,
  stacked = false,
}: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const s = size === 'sm' ? 0.72 : size === 'lg' ? 1.22 : size === 'xl' ? 1.72 : 1

  const iW = Math.round(44 * s)
  const iH = Math.round(40 * s)
  const fS = Math.round(20 * s)
  const gap = Math.round(11 * s)
  const gId = `g-${uid}`

  // bar layout: [x, height] — bottom anchored at y=40
  // week signature: Easy(20) · Intervals(38) · Recovery(14) · Tempo(32) · LongRun(28)
  const bars: [number, number, number][] = [
    [0,  20, 0.55],   // Mon — easy run        → mid-low, softer colour
    [9,  38, 1.00],   // Tue — intervals        → tallest, most intense colour
    [18, 14, 0.35],   // Wed — recovery         → shortest, palest
    [27, 32, 0.88],   // Thu — tempo            → near-tall, vivid
    [36, 28, 0.72],   // Fri — long run         → medium-tall
  ]

  const mark = (
    <svg
      width={iW}
      height={iH}
      viewBox="-1 -1 46 42"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/*
          Shared vertical gradient — same y-space for all bars.
          Shorter bars (rest/easy) will show only the bottom (darker) portion;
          taller bars (intervals) reach up into the lighter peach at the tips.
          This naturally encodes intensity: hard days look brightest at the top.
        */}
        <linearGradient id={gId} x1="0" y1="40" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A83200" />
          <stop offset="40%"  stopColor="#FF5C1B" />
          <stop offset="78%"  stopColor="#FF7E3F" />
          <stop offset="100%" stopColor="#FFBB90" />
        </linearGradient>
      </defs>

      {bars.map(([x, h], i) => (
        <rect
          key={i}
          x={x}
          y={40 - h}
          width={6}
          height={h}
          rx={3}
          fill={`url(#${gId})`}
          opacity={bars[i][2]}
        />
      ))}
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

/** Just the bars — for collapsed sidebar, favicons, etc. */
export function LogoMark({ size = 36 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  const gId = `gm-${uid}`
  const h = Math.round(size * 40 / 44)

  const bars: [number, number, number][] = [
    [0,  20, 0.55],
    [9,  38, 1.00],
    [18, 14, 0.35],
    [27, 32, 0.88],
    [36, 28, 0.72],
  ]

  return (
    <svg
      width={size}
      height={h}
      viewBox="-1 -1 46 42"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="40" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A83200" />
          <stop offset="40%"  stopColor="#FF5C1B" />
          <stop offset="78%"  stopColor="#FF7E3F" />
          <stop offset="100%" stopColor="#FFBB90" />
        </linearGradient>
      </defs>
      {bars.map(([x, bh, op], i) => (
        <rect key={i} x={x} y={40 - bh} width={6} height={bh} rx={3} fill={`url(#${gId})`} opacity={op} />
      ))}
    </svg>
  )
}
