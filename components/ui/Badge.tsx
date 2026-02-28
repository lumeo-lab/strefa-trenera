interface BadgeProps {
  children: React.ReactNode
  variant?: 'orange' | 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'purple'
  className?: string
}

export function Badge({ children, variant = 'orange', className = '' }: BadgeProps) {
  const variants = {
    orange: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    green: 'bg-green-500/15 text-green-400 border border-green-500/20',
    yellow: 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/20',
    red: 'bg-red-500/15 text-red-400 border border-red-500/20',
    gray: 'bg-white/10 text-[#8A92A8] border border-white/10',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
