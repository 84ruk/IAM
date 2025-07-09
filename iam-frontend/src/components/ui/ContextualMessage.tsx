'use client'

import { ReactNode } from 'react'
import { Info, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react'
import { useServerUser } from '@/context/ServerUserContext'
import { useSetupCheck } from '@/hooks/useSetupCheck'

interface ContextualMessageProps {
  type?: 'info' | 'warning' | 'success' | 'help'
  title?: string
  children: ReactNode
  className?: string
  showForRoles?: string[]
  hideForRoles?: string[]
  showWhenSetupComplete?: boolean
  showWhenSetupIncomplete?: boolean
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  help: HelpCircle
}

const variantStyles = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    text: 'text-blue-700'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    text: 'text-yellow-700'
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    title: 'text-green-800',
    text: 'text-green-700'
  },
  help: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'text-gray-600',
    title: 'text-gray-800',
    text: 'text-gray-700'
  }
}

export default function ContextualMessage({
  type = 'info',
  title,
  children,
  className = '',
  showForRoles,
  hideForRoles,
  showWhenSetupComplete,
  showWhenSetupIncomplete
}: ContextualMessageProps) {
  const user = useServerUser()
  const { needsSetup } = useSetupCheck()
  
  const Icon = iconMap[type]
  const styles = variantStyles[type]

  // Verificar si debe mostrar el mensaje según el rol
  if (showForRoles && !showForRoles.includes(user?.rol || '')) {
    return null
  }

  if (hideForRoles && hideForRoles.includes(user?.rol || '')) {
    return null
  }

  // Verificar si debe mostrar según el estado de setup
  if (showWhenSetupComplete && needsSetup) {
    return null
  }

  if (showWhenSetupIncomplete && !needsSetup) {
    return null
  }

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.icon} mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          {title && (
            <h4 className={`text-sm font-medium ${styles.title} mb-1`}>
              {title}
            </h4>
          )}
          <div className={`text-sm ${styles.text}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
} 