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
 * Mark: a geometric running figure mid-stride (float phase — both feet off ground).
 *   • Bold body stroke (thicker) anchors the composition
 *   • Front leg reaches forward, back leg kicks up — maximum dynamism
 *   • Three motion lines on the left balance the composition and signal speed
 *   • Single diagonal gradient: deep red-orange (ground/effort) → warm peach (air/peak)
 *
 * Wordmark: "Strefa" (white 800) + "Trenera" (orange 800) — two-colour, sharp, modern.
 *
 * Centering: figure's visual centre of mass sits at ~48% of SVG height,
 * so `align-items:center` lines it up naturally with cap-height text.
 */
export function Logo({
  size = 'md',
  className,
  iconOnly = false,
  stacked = false,
}: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const s   = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : size === 'xl' ? 1.8 : 1

  const iW  = Math.round(38 * s)   // mark natural width
  const iH  = Math.round(40 * s)   // mark natural height
  const fS  = Math.round(20 * s)
  const gap = Math.round(10 * s)
  const gId = `rg-${uid}`

  const mark = (
    <svg
      width={iW}
      height={iH}
      viewBox="0 0 38 40"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Diagonal gradient: bottom-left = deep effort, top-right = peak/air */}
        <linearGradient id={gId} x1="0" y1="40" x2="38" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A83000" />
          <stop offset="45%"  stopColor="#FF5C1B" />
          <stop offset="80%"  stopColor="#FF7C40" />
          <stop offset="100%" stopColor="#FFAA70" />
        </linearGradient>
      </defs>

      {/* ── Motion lines (left side, progressively fading) ── */}
      <line x1="0" y1="16" x2="9"  y2="16" stroke={`url(#${gId})`} strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>
      <line x1="0" y1="22" x2="11" y2="22" stroke={`url(#${gId})`} strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
      <line x1="0" y1="28" x2="9"  y2="28" stroke={`url(#${gId})`} strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>

      {/* ── Head ── */}
      <circle cx="24" cy="5.5" r="4.5" fill={`url(#${gId})`} />

      {/* ── Body (lean forward — ~20° off vertical) ── */}
      <line
        x1="24" y1="10"
        x2="27" y2="23"
        stroke={`url(#${gId})`} strokeWidth="4.5" strokeLinecap="round"
      />

      {/* ── Front leg — reaching forward ── */}
      <line
        x1="27" y1="23"
        x2="36" y2="38"
        stroke={`url(#${gId})`} strokeWidth="3" strokeLinecap="round"
      />

      {/* ── Back leg — kicked high behind ── */}
      <line
        x1="27" y1="23"
        x2="16" y2="13"
        stroke={`url(#${gId})`} strokeWidth="3" strokeLinecap="round"
      />

      {/* ── Front arm — swinging forward-up ── */}
      <line
        x1="25" y1="15"
        x2="34" y2="9"
        stroke={`url(#${gId})`} strokeWidth="2.5" strokeLinecap="round"
      />

      {/* ── Back arm — swinging back ── */}
      <line
        x1="25" y1="15"
        x2="16" y2="20"
        stroke={`url(#${gId})`} strokeWidth="2" strokeLinecap="round" opacity="0.7"
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
export function LogoMark({ size = 36 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  const gId = `mgr-${uid}`
  const h   = Math.round(size * 40 / 38)

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 38 40"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="40" x2="38" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A83000" />
          <stop offset="45%"  stopColor="#FF5C1B" />
          <stop offset="80%"  stopColor="#FF7C40" />
          <stop offset="100%" stopColor="#FFAA70" />
        </linearGradient>
      </defs>

      <line x1="0" y1="16" x2="9"  y2="16" stroke={`url(#${gId})`} strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>
      <line x1="0" y1="22" x2="11" y2="22" stroke={`url(#${gId})`} strokeWidth="2.5" strokeLinecap="round" opacity="0.55"/>
      <line x1="0" y1="28" x2="9"  y2="28" stroke={`url(#${gId})`} strokeWidth="2.5" strokeLinecap="round" opacity="0.35"/>

      <circle cx="24" cy="5.5" r="4.5" fill={`url(#${gId})`} />
      <line x1="24" y1="10" x2="27" y2="23" stroke={`url(#${gId})`} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="27" y1="23" x2="36" y2="38" stroke={`url(#${gId})`} strokeWidth="3"   strokeLinecap="round"/>
      <line x1="27" y1="23" x2="16" y2="13" stroke={`url(#${gId})`} strokeWidth="3"   strokeLinecap="round"/>
      <line x1="25" y1="15" x2="34" y2="9"  stroke={`url(#${gId})`} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="25" y1="15" x2="16" y2="20" stroke={`url(#${gId})`} strokeWidth="2"   strokeLinecap="round" opacity="0.7"/>
    </svg>
  )
}
