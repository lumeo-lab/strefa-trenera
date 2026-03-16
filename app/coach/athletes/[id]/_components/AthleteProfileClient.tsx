'use client'

import { useState } from 'react'
import { regenerateAthleteInviteLink } from '@/lib/actions/athletes'
import { CoachTopbar } from '@/components/coach/CoachTopbar'
import { Tabs } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { getBusinessToday } from '@/lib/date'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { NotesTab } from './tabs/NotesTab'
import { FeedbackTab } from './tabs/FeedbackTab'
import { RacesTab } from './tabs/RacesTab'
import { FinanceTab } from './tabs/FinanceTab'
import { DataTab } from './tabs/DataTab'
import { HistoryTab } from './tabs/HistoryTab'
import { PlanTab } from './tabs/PlanTab'
import { useCustomSessionTypes } from '@/lib/useCustomSessionTypes'
import type {
  CoachAthleteRow,
  CoachFeedbackRow,
  CoachInvoiceRow,
  CoachPackageRow,
  CoachRaceRow,
  CoachTrainingSessionRow,
  FeedbackByDateMap,
  FeedbackBySessionMap,
} from './types'

interface Props {
  athlete: CoachAthleteRow
  sessions: CoachTrainingSessionRow[]
  feedbacks: CoachFeedbackRow[]
  invoices: CoachInvoiceRow[]
  packages: CoachPackageRow[]
  races: CoachRaceRow[]
  unreadMessagesCount: number
}

