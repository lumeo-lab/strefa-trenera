'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createFeedback, updateFeedback } from '@/lib/actions/feedback'
import type { AthleteFeedbackRow } from '@/lib/athlete-data'
import { VoiceRecorder } from './VoiceRecorder'
import { parseFeedbackTranscript } from '@/lib/utils'

const FEELINGS = [
  { emoji: '😫', label: 'Fatalnie' },
  { emoji: '😕', label: 'Słabo' },
  { emoji: '😐', label: 'Średnio' },
  { emoji: '😊', label: 'Dobrze' },
  { emoji: '🤩', label: 'Świetnie' },
]
const INTENSITIES = ['Bardzo lekki', 'Lekki', 'Umiarkowany', 'Ciężki', 'Bardzo ciężki', 'Maksymalny']
const TRAINING_TYPES = ['Easy / Rozbieganie', 'Interwały', 'Tempo', 'Long Run', 'Siłownia', 'Crosstraining', 'Inny']
import { INPUT_STYLE } from '@/lib/styles'

export interface FeedbackData {
  feeling?: string
  trainingType?: string
  distanceKm?: string
  durationMin?: string
  intensity?: string
  notes?: string
  voiceTranscript?: string
  watchLink?: string
}

export function dbRowToFeedback(fb: AthleteFeedbackRow): FeedbackData {
  const parsed = parseFeedbackTranscript(fb.transcript ?? '')
  return {
    feeling: parsed.feeling || undefined,
    trainingType: parsed.trainingType || undefined,
    distanceKm: parsed.distance ? parsed.distance.replace(' km', '') : undefined,
    durationMin: parsed.duration ? parsed.duration.replace(' min', '') : undefined,
    intensity: parsed.intensity || undefined,
    notes: parsed.notes || undefined,
    voiceTranscript: parsed.voice || undefined,
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

  const [feeling, setFeeling] = useState(initialData?.feeling ?? '')
  const [trainingType, setTrainingType] = useState(initialData?.trainingType ?? '')
  const [distanceKm, setDistanceKm] = useState(initialData?.distanceKm ?? '')
  const [durationMin, setDurationMin] = useState(initialData?.durationMin ?? '')
  const [intensity, setIntensity] = useState(initialData?.intensity ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [watchLink, setWatchLink] = useState(initialData?.watchLink ?? '')
  const [voiceTranscript, setVoiceTranscript] = useState(initialData?.voiceTranscript ?? '')

  // Reset form state when initialData changes (modal opens with new data)
  // We use key prop on the modal to force remount instead

  async function submitFeedback() {
    if (submitting) return
    setSubmitting(true)
    setSaveError(null)
    try {
      const fd = new FormData()
      fd.set('slug', slug)
      fd.set('date', date)
      if (sessionId) fd.set('session_id', sessionId)

      if (feedbackType === 'text') {
        fd.set('feeling', feeling)
        fd.set('training_type', trainingType)
        fd.set('distance_km', distanceKm)
        fd.set('duration_min', durationMin)
        fd.set('intensity', intensity)
        fd.set('notes', notes)
        fd.set('watch_link', watchLink)
        fd.set('voice_transcript', '')
      } else {
        fd.set('feeling', '')
        fd.set('training_type', '')
        fd.set('distance_km', '')
        fd.set('duration_min', '')
        fd.set('intensity', '')
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

      if (result && 'error' in result) { setSaveError(result.error ?? 'Nie udało się zapisać feedbacku.'); return }

      if (feedbackType === 'text') {
        onSubmitted({ feeling, trainingType, distanceKm, durationMin, intensity, notes, watchLink: watchLink || undefined }, 'text')
      } else {
        onSubmitted({ voiceTranscript: voiceTranscript || undefined }, 'voice')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const canSaveText = !!(feeling || trainingType || distanceKm || durationMin || intensity || notes.trim() || watchLink.trim())
  const canSaveVoice = !!(voiceTranscript.trim())

  const modalFooter = (
    <div>
      {saveError && (
        <p role="alert" className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          {saveError}
        </p>
      )}
      <Button className="w-full" onClick={submitFeedback}
        disabled={(feedbackType === 'text' ? !canSaveText : !canSaveVoice) || submitting}>
        {submitting ? 'Zapisywanie...' : 'Zapisz'}
      </Button>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose}
      title={feedbackType === 'text' ? 'Feedback po treningu' : 'Komentarz głosowy'}
      size="sm" footer={modalFooter}>
      <div className="space-y-4">
        {feedbackType === 'text' && (
          <>
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

            {/* Training type */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Rodzaj treningu</label>
              <select value={trainingType} onChange={e => setTrainingType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm cursor-pointer" style={INPUT_STYLE}>
                <option value="">— wybierz —</option>
                {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Distance + duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Dystans (km)</label>
                <input type="number" value={distanceKm} onChange={e => setDistanceKm(e.target.value)}
                  placeholder="np. 10.5" min="0" step="0.1"
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Czas (min)</label>
                <input type="number" value={durationMin} onChange={e => setDurationMin(e.target.value)}
                  placeholder="np. 55" min="0"
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={INPUT_STYLE} />
              </div>
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Jak ciężki był trening?</label>
              <div className="grid grid-cols-3 gap-2">
                {INTENSITIES.map(lvl => (
                  <button key={lvl} onClick={() => setIntensity(intensity === lvl ? '' : lvl)}
                    className="py-2 px-1 rounded-xl text-xs font-medium cursor-pointer transition-all text-center"
                    style={{
                      background: intensity === lvl ? 'rgba(255,92,27,0.15)' : 'var(--bg-subtle)',
                      border: intensity === lvl ? '1px solid rgba(255,92,27,0.5)' : '1px solid transparent',
                      color: intensity === lvl ? '#FF5C1B' : 'var(--text-muted)',
                    }}>{lvl}</button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Notatki (opcjonalnie)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Jak poszedł trening?" rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" style={INPUT_STYLE} />
            </div>

            {/* Watch link */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>⌚ Link z zegarka (opcjonalnie)</label>
              <input
                type="url"
                value={watchLink}
                onChange={e => setWatchLink(e.target.value)}
                placeholder="np. https://connect.garmin.com/..."
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={INPUT_STYLE}
              />
            </div>
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
