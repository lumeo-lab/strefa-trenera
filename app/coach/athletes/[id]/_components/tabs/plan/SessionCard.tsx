'use client'

import React from 'react'
import type { CoachTrainingSessionRow } from '../../types'

interface SessionCardProps {
  session: CoachTrainingSessionRow
  density: 'full' | 'compact'
  typeStyle: React.CSSProperties
  completionStyle: React.CSSProperties
  isDragging: boolean
  typeLabel?: string
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}

export const SessionCard = React.memo(function SessionCard({
  session,
  density,
  typeStyle,
  completionStyle,
  isDragging,
  typeLabel,
  onClick,
  onDragStart,
  onDragEnd,
}: SessionCardProps) {
  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="relative p-2 rounded-xl cursor-pointer hover:opacity-80"
      style={{
        ...typeStyle,
        ...completionStyle,
        opacity: isDragging ? 0.55 : 1,
        transition: 'transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease',
        boxShadow: isDragging ? '0 10px 24px rgba(15,23,42,0.16)' : 'none',
      }}
    >
      {session.completed && (
        <span className="absolute top-1.5 right-1.5 text-[10px] leading-none" style={{ color: '#2ECC71' }}>✓</span>
      )}
      {typeLabel && (
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-70">{typeLabel}</div>
      )}
      <div className="font-semibold text-xs leading-tight mb-1">{session.title}</div>
      {density === 'full' && session.description && (
        <div className="text-xs opacity-60 leading-tight mb-1">{session.description}</div>
      )}
      <div className="flex flex-col gap-0.5 text-xs opacity-75">
        {session.planned_distance && <span>📏 {session.planned_distance} km</span>}
        {session.planned_duration && <span>⏱ {session.planned_duration} min</span>}
        {session.planned_pace && <span>⚡ {session.planned_pace}/km</span>}
      </div>
      {density === 'full' && session.actual_distance && (
        <div className="flex flex-col gap-0.5 text-xs mt-1" style={{ color: 'rgba(46,204,113,0.9)' }}>
          <span>✓ {session.actual_distance} km</span>
          {session.actual_pace && <span>{session.actual_pace}/km</span>}
        </div>
      )}
      {density === 'full' && session.url && (
        <a
          href={session.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 mt-1.5 text-xs opacity-80 hover:opacity-100"
        >
          🔗 <span className="underline">{session.url_label || 'Link'}</span>
        </a>
      )}
    </div>
  )
})
