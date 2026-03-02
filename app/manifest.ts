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
        src: '/api/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/api/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
