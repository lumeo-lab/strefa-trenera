'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createFeedback, updateFeedback } from '@/lib/actions/feedback'
import type { AthleteFeedbackRow } from '@/lib/athlete-data'
import { VoiceRecorder } from './VoiceRecorder'
import { parseFeedbackTranscript } from '@/lib/utils'
import { INPUT_STYLE } from '@/lib/styles'

const FEELINGS = [
  { emoji: '😫', label: 'Fatalnie' },
  { emoji: '😕', label: 'Słabo' },
  { emoji: '😐', label: 'Średnio' },
  { emoji: '😊', label: 'Dobrze' },
  { emoji: '🤩', label: 'Świetnie' },
]

export interface FeedbackData {
  feeling?: string
  rpe?: string
  painFlag?: boolean
  painNote?: string
  distanceKm?: string
  durationMin?: string
  notes?: string
  voiceTranscript?: string
  watchLink?: string
}

export function dbRowToFeedback(fb: AthleteFeedbackRow): FeedbackData {
  const parsed = parseFeedbackTranscript(fb.transcript ?? '')
  return {
    feeling: fb.feeling || parsed.feeling || undefined,
    rpe: fb.rpe ? String(fb.rpe) : (parsed.rpe ? parsed.rpe.replace('/10', '') : undefined),
    painFlag: fb.pain_flag || !!parsed.pain,
    painNote: fb.pain_note || (parsed.pain && parsed.pain !== 'Tak' ? parsed.pain : undefined),
    distanceKm: parsed.distance ? parsed.distance.replace(' km', '') : undefined,
    durationMin: parsed.duration ? parsed.duration.replace(' min', '') : undefined,
    notes: fb.notes_structured || parsed.notes || undefined,
    voiceTranscript: fb.voice_transcript || parsed.voice || undefined,
    watchLink: fb.watch_link || undefined,
  }
}

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  feedbackType: 'text' | 'voice'
  sessionId: string | null
  slug: string
  date: string
  existingTextFeedback: AthleteFeedbackRow | null
  existingVoiceFeedback: AthleteFeedbackRow | null
  initialData: FeedbackData | null
  onSubmitted: (feedbackData: FeedbackData, type: 'text' | 'voice') => void
}

