'use client'

import { useState, useEffect } from 'react'

type InstallMode =
  | 'ios-safari'      // iPhone/iPad w Safari — instrukcja "tapnij □↑"
  | 'ios-other'       // iPhone/iPad w Chrome/Firefox — "otwórz w Safari"
  | 'prompt'          // Android Chrome / Desktop Chrome/Edge — natywny przycisk
  | null

export function PWAInstallBanner() {
  const [mode, setMode] = useState<InstallMode>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-dismissed')) return

    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua)

    if (isIOS) {
      // CriOS = Chrome na iOS, FxiOS = Firefox na iOS
      const isIOSNonSafari = /CriOS|FxiOS|OPiOS|mercury/i.test(ua)
      setTimeout(() => setMode(isIOSNonSafari ? 'ios-other' : 'ios-safari'), 1500)
    } else {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setTimeout(() => setMode('prompt'), 1500)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setMode(null)
  }

  function dismiss() {
    setMode(null)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!mode) return null

  return (
    <div
      className="fixed z-50 left-4 right-4 rounded-2xl shadow-2xl p-4"
      style={{ bottom: '84px', background: 'var(--bg-card)', border: '1px solid rgba(255,92,27,0.35)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 flex items-center justify-center shrink-0 text-2xl"
          style={{ background: '#FF5C1B', borderRadius: '22%' }}
        >
          👟
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-1">Dodaj Plan Treningowy do ekranu głównego</div>

          {mode === 'ios-safari' && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Tapnij{' '}
              <span className="font-bold" style={{ color: '#FF5C1B' }}>□↑</span>
              {' '}na dole ekranu, potem{' '}
              <span className="font-bold" style={{ color: '#FF5C1B' }}>&bdquo;Dodaj do ekranu głównego&rdquo;</span>
            </p>
          )}

          {mode === 'ios-other' && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Otwórz tę stronę w{' '}
              <span className="font-bold" style={{ color: '#FF5C1B' }}>Safari</span>
              , aby dodać aplikację do ekranu głównego
            </p>
          )}

          {mode === 'prompt' && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Miej szybki dostęp do planu treningowego bez otwierania przeglądarki
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-xl leading-none cursor-pointer"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '2px 4px' }}
        >
          ×
        </button>
      </div>

      {mode === 'prompt' && (
        <button
          onClick={handleInstall}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: '#FF5C1B', color: 'white', border: 'none' }}
        >
          Dodaj do ekranu głównego
        </button>
      )}
    </div>
  )
}
