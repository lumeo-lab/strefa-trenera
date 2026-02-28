import { CoachSidebar } from '@/components/coach/CoachSidebar'

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#0D0F14' }}>
      <CoachSidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
