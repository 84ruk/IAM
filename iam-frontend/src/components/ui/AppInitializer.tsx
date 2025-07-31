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
        
        // Marcar como inicializado después de un breve delay
        setTimeout(() => {
          setIsInitialized(true)
        }, 100)
      } catch (error) {
        console.error('Error initializing app:', error)
        // Aún así marcar como inicializado para no bloquear la app
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 