export function FeedbackModal({
  open, onClose, feedbackType, sessionId, slug, date,
  existingTextFeedback, existingVoiceFeedback, initialData, onSubmitted,
}: FeedbackModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [feeling, setFeeling] = useState(initialData?.feeling ?? '')
  const [rpe, setRpe] = useState(initialData?.rpe ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  // Extended fields — collapsed by default
  const hasExtendedData = !!(initialData?.painFlag || initialData?.distanceKm || initialData?.durationMin || initialData?.watchLink)
  const [showMore, setShowMore] = useState(hasExtendedData)
  const [painFlag, setPainFlag] = useState(initialData?.painFlag ?? false)
  const [painNote, setPainNote] = useState(initialData?.painNote ?? '')
  const [distanceKm, setDistanceKm] = useState(initialData?.distanceKm ?? '')
  const [durationMin, setDurationMin] = useState(initialData?.durationMin ?? '')
  const [watchLink, setWatchLink] = useState(initialData?.watchLink ?? '')
  const [voiceTranscript, setVoiceTranscript] = useState(initialData?.voiceTranscript ?? '')

  async function submitFeedback() {
    if (submitting) return
    setSubmitting(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const fd = new FormData()
      fd.set('slug', slug)
      fd.set('date', date)
      if (sessionId) fd.set('session_id', sessionId)

      if (feedbackType === 'text') {
        fd.set('feeling', feeling)
        fd.set('rpe', rpe)
        fd.set('pain_flag', painFlag ? 'true' : 'false')
        fd.set('pain_note', painFlag ? painNote : '')
        fd.set('distance_km', distanceKm)
        fd.set('duration_min', durationMin)
        fd.set('notes', notes)
        fd.set('watch_link', watchLink)
        fd.set('voice_transcript', '')
      } else {
        fd.set('feeling', '')
        fd.set('rpe', '')
        fd.set('pain_flag', 'false')
        fd.set('pain_note', '')
        fd.set('distance_km', '')
        fd.set('duration_min', '')
        fd.set('notes', '')
        fd.set('watch_link', '')
        fd.set('voice_transcript', voiceTranscript)
      }

      let result
      const existingId = feedbackType === 'text' ? existingTextFeedback?.id : existingVoiceFeedback?.id
      if (existingId) {
        fd.set('id', existingId)
        result = await updateFeedback(fd)
      } else {
        result = await createFeedback(fd)
      }

      if (result && 'error' in result) {
        setSaveError(result.error ?? 'Nie udało się zapisać feedbacku.')
        return
      }

      setSaveSuccess(true)

      // Auto-close after short delay
      setTimeout(() => {
        if (feedbackType === 'text') {
          onSubmitted({ feeling, rpe, painFlag, painNote, distanceKm, durationMin, notes, watchLink: watchLink || undefined }, 'text')
        } else {
          onSubmitted({ voiceTranscript: voiceTranscript || undefined }, 'voice')
        }
      }, 800)
    } finally {
      setSubmitting(false)
    }
  }

  const canSaveText = !!(feeling || rpe || painFlag || distanceKm || durationMin || notes.trim() || watchLink.trim())
  const canSaveVoice = !!(voiceTranscript.trim())
  const isEditing = !!(feedbackType === 'text' ? existingTextFeedback : existingVoiceFeedback)

  const modalFooter = (
    <div>
      {saveError && (
        <p role="alert" className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {saveError}
        </p>
      )}
      {saveSuccess && (
        <p className="text-xs mb-3 px-3 py-2 rounded-lg font-medium" style={{ color: '#2ECC71', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)' }}>
          ✓ Zapisano
        </p>
      )}
      <button
        className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        onClick={submitFeedback}
        disabled={(feedbackType === 'text' ? !canSaveText : !canSaveVoice) || submitting || saveSuccess}
        style={{ background: '#FF5C1B', color: '#fff', border: 'none' }}
      >
        {submitting ? 'Zapisywanie...' : saveSuccess ? '✓ Zapisano' : isEditing ? 'Zaktualizuj' : 'Zapisz feedback'}
      </button>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose}
      title={feedbackType === 'text'
        ? (isEditing ? 'Edytuj feedback' : 'Jak poszedł trening?')
        : (isEditing ? 'Edytuj komentarz głosowy' : 'Komentarz głosowy')}
      size="sm" footer={modalFooter}>
      <div className="space-y-4">
        {feedbackType === 'text' && (
          <>
            {/* === QUICK SECTION (always visible) === */}

            {/* Feeling */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Samopoczucie</label>
              <div className="flex gap-1.5">
                {FEELINGS.map(f => (
                  <button key={f.emoji} onClick={() => setFeeling(feeling === f.emoji ? '' : f.emoji)}
                    className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: feeling === f.emoji ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                      border: feeling === f.emoji ? '1px solid rgba(255,92,27,0.5)' : '1px solid transparent',
                      color: feeling === f.emoji ? '#FF5C1B' : 'var(--text-muted)',
                    }}>
                    <span className="text-2xl">{f.emoji}</span>
                    <span style={{ fontSize: '10px' }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* RPE */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Jak ciężki był trening? (RPE)</label>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 10 }, (_, i) => String(i + 1)).map(value => (
                  <button key={value} onClick={() => setRpe(rpe === value ? '' : value)}
                    className="py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                    style={{
                      background: rpe === value ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                      border: rpe === value ? '1px solid rgba(255,92,27,0.5)' : '1px solid transparent',
                      color: rpe === value ? '#FF5C1B' : 'var(--text-muted)',
                    }}>
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                <span>Bardzo łatwy</span>
                <span>Maksymalny</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Komentarz</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Krótko — jak poszło?"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" style={INPUT_STYLE} />
            </div>

            {/* === EXTENDED SECTION (collapsed by default) === */}

            {!showMore ? (
              <button onClick={() => setShowMore(true)}
                className="w-full py-2 text-xs font-medium cursor-pointer rounded-xl transition-all"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: 'none' }}>
                Więcej szczegółów ↓
              </button>
            ) : (
              <div className="space-y-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Szczegóły (opcjonalnie)</div>

                {/* Distance + Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Dystans (km)</label>
                    <input type="number" value={distanceKm} onChange={e => setDistanceKm(e.target.value)}
                      placeholder="np. 10.5" min="0" step="0.1"
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
                    <input type="number" value={durationMin} onChange={e => setDurationMin(e.target.value)}
                      placeholder="np. 55" min="0"
                      className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                  </div>
                </div>

                {/* Pain */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Ból lub problem?</label>
                  <div className="flex gap-2">
                    {[
                      { value: false, label: 'Nie' },
                      { value: true, label: 'Tak' },
                    ].map(option => (
                      <button key={option.label} onClick={() => setPainFlag(option.value)}
                        className="flex-1 py-2 px-3 rounded-xl text-sm font-medium cursor-pointer transition-all text-center"
                        style={{
                          background: painFlag === option.value ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                          border: painFlag === option.value ? '1px solid rgba(255,92,27,0.5)' : '1px solid transparent',
                          color: painFlag === option.value ? '#FF5C1B' : 'var(--text-muted)',
                        }}>{option.label}</button>
                    ))}
                  </div>
                  {painFlag && (
                    <textarea value={painNote} onChange={e => setPainNote(e.target.value)}
                      placeholder="Krótko opisz problem"
                      rows={2}
                      className="w-full mt-2 px-3 py-2.5 rounded-xl text-sm resize-none" style={INPUT_STYLE} />
                  )}
                </div>

                {/* Watch link */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Link z zegarka</label>
                  <input type="url" value={watchLink} onChange={e => setWatchLink(e.target.value)}
                    placeholder="np. https://connect.garmin.com/..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
                </div>
              </div>
            )}
          </>
        )}

        {feedbackType === 'voice' && (
          <VoiceRecorder
            transcript={voiceTranscript}
            onTranscriptChange={setVoiceTranscript}
          />
        )}
      </div>
    </Modal>
  )
}
