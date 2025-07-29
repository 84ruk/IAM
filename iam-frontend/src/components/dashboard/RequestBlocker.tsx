'use client'

import { useEffect, useRef } from 'react'

interface RequestBlockerProps {
  enabled?: boolean
  blockedPatterns?: string[]
}

export default function RequestBlocker({ 
  enabled = true, 
  blockedPatterns = [
    '/api/importacion/trabajos',
    '/api/importacion/tipos-soportados'
  ] 
}: RequestBlockerProps) {
  const originalFetch = useRef<typeof fetch | null>(null)
  const blockedCount = useRef(0)

  useEffect(() => {
    if (!enabled) return

    // Verificar si estamos en una página de importación
    const currentPath = window.location.pathname
    const isImportPage = currentPath.includes('/importacion') || currentPath.includes('/dashboard/importacion')
    
    // No bloquear en páginas de importación
    if (isImportPage) return

    // Guardar la función fetch original
    originalFetch.current = window.fetch

    // Interceptar fetch requests
    window.fetch = async (...args) => {
      const url = args[0]?.toString() || ''
      
      // Verificar si la URL debe ser bloqueada
      const shouldBlock = blockedPatterns.some(pattern => url.includes(pattern))
      
      if (shouldBlock) {
        blockedCount.current++
        console.log(`🚫 Request bloqueado: ${url} (${blockedCount.current} bloqueados)`)
        
        // Retornar una respuesta vacía para evitar el request
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Request bloqueado por optimización',
          blocked: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Permitir el request normal
      return originalFetch.current!(...args)
    }

    // Cleanup al desmontar
    return () => {
      if (originalFetch.current) {
        window.fetch = originalFetch.current
      }
    }
  }, [enabled, blockedPatterns])

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-800 z-50">
      <div className="font-medium">Request Blocker Activo</div>
      <div>Requests bloqueados: {blockedCount.current}</div>
      <div className="text-xs mt-1">
        Patrones: {blockedPatterns.join(', ')}
      </div>
    </div>
  )
} 