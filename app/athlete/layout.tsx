import { AthleteBottomNav } from '@/components/athlete/AthleteBottomNav'

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-sm mx-auto min-h-screen relative" style={{ background: '#0D0F14' }}>
      <main className="pb-24">
        {children}
      </main>
      <AthleteBottomNav />
    </div>
  )
}
