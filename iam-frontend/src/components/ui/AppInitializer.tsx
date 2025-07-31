'use client'

import { useEffect, useState } from 'react'
import { initializeAppConfig } from '@/lib/app-config'

interface AppInitializerProps {
  children: React.ReactNode
}

export default function AppInitializer({ children }: AppInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Inicializar configuración de la aplicación
        initializeAppConfig()
        setIsInitialized(true)
      } catch (error) {
        console.error('Error initializing app:', error)
        // Aún así marcar como inicializado para no bloquear la app
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [])

  // Mostrar contenido inmediatamente si ya está inicializado
  if (isInitialized) {
    return <>{children}</>
  }

  // Loading state optimizado - solo se muestra brevemente
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Cargando...</p>
      </div>
    </div>
  )
} 