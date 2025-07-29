'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useImportacionSafe } from '@/hooks/useImportacionSafe'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ImportacionContextType {
  // Estado base
  isImporting: boolean
  currentTrabajo: any
  error: string | null
  success: string | null
  validationErrors: any[] | null
  deteccionTipo: any
  
  // Estado de WebSocket
  isConnected: boolean
  subscribedTrabajos: Set<string>
  
  // Trabajos y estadísticas
  trabajos: any[]
  trabajosRecientes: any[]
  trabajosEnProgreso: any[]
  estadisticas: {
    total: number
    completados: number
    conError: number
    enProgreso: number
    porcentajeExito: number
  }
  
  // Funciones de importación
  importarNormal: (archivo: File, tipo: any, opciones: any) => Promise<void>
  importarAutomatica: (archivo: File, opciones: any) => Promise<void>
  validarAutomatica: (archivo: File, opciones?: any) => Promise<any>
  confirmarAutomatica: (trabajoId: string, opciones: any) => Promise<void>
  
  // Funciones de utilidad
  descargarPlantilla: (tipo: any) => Promise<void>
  cancelarTrabajo: () => Promise<void>
  descargarReporteErrores: () => Promise<void>
  
  // Funciones de limpieza
  clearError: () => void
  clearSuccess: () => void
  clearValidationErrors: () => void
  clearDeteccionTipo: () => void
  
  // Funciones de WebSocket
  subscribeToTrabajo: (trabajoId: string) => void
  unsubscribeFromTrabajo: (trabajoId: string) => void
  
  // Utilidades
  isReady: boolean
  hasData: boolean
  hasActiveImport: boolean
  
  // Análisis de archivos
  analyzeFile: (file: File, tipo: any) => { needsWebSocket: boolean; reason: string }
}

const ImportacionContext = createContext<ImportacionContextType | undefined>(undefined)

interface ImportacionProviderProps {
  children: ReactNode
}

export function ImportacionProvider({ children }: ImportacionProviderProps) {
  const importacionData = useImportacionSafe()

  // Si está cargando inicialmente, mostrar spinner
  if (importacionData.isImporting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Inicializando importación..." />
        </div>
      </div>
    )
  }

  return (
    <ImportacionContext.Provider value={importacionData}>
      {children}
    </ImportacionContext.Provider>
  )
}

export function useImportacionContext() {
  const context = useContext(ImportacionContext)
  if (context === undefined) {
    throw new Error('useImportacionContext must be used within an ImportacionProvider')
  }
  return context
} 