export function AthleteProfileClient({ athlete, sessions: initialSessions, feedbacks: athleteFeedbacks, invoices: athleteInvoices, packages, races: initialRaces, unreadMessagesCount }: Props) {
  const [activeTab, setActiveTab] = useState('plan')

  // Feedback lookup
  const feedbackBySession: FeedbackBySessionMap = Object.fromEntries(
    athleteFeedbacks.filter(f => f.session_id).map(f => [f.session_id as string, f])
  )
  const feedbackByDate: FeedbackByDateMap = Object.fromEntries(
    athleteFeedbacks.map(f => [f.date, f])
  )

  // Date helpers
  const today = getBusinessToday()
  const currentMonth = today.slice(0, 7)

  // Session types
  const { all: allSessionTypes, custom: customSessionTypes } = useCustomSessionTypes()

  // Invite link
  const [linkCopied, setLinkCopied] = useState(false)
  const [regeneratingInvite, setRegeneratingInvite] = useState(false)
  const [inviteToken, setInviteToken] = useState<string>(athlete.invite_token)
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(athlete.invite_token_expires_at ?? null)
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/u/${athlete.slug}?t=${inviteToken}`
    : `/u/${athlete.slug}?t=${inviteToken}`

  const isInviteExpired = !inviteExpiresAt || new Date(inviteExpiresAt) <= new Date()
  const [inviteError, setInviteError] = useState<string | null>(null)

  async function doRegenerate(): Promise<string | null> {
    setInviteError(null)
    const result = await regenerateAthleteInviteLink(athlete.id)
    if (result && 'error' in result) {
      setInviteError(result.error ?? 'Nie udało się wygenerować linku')
      return null
    }
    if (result?.success && result.inviteToken) {
      setInviteToken(result.inviteToken)
      setInviteExpiresAt(result.inviteExpiresAt ?? null)
      setLinkCopied(false)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      return `${origin}/u/${result.slug}?t=${result.inviteToken}`
    }
    setInviteError('Nie udało się wygenerować linku')
    return null
  }

  async function copyInviteLink() {
    if (regeneratingInvite) return
    setRegeneratingInvite(true)
    try {
      let url = inviteUrl
      if (isInviteExpired) {
        const freshUrl = await doRegenerate()
        if (!freshUrl) return
        url = freshUrl
      }
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      setInviteError('Nie udało się skopiować — skopiuj ręcznie z pola powyżej')
    } finally {
      setRegeneratingInvite(false)
    }
  }

  async function handleRegenerateInvite() {
    if (regeneratingInvite) return
    setRegeneratingInvite(true)
    try {
      await doRegenerate()
    } finally {
      setRegeneratingInvite(false)
    }
  }

  const unreadFeedbackCount = athleteFeedbacks.filter(f => !f.read).length

  const tabs = [
    { id: 'plan', label: 'Plan' },
    { id: 'history', label: 'Historia' },
    { id: 'feedback', label: unreadFeedbackCount > 0 ? `Feedback (${unreadFeedbackCount})` : 'Feedback' },
    { id: 'races', label: 'Zawody' },
    { id: 'notes', label: 'Notatki' },
    { id: 'data', label: 'Dane' },
    { id: 'finance', label: 'Finanse' },
  ]

  const completedSessions = initialSessions.filter(s => s.completed && s.actual_distance)
  const totalKm = completedSessions.reduce((sum, s) => sum + (s.actual_distance || 0), 0)

  return (
    <div>
      <CoachTopbar
        title={athlete.name}
        subtitle={[athlete.goal, athlete.package].filter(Boolean).join(' · ')}
        actions={
          <Link href="/coach/athletes" className="text-sm hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← Zawodnicy
          </Link>
        }
      />

      <div className="p-6">
        {/* Profile header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-5">
            <Avatar initials={athlete.avatar} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{athlete.name}</h2>
                <Badge variant="gray">
                  {athlete.package} — {formatCurrency(athlete.package_price)}/mies.
                </Badge>
                <Link href={`/coach/chat?athlete=${athlete.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ml-auto shrink-0 transition-colors"
                  style={{ background: 'rgba(255,92,27,0.1)', color: '#FF5C1B' }}>
                  💬 Chat
                  {unreadMessagesCount > 0 && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FF5C1B', color: 'white', lineHeight: 1 }}>
                      {unreadMessagesCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
                {athlete.goal && <span>🎯 {athlete.goal}</span>}
                {athlete.city && <span>📍 {athlete.city}</span>}
                {athlete.age && <span>🎂 {athlete.age} lat</span>}
                <span>📅 Od {formatDate(athlete.join_date, { month: 'long', year: 'numeric' })}</span>
                {totalKm > 0 && <span>🏃 {totalKm.toFixed(0)} km łącznie</span>}
              </div>
            </div>
          </div>

          {/* Invite link */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>🔗 Link zaproszenia dla zawodnika</div>
            {inviteExpiresAt && (
              <div className="text-xs mb-2" style={{ color: isInviteExpired ? '#E74C3C' : 'var(--text-muted)' }}>
                {isInviteExpired
                  ? 'Link wygasł — kliknij „Kopiuj" lub „Nowy link" aby wygenerować nowy'
                  : `Ważny do ${formatDate(inviteExpiresAt, { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </div>
            )}
            {inviteError && (
              <div className="text-xs mb-2" style={{ color: '#E74C3C' }}>{inviteError}</div>
            )}
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl text-xs font-mono truncate select-all" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {inviteUrl}
              </code>
              <button
                onClick={copyInviteLink}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                style={{ background: linkCopied ? 'rgba(46,204,113,0.15)' : 'rgba(255,92,27,0.1)', color: linkCopied ? '#2ECC71' : '#FF5C1B' }}
              >
                {linkCopied ? '✓ Skopiowano' : '📋 Kopiuj'}
              </button>
              <button
                onClick={handleRegenerateInvite}
                disabled={regeneratingInvite}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-60"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}
              >
                {regeneratingInvite ? 'Generuję…' : 'Nowy link'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Cześć! Oto Twój panel treningowy: ${inviteUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}
              >
                WhatsApp
              </a>
              <a
                href={`mailto:${athlete.email || ''}?subject=${encodeURIComponent('Twój panel treningowy')}&body=${encodeURIComponent(`Cześć ${athlete.name}!\n\nTutaj znajdziesz swój panel treningowy:\n${inviteUrl}`)}`}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}
              >
                Email
              </a>
            </div>
          </div>
        </Card>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

        {activeTab === 'plan' && (
          <PlanTab
            athleteId={athlete.id}
            sessions={initialSessions}
            feedbackByDate={feedbackByDate}
            today={today}
            currentMonth={currentMonth}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            sessions={initialSessions}
            feedbacks={athleteFeedbacks}
            feedbackBySession={feedbackBySession}
            feedbackByDate={feedbackByDate}
            today={today}
            currentMonth={currentMonth}
            allSessionTypes={allSessionTypes}
            customSessionTypes={customSessionTypes}
          />
        )}

        {activeTab === 'feedback' && (
          <FeedbackTab athleteId={athlete.id} feedbacks={athleteFeedbacks} />
        )}

        {activeTab === 'races' && (
          <RacesTab athleteId={athlete.id} races={initialRaces} today={today} />
        )}

        {activeTab === 'notes' && (
          <NotesTab athleteId={athlete.id} initialNotes={athlete.coach_notes ?? ''} />
        )}

        {activeTab === 'data' && (
          <DataTab athlete={athlete} packages={packages} />
        )}

        {activeTab === 'finance' && (
          <FinanceTab athleteId={athlete.id} athletePackage={athlete.package} invoices={athleteInvoices} />
        )}
      </div>
    </div>
  )
}
