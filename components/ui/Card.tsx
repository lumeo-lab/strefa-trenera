interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-2xl ${onClick ? 'cursor-pointer transition-colors' : ''} ${className}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
