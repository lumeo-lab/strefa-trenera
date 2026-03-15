'use client'

import { useState, useRef } from 'react'

import { INPUT_STYLE } from '@/lib/styles'

interface VoiceRecorderProps {
  transcript: string
  onTranscriptChange: (text: string) => void
}

export function VoiceRecorder({ transcript, onTranscriptChange }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  // Web Speech API has no standard TypeScript definitions — `any` is intentional here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  async function handleRecord() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      alert('Brak dostępu do mikrofonu. Zezwól na dostęp w ustawieniach przeglądarki.')
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Twoja przeglądarka nie obsługuje nagrywania głosu. Użyj Chrome na Androidzie lub Safari na iOS.')
      return
    }
    const recognition = new SR()
    recognition.lang = 'pl-PL'
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition
    onTranscriptChange('')
    setRecording(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(' ')
      onTranscriptChange(text)
    }
    recognition.onend = () => { setRecording(false) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      setRecording(false)
      if (e.error !== 'aborted') alert('Błąd nagrywania. Sprawdź uprawnienia mikrofonu.')
    }
    try { recognition.start() } catch { setRecording(false); alert('Nie można uruchomić nagrywania.') }
  }

  function stopRecord() { recognitionRef.current?.stop() }

  const idle = !recording && !transcript
  const hasTranscript = !recording && !!transcript

  return (
    <>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Nagraj krótki komentarz głosowy do swojego treningu. Zostanie on przekazany trenerowi.
      </p>

      {/* Voice: idle */}
      {idle && (
        <button onClick={handleRecord}
          className="w-full py-4 rounded-xl text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
          style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--border-mid)', color: 'var(--text-muted)' }}>
          🎤 Naciśnij, aby nagrać
        </button>
      )}

      {/* Voice: recording */}
      {recording && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.3)' }}>
          <div className="flex items-center gap-2">
            <span className="animate-pulse text-sm">🔴</span>
            <span className="text-sm font-medium" style={{ color: '#E74C3C' }}>Nagrywam...</span>
            <button onClick={stopRecord}
              className="ml-auto text-xs px-3 py-1 rounded-lg cursor-pointer font-medium"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
              ⏹ Zatrzymaj
            </button>
          </div>
          {transcript && (
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{transcript}</p>
          )}
        </div>
      )}

      {/* Voice: has transcript — editable */}
      {hasTranscript && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-green-400">✓ Nagranie gotowe — możesz poprawić tekst</span>
            <button onClick={() => onTranscriptChange('')}
              className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}>
              🔄 Nagraj ponownie
            </button>
          </div>
          <textarea
            value={transcript}
            onChange={e => onTranscriptChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
            style={INPUT_STYLE}
            placeholder="Transkrypcja nagrania..."
          />
        </div>
      )}
    </>
  )
}
