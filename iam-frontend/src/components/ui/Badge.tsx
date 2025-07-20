import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  default: 'bg-[#8E94F2] text-white',
  secondary: 'bg-gray-100 text-gray-700',
  outline: 'border border-gray-300 bg-white text-gray-700',
  destructive: 'bg-red-100 text-red-700'
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
}

export function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors'
  
  return (
    <span 
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
} 