import { AVATAR_GRADIENTS } from '@/lib/constants'

interface AvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

function getColor(initials: string): string {
  const idx = initials.charCodeAt(0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[idx]
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
