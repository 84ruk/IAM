'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useImportacionSafe } from '@/hooks/useImportacionSafe'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ImportacionContextType {
  // Arrays
  trabajos: any[]
  tiposSoportados: any[]
  trabajosRecientes: any[]
  trabajosEnProgreso: any[]
  validationErrors: any[] | null
  
  // Estados de carga
  isLoadingTrabajos: boolean
  isLoadingTipos: boolean
  isImporting: boolean
  isValidating: boolean
  
  // Estados de respuesta
  success: string | null
  error: string | null
  deteccionTipo: any
  
  // Trabajo actual
  currentTrabajo: any
  
  // Estadísticas
  estadisticas: {
    total: number
    completados: number
    conError: number
    enProgreso: number
    porcentajeExito: number
  }
  
  // Funciones
  descargarPlantilla: (tipo?: any) => Promise<void>
  cancelarTrabajo: () => Promise<void>
  descargarReporteErrores: () => Promise<void>
  importarProductos: (archivo: File, opciones: any) => Promise<void>
  importarProveedores: (archivo: File, opciones: any) => Promise<void>
  importarMovimientos: (archivo: File, opciones: any) => Promise<void>
  importarUnified: (archivo: File, tipo: any, opciones: any) => Promise<void>
  importarAuto: (archivo: File, opciones: any) => Promise<void>
  validarAuto: (archivo: File, opciones?: any) => Promise<any>
  confirmarAuto: (trabajoId: string, opciones: any) => Promise<void>
  descargarPlantillaMejorada: (tipo: any) => Promise<void>
  
  // Funciones de limpieza
  clearError: () => void
  clearSuccess: () => void
  clearValidationErrors: () => void
  clearDeteccionTipo: () => void
  
  // Manejo de errores
  handleImportError: (error: any, tipo?: any) => { title: string; message: string; type: string }
}

const ImportacionContext = createContext<ImportacionContextType | undefined>(undefined)

interface ImportacionProviderProps {
  children: ReactNode
}

export function ImportacionProvider({ children }: ImportacionProviderProps) {
  const importacionData = useImportacionSafe()

  // Si está cargando inicialmente, mostrar spinner
  if (importacionData.isLoadingTrabajos || importacionData.isLoadingTipos) {
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