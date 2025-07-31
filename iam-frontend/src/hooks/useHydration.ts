'use client'

import { useState, useEffect } from 'react'

export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Pequeño delay para asegurar que React ha hidratado completamente
    const timer = setTimeout(() => setIsHydrated(true), 0)
    return () => clearTimeout(timer)
  }, [])

  return { isHydrated, isClient }
}

// Hook para componentes que solo deben renderizarse en el cliente
export function useClientOnly() {
  const { isClient } = useHydration()
  return isClient
}

// Hook para componentes que necesitan hidratación completa
export function useFullyHydrated() {
  const { isHydrated } = useHydration()
  return isHydrated
} 