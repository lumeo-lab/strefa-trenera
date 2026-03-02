import type { Metadata } from 'next'
import { ThemeProvider } from '@/lib/theme'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  return {
    manifest: `/u/${slug}/webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Plan Treningowy',
    },
  }
}

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
        {children}
      </div>
    </ThemeProvider>
  )
}
