'use client'
import { useState } from 'react'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { crmCards as initialCards } from '@/lib/data'
import { CrmCard, CrmStatus } from '@/lib/types'
import { formatDate, formatCurrency } from '@/lib/utils'

const COLUMNS: { id: CrmStatus; label: string; color: string }[] = [
  { id: 'inquiry', label: 'Zapytanie', color: '#8A92A8' },
  { id: 'conversation', label: 'Rozmowa', color: '#3498DB' },
  { id: 'offer', label: 'Oferta', color: '#9B59B6' },
  { id: 'onboarding', label: 'Onboarding', color: '#F39C12' },
  { id: 'active', label: 'Aktywny', color: '#2ECC71' },
  { id: 'ended', label: 'Zakończony', color: '#E74C3C' },
]

export default function CrmPage() {
  const [cards, setCards] = useState(initialCards)
  const [dragId, setDragId] = useState<string | null>(null)

  function handleDragStart(id: string) {
    setDragId(id)
  }

  function handleDrop(status: CrmStatus) {
    if (!dragId) return
    setCards(prev => prev.map(c => c.id === dragId ? { ...c, status } : c))
    setDragId(null)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  return (
    <div>
      <CoachTopbar title="CRM — Pipeline klientów" subtitle={`${cards.filter(c => c.status === 'active').length} aktywnych zawodników`} />

      <div className="p-6">
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 140px)' }}>
          {COLUMNS.map(col => {
            const colCards = cards.filter(c => c.status === col.id)
            return (
              <div
                key={col.id}
                className="flex-shrink-0 w-64 rounded-2xl p-3"
                style={{ background: '#161920', border: '1px solid rgba(255,255,255,0.07)' }}
                onDrop={() => handleDrop(col.id)}
                onDragOver={handleDragOver}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: '#8A92A8' }}>
                    {colCards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {colCards.map(card => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => handleDragStart(card.id)}
                      className="p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:border-white/15"
                      style={{
                        background: '#1E2330',
                        border: '1px solid rgba(255,255,255,0.07)',
                        opacity: dragId === card.id ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: `${col.color}40`, color: col.color }}>
                          {card.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{card.name}</div>
                          <div className="text-xs truncate" style={{ color: '#8A92A8' }}>{card.source}</div>
                        </div>
                      </div>
                      <div className="text-xs mb-1.5" style={{ color: '#8A92A8' }}>🎯 {card.interest}</div>
                      {card.value && (
                        <div className="text-xs font-semibold" style={{ color: '#FF5C1B' }}>{formatCurrency(card.value)}/mies.</div>
                      )}
                      {card.notes && (
                        <div className="text-xs mt-2 line-clamp-2" style={{ color: '#8A92A8' }}>{card.notes}</div>
                      )}
                      <div className="text-xs mt-2" style={{ color: '#8A92A8' }}>{formatDate(card.createdAt, { day: 'numeric', month: 'short' })}</div>
                    </div>
                  ))}

                  {colCards.length === 0 && (
                    <div className="text-center py-6 text-xs" style={{ color: 'rgba(138,146,168,0.5)' }}>Przeciągnij tu kartę</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
