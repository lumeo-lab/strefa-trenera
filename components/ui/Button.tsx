'use client'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-400 text-white',
    secondary: 'hover:opacity-90',
    ghost: 'hover:opacity-80',
    danger: 'text-red-400',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const variantStyle = variant === 'secondary'
    ? { background: 'var(--bg-hover)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }
    : variant === 'ghost'
    ? { color: 'var(--text-muted)' }
    : variant === 'danger'
    ? { background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', color: '#E74C3C' }
    : {}

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={variantStyle}
      {...props}
    >
      {children}
    </button>
  )
}
