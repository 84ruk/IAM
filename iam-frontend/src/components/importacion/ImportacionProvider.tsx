'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useImportacionSafe } from '@/hooks/useImportacionSafe'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ImportacionContextType {
  isLoading: boolean
  isImporting: boolean
  currentTrabajo: any
  trabajos: any[]
  trabajosRecientes: any[]
  error: string | null
  success: string | null
  validationErrors: any[] | null
  tiposSoportados: any[]
  deteccionTipo: any
  isLoadingTipos: boolean
  importarProductos: (archivo: File, opciones: any) => Promise<void>
  importarProveedores: (archivo: File, opciones: any) => Promise<void>
  importarMovimientos: (archivo: File, opciones: any) => Promise<void>
  importarUnified: (archivo: File, tipo: string, opciones: any) => Promise<void>
  importarUnificada: (archivo: File, opciones: any) => Promise<void>
  importarAuto: (archivo: File, opciones: any) => Promise<void>
  validarAuto: (archivo: File, opciones?: any) => Promise<any>
  confirmarAuto: (trabajoId: string, opciones: any) => Promise<void>
  loadTrabajos: () => Promise<void>
  loadTiposSoportados: () => Promise<void>
  cancelarTrabajo: (trabajoId: string) => Promise<void>
  descargarReporteErrores: (trabajoId: string) => Promise<void>
  descargarPlantilla: (tipo: string) => Promise<void>
  descargarPlantillaMejorada: (tipo: string) => Promise<void>
  clearError: () => void
  clearSuccess: () => void
  clearValidationErrors: () => void
  clearDeteccionTipo: () => void
  stopPolling: () => void
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