'use client'

import React from 'react'
import { CompactServerStatus } from '@/components/ui/ColdStartLoader'
import { useServerState } from '@/context/ServerStatusContext'
import { cn } from '@/lib/utils'

interface ServerStatusBarProps {
  className?: string
  showDetails?: boolean
}

export default function ServerStatusBar({ 
  className = '',
  showDetails = false 
}: ServerStatusBarProps) {
  const { status, responseTime, retryCount } = useServerState()

  // Solo mostrar si hay problemas o si se solicitan detalles
  if (status === 'online' && !showDetails) {
    return null
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 transition-all duration-300',
      status === 'online' ? 'opacity-0 pointer-events-none' : 'opacity-100',
      className
    )}>
      <div className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-lg shadow-lg border backdrop-blur-sm',
        status === 'cold-start' && 'bg-orange-50 border-orange-200',
        status === 'offline' && 'bg-red-50 border-red-200',
        status === 'error' && 'bg-red-50 border-red-200',
        status === 'checking' && 'bg-blue-50 border-blue-200'
      )}>
        <CompactServerStatus status={status} />
        
        {showDetails && responseTime && (
          <span className="text-xs text-gray-500">
            {responseTime}ms
          </span>
        )}
        
        {showDetails && retryCount > 0 && (
          <span className="text-xs text-gray-500">
            Reintentos: {retryCount}
          </span>
        )}
      </div>
    </div>
  )
}

// Variante para usar en headers
export function HeaderServerStatus() {
  const { status } = useServerState()

  if (status === 'online') {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-50 border border-yellow-200">
      <CompactServerStatus status={status} />
      <span className="text-xs text-yellow-700">
        {status === 'cold-start' && 'Servidor iniciando...'}
        {status === 'offline' && 'Sin conexión'}
        {status === 'error' && 'Error de conexión'}
        {status === 'checking' && 'Verificando...'}
      </span>
    </div>
  )
} 