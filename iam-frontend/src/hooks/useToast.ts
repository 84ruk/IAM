'use client'

import { useCallback } from 'react'

interface UseToastReturn {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
    warning: (message: string) => void
  }
}

export function useToast(): UseToastReturn {
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    // Usar console.log para debugging por ahora
    console.log(`[${type.toUpperCase()}] ${message}`)
    
    // Aquí se puede integrar con cualquier librería de toast (sonner, react-hot-toast, etc.)
    // Por ahora usamos alert para simplicidad
    if (type === 'error') {
      alert(`Error: ${message}`)
    } else if (type === 'success') {
      alert(`Éxito: ${message}`)
    }
  }, [])

  return {
    toast: {
      success: (message: string) => showToast(message, 'success'),
      error: (message: string) => showToast(message, 'error'),
      info: (message: string) => showToast(message, 'info'),
      warning: (message: string) => showToast(message, 'warning')
    }
  }
} 