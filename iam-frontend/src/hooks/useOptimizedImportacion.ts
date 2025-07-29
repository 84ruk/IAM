'use client'

import { useState, useCallback, useMemo } from 'react'
import { useImportacionUnified } from './useImportacionUnified'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'
import { ImportacionAutoDto } from '@/lib/api/importacion'

interface ImportAnalysis {
  needsWebSocket: boolean
  reason: string
  estimatedRecords?: number
  estimatedTime?: number
  complexity: 'simple' | 'medium' | 'complex'
}

interface UseOptimizedImportacionReturn {
  // Estado
  isImporting: boolean
  currentTrabajo: any
  error: string | null
  success: string | null
  validationErrors: any[] | null
  
  // Análisis
  currentAnalysis: ImportAnalysis | null
  isAnalyzing: boolean
  
  // Funciones
  analyzeFile: (file: File, tipo: TipoImportacion) => Promise<ImportAnalysis>
  importarOptimized: (file: File, tipo: TipoImportacion, opciones?: any) => Promise<void>
  importarAutomaticaOptimized: (file: File, opciones: ImportacionAutoDto) => Promise<void>
  
  // Utilidades
  clearAnalysis: () => void
  clearError: () => void
  clearSuccess: () => void
}

// Configuración para estimaciones
const ESTIMATION_CONFIG = {
  RECORDS_PER_MB: {
    productos: 500,
    proveedores: 1000,
    movimientos: 800,
    categorias: 2000
  },
  TIME_PER_RECORD: {
    productos: 0.1, // ms por registro
    proveedores: 0.05,
    movimientos: 0.15,
    categorias: 0.02
  },
  COMPLEXITY_THRESHOLDS: {
    SIMPLE: 100,
    MEDIUM: 1000,
    COMPLEX: 5000
  }
} as const

export function useOptimizedImportacion(): UseOptimizedImportacionReturn {
  const importacionHook = useImportacionUnified()
  const [currentAnalysis, setCurrentAnalysis] = useState<ImportAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Función para estimar registros basado en tamaño y tipo
  const estimateRecords = useCallback((file: File, tipo: TipoImportacion): number => {
    const recordsPerMB = ESTIMATION_CONFIG.RECORDS_PER_MB[tipo as keyof typeof ESTIMATION_CONFIG.RECORDS_PER_MB] || 500
    const fileSizeMB = file.size / (1024 * 1024)
    return Math.round(fileSizeMB * recordsPerMB)
  }, [])

  // Función para estimar tiempo de procesamiento
  const estimateTime = useCallback((records: number, tipo: TipoImportacion): number => {
    const timePerRecord = ESTIMATION_CONFIG.TIME_PER_RECORD[tipo as keyof typeof ESTIMATION_CONFIG.TIME_PER_RECORD] || 0.1
    return records * timePerRecord
  }, [])

  // Función para determinar complejidad
  const determineComplexity = useCallback((records: number): 'simple' | 'medium' | 'complex' => {
    if (records <= ESTIMATION_CONFIG.COMPLEXITY_THRESHOLDS.SIMPLE) return 'simple'
    if (records <= ESTIMATION_CONFIG.COMPLEXITY_THRESHOLDS.MEDIUM) return 'medium'
    return 'complex'
  }, [])

  // Función para analizar archivo
  const analyzeFile = useCallback(async (file: File, tipo: TipoImportacion): Promise<ImportAnalysis> => {
    setIsAnalyzing(true)
    
    try {
      // Usar el análisis del hook unificado
      const basicAnalysis = importacionHook.analyzeFile(file, tipo)
      
      // Estimaciones adicionales
      const estimatedRecords = estimateRecords(file, tipo)
      const estimatedTime = estimateTime(estimatedRecords, tipo)
      const complexity = determineComplexity(estimatedRecords)
      
      const analysis: ImportAnalysis = {
        ...basicAnalysis,
        estimatedRecords,
        estimatedTime,
        complexity
      }
      
      setCurrentAnalysis(analysis)
      return analysis
    } catch (error) {
      console.error('Error analizando archivo:', error)
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [importacionHook.analyzeFile, estimateRecords, estimateTime, determineComplexity])

  // Función de importación optimizada
  const importarOptimized = useCallback(async (
    file: File, 
    tipo: TipoImportacion, 
    opciones: any = {}
  ) => {
    try {
      // Analizar archivo si no se ha hecho
      if (!currentAnalysis) {
        await analyzeFile(file, tipo)
      }
      
      // Usar la función del hook unificado
      await importacionHook.importarNormal(file, tipo, opciones)
      
      console.log('✅ Importación optimizada completada')
    } catch (error) {
      console.error('❌ Error en importación optimizada:', error)
      throw error
    }
  }, [currentAnalysis, analyzeFile, importacionHook.importarNormal])

  // Función de importación automática optimizada
  const importarAutomaticaOptimized = useCallback(async (
    file: File, 
    opciones: ImportacionAutoDto
  ) => {
    try {
      // Analizar archivo si no se ha hecho
      if (!currentAnalysis) {
        await analyzeFile(file, 'productos')
      }
      
      // Usar la función del hook unificado
      await importacionHook.importarAutomatica(file, opciones)
      
      console.log('✅ Importación automática optimizada completada')
    } catch (error) {
      console.error('❌ Error en importación automática optimizada:', error)
      throw error
    }
  }, [currentAnalysis, analyzeFile, importacionHook.importarAutomatica])

  // Función para limpiar análisis
  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null)
  }, [])

  // Memoizar el estado combinado para evitar re-renders
  const combinedState = useMemo(() => ({
    isImporting: importacionHook.isImporting,
    currentTrabajo: importacionHook.currentTrabajo,
    error: importacionHook.error,
    success: importacionHook.success,
    validationErrors: importacionHook.validationErrors
  }), [
    importacionHook.isImporting,
    importacionHook.currentTrabajo,
    importacionHook.error,
    importacionHook.success,
    importacionHook.validationErrors
  ])

  return {
    // Estado
    ...combinedState,
    
    // Análisis
    currentAnalysis,
    isAnalyzing,
    
    // Funciones
    analyzeFile,
    importarOptimized,
    importarAutomaticaOptimized,
    
    // Utilidades
    clearAnalysis,
    clearError: importacionHook.clearError,
    clearSuccess: importacionHook.clearSuccess,
  }
} 