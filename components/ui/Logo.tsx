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
 * Mark: geometric side-profile of a running shoe (heel left, toe right).
 * The silhouette is reduced to the essential: tall heel collar, arched instep,
 * deep cushioned midsole with a characteristic outsole notch, toe spring.
 * Two-tone split (upper lighter, midsole deeper) via a shared vertical gradient.
 * Subtle sole-separator line gives instant shoe readability at any size.
 *
 * Wordmark: "Strefa" white 800 · "Trenera" orange 800.
 * Flex align-items:center — shoe's visual mass sits ~48 % from top, aligning
 * naturally with cap-height text centre.
 */
export function Logo({
  size = 'md',
  className,
  iconOnly = false,
  stacked = false,
}: LogoProps) {
  const uid  = useId().replace(/:/g, '')
  const s    = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : size === 'xl' ? 1.8 : 1

  const iW  = Math.round(56 * s)
  const iH  = Math.round(34 * s)
  const fS  = Math.round(20 * s)
  const gap = Math.round(12 * s)

  const gFill   = `gf-${uid}`   // gradient for the filled shoe body
  const gUpper  = `gu-${uid}`   // lighter overlay for the upper
  const clipId  = `cl-${uid}`

  const mark = (
    <svg
      width={iW}
      height={iH}
      viewBox="0 0 56 34"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Main body gradient — darker at sole, lighter at heel collar & toe tip */}
        <linearGradient id={gFill} x1="0" y1="32" x2="56" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#8C2800" />
          <stop offset="35%"  stopColor="#E84E0A" />
          <stop offset="65%"  stopColor="#FF6A28" />
          <stop offset="100%" stopColor="#FFA060" />
        </linearGradient>

        {/* Lighter overlay for the upper zone (top portion of shoe) */}
        <linearGradient id={gUpper} x1="0" y1="22" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0)"   />
          <stop offset="100%" stopColor="rgba(255,255,255,0.18)"/>
        </linearGradient>

        {/* Clip to shoe outline so the overlay stays inside */}
        <clipPath id={clipId}>
          <path d="
            M 5,26
            C 1,26 0,23 0,20
            C 0,13 1,7 4,4
            C 6,2 10,1 14,3
            C 17,4 20,8 22,10
            C 25,8 30,5 37,6
            C 43,7 49,11 52,17
            C 54,20 54,24 52,27
            C 50,29 46,31 38,31
            C 28,32 16,31 10,29
            C 7,28 5,27 5,26 Z
          " />
        </clipPath>
      </defs>

      {/* ── Main shoe silhouette ── */}
      {/*
        Heel on LEFT (x≈0–6), toe on RIGHT (x≈52).
        Heel collar: tall (~y 2–4), instep dips to y≈10,
        saddle/lace area rises to y≈5–6, toe box curves down to y≈17,
        toe tip rounds at y≈27. Midsole bottom has characteristic
        outsole arch (concave notch y≈31–32 in the middle).
      */}
      <path
        d="
          M 5,26
          C 1,26 0,23 0,20
          C 0,13 1,7 4,4
          C 6,2 10,1 14,3
          C 17,4 20,8 22,10
          C 25,8 30,5 37,6
          C 43,7 49,11 52,17
          C 54,20 54,24 52,27
          C 50,29 46,31 38,31
          C 28,32 16,31 10,29
          C 7,28 5,27 5,26 Z
        "
        fill={`url(#${gFill})`}
      />

      {/* ── Upper highlight overlay (above sole-line) ── */}
      <rect
        x="0" y="0" width="56" height="21"
        fill={`url(#${gUpper})`}
        clipPath={`url(#${clipId})`}
      />

      {/* ── Sole separator — thin line between upper and midsole ── */}
      {/*
        The sole-separator runs from near the heel (~x 5, y 21)
        horizontally to the toe area (~x 50, y 21).
        Adds immediate shoe-readability at small sizes.
      */}
      <path
        d="M 5,21 C 14,20 28,20 38,21 C 43,21 48,21 50,21"
        stroke="rgba(0,0,0,0.20)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* ── Lace holes — 3 tiny dots across the instep ── */}
      {/*
        Minimal detail: 3 small filled circles in a row on the instep.
        Makes the upper unmistakably "shoe" at medium-large sizes.
        At small sizes they reduce to a subtle texture and are invisible.
      */}
      {[21, 27, 33].map((cx) => (
        <circle key={cx} cx={cx} cy={9} r={1.4} fill="rgba(0,0,0,0.18)" />
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

/** Standalone mark only — for collapsed sidebar, favicons, etc. */
export function LogoMark({ size = 40 }: { size?: number }) {
  const uid  = useId().replace(/:/g, '')
  const gF   = `mgf-${uid}`
  const gU   = `mgu-${uid}`
  const cl   = `mcl-${uid}`
  const h    = Math.round(size * 34 / 56)

  return (
    <svg width={size} height={h} viewBox="0 0 56 34" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gF} x1="0" y1="32" x2="56" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#8C2800" />
          <stop offset="35%"  stopColor="#E84E0A" />
          <stop offset="65%"  stopColor="#FF6A28" />
          <stop offset="100%" stopColor="#FFA060" />
        </linearGradient>
        <linearGradient id={gU} x1="0" y1="22" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0)"   />
          <stop offset="100%" stopColor="rgba(255,255,255,0.18)"/>
        </linearGradient>
        <clipPath id={cl}>
          <path d="M 5,26 C 1,26 0,23 0,20 C 0,13 1,7 4,4 C 6,2 10,1 14,3 C 17,4 20,8 22,10 C 25,8 30,5 37,6 C 43,7 49,11 52,17 C 54,20 54,24 52,27 C 50,29 46,31 38,31 C 28,32 16,31 10,29 C 7,28 5,27 5,26 Z" />
        </clipPath>
      </defs>
      <path d="M 5,26 C 1,26 0,23 0,20 C 0,13 1,7 4,4 C 6,2 10,1 14,3 C 17,4 20,8 22,10 C 25,8 30,5 37,6 C 43,7 49,11 52,17 C 54,20 54,24 52,27 C 50,29 46,31 38,31 C 28,32 16,31 10,29 C 7,28 5,27 5,26 Z" fill={`url(#${gF})`} />
      <rect x="0" y="0" width="56" height="21" fill={`url(#${gU})`} clipPath={`url(#${cl})`} />
      <path d="M 5,21 C 14,20 28,20 38,21 C 43,21 48,21 50,21" stroke="rgba(0,0,0,0.20)" strokeWidth="1" strokeLinecap="round" />
      {[21, 27, 33].map((cx) => <circle key={cx} cx={cx} cy={9} r={1.4} fill="rgba(0,0,0,0.18)" />)}
    </svg>
  )
}
