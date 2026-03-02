import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const size = parseInt(request.nextUrl.searchParams.get('size') ?? '192')
  const fontSize = Math.round(size * 0.52)

  return new ImageResponse(
    (
      <div
        style={{
          background: '#FF5C1B',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '22%',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize,
            fontWeight: 900,
            letterSpacing: '-1px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          ST
        </span>
      </div>
    ),
    { width: size, height: size }
  )
}
