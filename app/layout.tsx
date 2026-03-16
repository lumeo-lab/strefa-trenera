import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Strefa Trenera — Platforma dla trenerów biegania',
  description: 'Zamknij pętlę trener–zawodnik w jednym miejscu',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Strefa Trenera',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
