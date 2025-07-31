'use client'

import { useHydration } from '@/hooks/useHydration'
import { ReactNode } from 'react'

interface HydrationBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  ssr?: boolean
  clientOnly?: boolean
}

export function HydrationBoundary({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200 h-64 rounded" />,
  ssr = true,
  clientOnly = false
}: HydrationBoundaryProps) {
  const { isHydrated, isClient } = useHydration()

  // Si es client-only, mostrar fallback hasta que esté en el cliente
  if (clientOnly && !isClient) {
    return <>{fallback}</>
  }

  // Si no necesita SSR, mostrar fallback hasta hidratación completa
  if (!ssr && !isHydrated) {
    return <>{fallback}</>
  }

  // Si necesita SSR, mostrar contenido inmediatamente
  if (ssr) {
    return <>{children}</>
  }

  // Para componentes que solo funcionan en cliente
  return isClient ? <>{children}</> : <>{fallback}</>
}

// Componente específico para componentes que solo funcionan en el cliente
export function ClientOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return (
    <HydrationBoundary clientOnly fallback={fallback}>
      {children}
    </HydrationBoundary>
  )
}

// Componente para componentes que necesitan hidratación completa
export function FullyHydrated({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return (
    <HydrationBoundary ssr={false} fallback={fallback}>
      {children}
    </HydrationBoundary>
  )
} 