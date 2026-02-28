import { CoachSidebar } from '@/components/coach/CoachSidebar'
import { ThemeProvider } from '@/lib/theme'

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen">
        <CoachSidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-auto" style={{ background: 'var(--bg-base)' }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
