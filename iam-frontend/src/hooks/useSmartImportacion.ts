'use client'

import { useState, useCallback } from 'react'
import { useLazyWebSocket } from './useLazyWebSocket'
import { analyzeFile, validateFileForAnalysis, ImportacionAnalysis } from '@/utils/importacionAnalysis'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'

interface SmartImportacionState {
  analysis: ImportacionAnalysis | null
  importMode: 'http' | 'websocket' | null
  isAnalyzing: boolean
  isImporting: boolean
  error: string | null
  success: string | null
}

interface UseSmartImportacionReturn {
  state: SmartImportacionState
  analyzeFile: (file: File, tipo: string) => Promise<ImportacionAnalysis>
  importar: (file: File, tipo: string) => Promise<any>
  clearState: () => void
  clearError: () => void
}

export function useSmartImportacion(): UseSmartImportacionReturn {
  const [state, setState] = useState<SmartImportacionState>({
    analysis: null,
    importMode: null,
    isAnalyzing: false,
    isImporting: false,
    error: null,
    success: null
  })

  const { socket, isConnected, connect } = useLazyWebSocket()

  // Analizar archivo para determinar el modo óptimo
  const analyzeFileForImport = useCallback(async (file: File, tipo: string): Promise<ImportacionAnalysis> => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      // Validar archivo primero
      const validation = validateFileForAnalysis(file)
      if (!validation.valid) {
        throw new Error(validation.error || 'Archivo inválido')
      }

      // Analizar archivo
      const analysis = await analyzeFile(file, tipo)
      
      setState(prev => ({
        ...prev,
        analysis,
        importMode: analysis.recommendedMode,
        isAnalyzing: false
      }))

      return analysis
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error analizando archivo'
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  // Importar usando modo HTTP (sin seguimiento)
  const importarHTTP = useCallback(async (file: File, tipo: string) => {
    setState(prev => ({ ...prev, isImporting: true, error: null }))

    try {
      const formData = new FormData()
      formData.append('archivo', file)
      formData.append('tipo', tipo)
      formData.append('modo', 'rapido')

      const response = await fetch('/api/importacion/rapida', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error en importación HTTP')
      }

      const result = await response.json()
      
      setState(prev => ({
        ...prev,
        isImporting: false,
        success: 'Importación completada exitosamente'
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en importación HTTP'
      setState(prev => ({
        ...prev,
        isImporting: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  // Importar usando modo WebSocket (con seguimiento)
  const importarWebSocket = useCallback(async (file: File, tipo: string) => {
    setState(prev => ({ ...prev, isImporting: true, error: null }))

    try {
      // Asegurar conexión WebSocket
      const connected = await connect()
      if (!connected) {
        throw new Error('No se pudo conectar WebSocket para seguimiento')
      }

      // Usar el sistema de importación unificado existente
      const formData = new FormData()
      formData.append('archivo', file)
      formData.append('tipo', tipo)
      formData.append('modo', 'websocket')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/importacion/unificada`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error en importación WebSocket')
      }

      const result = await response.json()
      
      setState(prev => ({
        ...prev,
        isImporting: false,
        success: 'Importación iniciada con seguimiento en tiempo real'
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en importación WebSocket'
      setState(prev => ({
        ...prev,
        isImporting: false,
        error: errorMessage
      }))
      throw error
    }
  }, [connect])

  // Función principal de importación
  const importar = useCallback(async (file: File, tipo: string) => {
    try {
      // Analizar archivo primero
      const analysis = await analyzeFileForImport(file, tipo)
      
      // Importar según el modo determinado
      if (analysis.needsWebSocket) {
        return await importarWebSocket(file, tipo)
      } else {
        return await importarHTTP(file, tipo)
      }
    } catch (error) {
      console.error('Error en importación inteligente:', error)
      throw error
    }
  }, [analyzeFileForImport, importarWebSocket, importarHTTP])

  // Limpiar estado
  const clearState = useCallback(() => {
    setState({
      analysis: null,
      importMode: null,
      isAnalyzing: false,
      isImporting: false,
      error: null,
      success: null
    })
  }, [])

  // Limpiar errores
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    state,
    analyzeFile: analyzeFileForImport,
    importar,
    clearState,
    clearError
  }
} 