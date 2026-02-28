import { AthleteBottomNav } from '@/components/athlete/AthleteBottomNav'
import { AthleteSidebar } from '@/components/athlete/AthleteSidebar'
import { ThemeProvider } from '@/lib/theme'

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        {/* Desktop sidebar */}
        <AthleteSidebar />

        {/* Content area: mobile centered, desktop offset by sidebar */}
        <div className="lg:ml-64">
          <main className="max-w-sm mx-auto lg:max-w-none lg:mx-0 pb-24 lg:pb-0">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <AthleteBottomNav />
      </div>
    </ThemeProvider>
  )
}
