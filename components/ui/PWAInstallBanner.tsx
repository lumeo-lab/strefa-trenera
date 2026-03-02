'use client'

import { useState, useEffect } from 'react'

export function PWAInstallBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-dismissed')) return

    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    setIsIOS(ios)

    if (ios) {
      setTimeout(() => setShow(true), 1500)
    } else {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setTimeout(() => setShow(true), 1500)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setShow(false)
  }

  function dismiss() {
    setShow(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!show) return null

  return (
    <div
      className="fixed z-50 left-4 right-4 rounded-2xl shadow-2xl p-4"
      style={{
        bottom: '84px',
        background: 'var(--bg-card)',
        border: '1px solid rgba(255,92,27,0.35)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-sm text-white"
          style={{ background: '#FF5C1B', borderRadius: '22%' }}
        >
          ST
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-1">Dodaj do ekranu głównego</div>
          {isIOS ? (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Tapnij <span className="font-bold" style={{ color: '#FF5C1B' }}>□↑</span> na dole Safari, a potem <span className="font-bold" style={{ color: '#FF5C1B' }}>„Dodaj do ekranu głównego"</span>
            </p>
          ) : (
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
      {!isIOS && (
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
