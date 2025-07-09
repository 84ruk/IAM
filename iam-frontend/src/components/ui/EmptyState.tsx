'use client'

import { LucideIcon } from 'lucide-react'
import Button from './Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  showAction?: boolean
  variant?: 'default' | 'info' | 'warning' | 'success'
  className?: string
}

const variantStyles = {
  default: {
    iconBg: 'bg-gray-50',
    iconColor: 'text-gray-400',
    titleColor: 'text-gray-900',
    descriptionColor: 'text-gray-600'
  },
  info: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    titleColor: 'text-gray-900',
    descriptionColor: 'text-gray-600'
  },
  warning: {
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    titleColor: 'text-gray-900',
    descriptionColor: 'text-gray-600'
  },
  success: {
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    titleColor: 'text-gray-900',
    descriptionColor: 'text-gray-600'
  }
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  showAction = false,
  variant = 'default',
  className = ""
}: EmptyStateProps) {
  const styles = variantStyles[variant]

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {Icon && (
        <div className={`${styles.iconBg} rounded-full p-4 mb-4`}>
          <Icon className={`w-8 h-8 ${styles.iconColor}`} />
        </div>
      )}
      
      <h3 className={`text-lg font-semibold mb-2 ${styles.titleColor}`}>
        {title}
      </h3>
      
      <p className={`mb-6 max-w-md ${styles.descriptionColor}`}>
        {description}
      </p>

      {showAction && actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
} 