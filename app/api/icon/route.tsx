import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export function GET(request: NextRequest) {
  const size = parseInt(request.nextUrl.searchParams.get('size') ?? '192')
  const fontSize = Math.round(size * 0.65)

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
        <span style={{ fontSize, lineHeight: 1 }}>👟</span>
      </div>
    ),
    { width: size, height: size }
  )
}
