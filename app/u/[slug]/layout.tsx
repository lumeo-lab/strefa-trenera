import { ThemeProvider } from '@/lib/theme'

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
        {children}
      </div>
    </ThemeProvider>
  )
}
