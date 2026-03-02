import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Strefa Trenera',
    short_name: 'Strefa Trenera',
    description: 'Twój panel treningowy',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D0F14',
    theme_color: '#FF5C1B',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
