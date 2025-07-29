'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useImportacionGlobal } from '@/context/ImportacionGlobalContext'

interface UseImportacionLazyContextOptions {
  enabled?: boolean
  autoLoad?: boolean
}

export function useImportacionLazyContext(options: UseImportacionLazyContextOptions = {}) {
  const { enabled = true, autoLoad = false } = options
  const pathname = usePathname()
  const [isContextLoaded, setIsContextLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [contextError, setContextError] = useState<string | null>(null)

  // Determinar si estamos en una página que necesita el contexto de importación
  const isImportPage = pathname?.includes('/importacion') || 
                      pathname?.includes('/dashboard/importacion') ||
                      pathname?.includes('/dashboard/importacion-avanzada') || false

  // Intentar acceder al contexto para verificar si está disponible
  let contextAvailable = false
  try {
    useImportacionGlobal()
    contextAvailable = true
  } catch (error) {
    contextAvailable = false
  }

  // Cargar el contexto solo cuando sea necesario
  const loadContext = useCallback(async () => {
    if (isLoading || isContextLoaded) {
      return
    }

    try {
      setIsLoading(true)
      // El contexto se carga automáticamente al usar useImportacionGlobal
      setIsContextLoaded(true)
    } catch (error) {
      console.error('Error al cargar contexto de importación:', error)
      setContextError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, isContextLoaded])

  // Auto-cargar si estamos en una página de importación
  useEffect(() => {
    if (autoLoad && isImportPage && !isContextLoaded) {
      loadContext()
    }
  }, [autoLoad, isImportPage, isContextLoaded, loadContext])

  return {
    isContextLoaded: isContextLoaded || contextAvailable,
    isLoading,
    isImportPage,
    loadContext,
    shouldLoadContext: isImportPage && enabled,
    contextError
  }
} 