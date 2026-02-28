import { AthleteBottomNav } from '@/components/athlete/AthleteBottomNav'
import { ThemeProvider } from '@/lib/theme'

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="max-w-sm mx-auto min-h-screen relative" style={{ background: 'var(--bg-base)' }}>
        <main className="pb-24">
          {children}
        </main>
        <AthleteBottomNav />
      </div>
    </ThemeProvider>
  )
}
