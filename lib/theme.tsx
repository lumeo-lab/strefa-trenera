'use client'
import { createContext, useContext, useSyncExternalStore } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', toggle: () => {} })
const THEME_EVENT = 'coachbiz-theme-change'

function subscribeThemeChange(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(THEME_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(THEME_EVENT, callback)
  }
}

function getClientThemeSnapshot(): Theme {
  const storedTheme = window.localStorage.getItem('coachbiz-theme')
  return storedTheme === 'light' ? 'light' : 'dark'
}

function getServerThemeSnapshot(): Theme {
  return 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeThemeChange, getClientThemeSnapshot, getServerThemeSnapshot)

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    window.localStorage.setItem('coachbiz-theme', next)
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div className={`theme-${theme} min-h-screen`} style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
