import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoachBiz — Platforma dla trenerów biegania',
  description: 'Zamknij pętlę trener–zawodnik w jednym miejscu',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
