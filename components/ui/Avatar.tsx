interface AvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}

const colors = [
  'from-orange-500 to-orange-600',
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
  'from-yellow-500 to-yellow-600',
]

function getColor(initials: string): string {
  const idx = initials.charCodeAt(0) % colors.length
  return colors[idx]
}

export function Avatar({ initials, size = 'md' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${getColor(initials)} flex items-center justify-center font-bold text-white shrink-0`}>
      {initials}
    </div>
  )
}
