'use client'

import React from 'react'
import { useServerState } from '@/context/ServerStatusContext'
import ColdStartLoader from './ColdStartLoader'
import LoadingSpinner from './LoadingSpinner'
import { cn } from '@/lib/utils'

interface ServerAwareLoaderProps {
  isLoading?: boolean
  error?: Error | null
  children?: React.ReactNode
  fallback?: React.ReactNode
  className?: string
  showServerStatus?: boolean
  onRetry?: () => void
  onWarmUp?: () => void
}

export default function ServerAwareLoader({
  isLoading = false,
  error = null,
  children,
  fallback,
  className = '',
  showServerStatus = true,
  onRetry,
  onWarmUp
}: ServerAwareLoaderProps) {
  const { status, responseTime, retryCount, isWarmingUp } = useServerState()

  // Si hay un error específico de la aplicación
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Error de la aplicación
          </h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    )
  }

  // Si el servidor está offline o con error, mostrar el loader específico
  if (showServerStatus && (status === 'offline' || status === 'error' || status === 'cold-start')) {
    return (
      <ColdStartLoader
        status={status}
        responseTime={responseTime}
        retryCount={retryCount}
        isWarmingUp={isWarmingUp}
        onRetry={onRetry}
        onWarmUp={onWarmUp}
        className={className}
      />
    )
  }

  // Si está cargando normalmente
  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <LoadingSpinner 
          size="lg" 
          text={
            status === 'checking' 
              ? 'Verificando servidor...' 
              : 'Cargando...'
          } 
        />
        
        {/* Mostrar estado del servidor si es relevante */}
        {showServerStatus && status === 'checking' && (
          <div className="mt-4 text-sm text-gray-500">
            Verificando disponibilidad del servidor
          </div>
        )}
      </div>
    )
  }

  // Si hay un fallback personalizado
  if (fallback) {
    return <>{fallback}</>
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>
}

// Hook para usar con SWR o React Query
export function useServerAwareLoading<T>(
  data: T | undefined,
  error: Error | null,
  isLoading: boolean
) {
  const { status } = useServerState()

  const shouldShowServerLoader = status === 'offline' || status === 'error' || status === 'cold-start'
  const shouldShowLoading = isLoading || status === 'checking'

  return {
    shouldShowServerLoader,
    shouldShowLoading
  }
}

// Componente específico para listas con estado del servidor
export function ServerAwareList<T>({
  data,
  error,
  isLoading,
  renderItem,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  onRetry,
  onWarmUp
}: {
  data: T[] | undefined
  error: Error | null
  isLoading: boolean
  renderItem: (item: T, index: number) => React.ReactNode
  emptyMessage?: string
  className?: string
  onRetry?: () => void
  onWarmUp?: () => void
}) {
  const { shouldShowServerLoader, shouldShowLoading } = useServerAwareLoading(data, error, isLoading)

  if (shouldShowServerLoader) {
    return (
      <ServerAwareLoader
        showServerStatus={true}
        onRetry={onRetry}
        onWarmUp={onWarmUp}
        className={className}
      />
    )
  }

  if (shouldShowLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <LoadingSpinner size="lg" text="Cargando datos..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <div className="text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {data.map((item, index) => renderItem(item, index))}
    </div>
  )
} 