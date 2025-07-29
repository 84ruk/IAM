'use client'

import { useMemo, useCallback, useRef } from 'react'
import { useImportacionOptimized } from './useImportacionOptimized'
import { useImportacionWebSocket } from './useImportacionWebSocket'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'
import { ImportacionAutoDto } from '@/lib/api/importacion'

// Configuración para determinar cuándo usar WebSocket
const WEBSOCKET_THRESHOLDS = {
  RECORDS: 1000, // Más de 1000 registros
  FILE_SIZE: 10 * 1024 * 1024, // Más de 10MB
  ESTIMATED_TIME: 30000, // Más de 30 segundos
  COMPLEXITY_LEVELS: {
    SIMPLE: ['proveedores', 'categorias'] as const,
    MEDIUM: ['productos', 'movimientos'] as const,
    COMPLEX: ['inventario_completo', 'datos_historicos'] as const
  }
} as const

// Función para analizar si un archivo necesita WebSocket
const analyzeFileForWebSocket = (file: File, tipo: TipoImportacion): boolean => {
  // Por tamaño de archivo
  if (file.size > WEBSOCKET_THRESHOLDS.FILE_SIZE) {
    return true
  }

  // Por tipo de importación (complejidad)
  const isComplexType = WEBSOCKET_THRESHOLDS.COMPLEXITY_LEVELS.COMPLEX.includes(tipo as any)
  if (isComplexType) {
    return true
  }

  // Por tipo de importación (media)
  const isMediumType = WEBSOCKET_THRESHOLDS.COMPLEXITY_LEVELS.MEDIUM.includes(tipo as any)
  if (isMediumType && file.size > 5 * 1024 * 1024) { // 5MB para tipos medios
    return true
  }

  return false
}

interface UseImportacionUnifiedReturn {
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
  importarNormal: (archivo: File, tipo: TipoImportacion, opciones: any) => Promise<void>
  importarAutomatica: (archivo: File, opciones: ImportacionAutoDto) => Promise<void>
  validarAutomatica: (archivo: File, opciones?: any) => Promise<any>
  confirmarAutomatica: (trabajoId: string, opciones: any) => Promise<void>
  
  // Funciones de utilidad
  descargarPlantilla: (tipo: TipoImportacion) => Promise<void>
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
  analyzeFile: (file: File, tipo: TipoImportacion) => { needsWebSocket: boolean; reason: string }
}

export const useImportacionUnified = (): UseImportacionUnifiedReturn => {
  const baseHook = useImportacionOptimized()
  const webSocketHook = useImportacionWebSocket()
  
  // Ref para mantener las suscripciones activas
  const subscribedTrabajosRef = useRef<Set<string>>(new Set())
  
  // Función para analizar archivos
  const analyzeFile = useCallback((file: File, tipo: TipoImportacion) => {
    const needsWebSocket = analyzeFileForWebSocket(file, tipo)
    
    let reason = ''
    if (file.size > WEBSOCKET_THRESHOLDS.FILE_SIZE) {
      reason = `Archivo grande (${(file.size / 1024 / 1024).toFixed(1)}MB)`
    } else if (WEBSOCKET_THRESHOLDS.COMPLEXITY_LEVELS.COMPLEX.includes(tipo as any)) {
      reason = 'Tipo de importación complejo'
    } else if (WEBSOCKET_THRESHOLDS.COMPLEXITY_LEVELS.MEDIUM.includes(tipo as any) && file.size > 5 * 1024 * 1024) {
      reason = 'Tipo medio con archivo grande'
    } else {
      reason = 'Archivo pequeño, no necesita WebSocket'
    }
    
    return { needsWebSocket, reason }
  }, [])
  
  // Combinar estado de WebSocket con el estado base (memoizado para evitar re-renders)
  const combinedState = useMemo(() => ({
    ...baseHook,
    isConnected: webSocketHook.isConnected,
    subscribedTrabajos: subscribedTrabajosRef.current,
  }), [baseHook, webSocketHook.isConnected])
  
  // Función para asegurar conexión WebSocket solo cuando sea necesario
  const ensureWebSocketConnection = useCallback(async (file: File, tipo: TipoImportacion) => {
    const analysis = analyzeFile(file, tipo)
    
    if (!analysis.needsWebSocket) {
      console.log('📁 Archivo pequeño, usando HTTP:', analysis.reason)
      return false
    }
    
    console.log('🔌 Archivo grande, conectando WebSocket:', analysis.reason)
    
    // Intentar conectar WebSocket si no está conectado
    if (!webSocketHook.isConnected) {
      try {
        webSocketHook.connect()
        // Esperar un poco para que se establezca la conexión
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (!webSocketHook.isConnected) {
          console.warn('⚠️ No se pudo conectar WebSocket, usando HTTP como fallback')
          return false
        }
      } catch (error) {
        console.warn('⚠️ Error conectando WebSocket, usando HTTP como fallback:', error)
        return false
      }
    }
    
    return true
  }, [webSocketHook.isConnected, webSocketHook.connect, analyzeFile])
  
  // Funciones específicas para importación normal
  const importarNormal = useCallback(async (
    archivo: File, 
    tipo: TipoImportacion, 
    opciones: any
  ) => {
    try {
      // Analizar si necesita WebSocket
      const useWebSocket = await ensureWebSocketConnection(archivo, tipo)
      
      if (useWebSocket) {
        console.log('🚀 Importación con WebSocket')
        // Aquí podrías implementar lógica específica para WebSocket
      } else {
        console.log('⚡ Importación con HTTP')
      }
      
      await baseHook.importarUnified(archivo, tipo, opciones)
    } catch (error) {
      console.error('Error en importación normal:', error)
      throw error
    }
  }, [baseHook.importarUnified, ensureWebSocketConnection])
  
  // Funciones específicas para importación automática
  const importarAutomatica = useCallback(async (
    archivo: File, 
    opciones: ImportacionAutoDto
  ) => {
    try {
      // Para importación automática, siempre usar WebSocket si está disponible
      const useWebSocket = await ensureWebSocketConnection(archivo, 'productos')
      
      if (useWebSocket) {
        console.log('🚀 Importación automática con WebSocket')
      } else {
        console.log('⚡ Importación automática con HTTP')
      }
      
      await baseHook.importarAuto(archivo, opciones)
    } catch (error) {
      console.error('Error en importación automática:', error)
      throw error
    }
  }, [baseHook.importarAuto, ensureWebSocketConnection])
  
  const validarAutomatica = useCallback(async (
    archivo: File, 
    opciones?: any
  ) => {
    try {
      return await baseHook.validarAuto(archivo, opciones)
    } catch (error) {
      console.error('Error en validación automática:', error)
      throw error
    }
  }, [baseHook.validarAuto])
  
  const confirmarAutomatica = useCallback(async (
    trabajoId: string, 
    opciones: any
  ) => {
    try {
      // La función confirmarAuto no toma parámetros según el hook base
      await baseHook.confirmarAuto()
    } catch (error) {
      console.error('Error en confirmación automática:', error)
      throw error
    }
  }, [baseHook.confirmarAuto])
  
  // Funciones de WebSocket optimizadas
  const subscribeToTrabajo = useCallback((trabajoId: string) => {
    if (!subscribedTrabajosRef.current.has(trabajoId)) {
    webSocketHook.subscribeToTrabajo(trabajoId)
      subscribedTrabajosRef.current.add(trabajoId)
    }
  }, [webSocketHook.subscribeToTrabajo])
  
  const unsubscribeFromTrabajo = useCallback((trabajoId: string) => {
    if (subscribedTrabajosRef.current.has(trabajoId)) {
    webSocketHook.unsubscribeFromTrabajo(trabajoId)
      subscribedTrabajosRef.current.delete(trabajoId)
    }
  }, [webSocketHook.unsubscribeFromTrabajo])
  
  // Función de descarga de plantilla corregida
  const descargarPlantilla = useCallback(async (tipo: TipoImportacion) => {
    if (typeof baseHook.descargarPlantilla === 'function') {
      return await baseHook.descargarPlantilla(tipo)
    }
    // Fallback si la función no está disponible
    console.warn('Función descargarPlantilla no disponible')
  }, [baseHook.descargarPlantilla])
  
  return {
    // Estado base
    isImporting: combinedState.isImporting,
    currentTrabajo: combinedState.currentTrabajo,
    error: combinedState.error,
    success: combinedState.success,
    validationErrors: combinedState.validationErrors,
    deteccionTipo: combinedState.deteccionTipo,
    
    // Estado de WebSocket
    isConnected: combinedState.isConnected,
    subscribedTrabajos: subscribedTrabajosRef.current,
    
    // Trabajos y estadísticas
    trabajos: combinedState.trabajos,
    trabajosRecientes: combinedState.trabajosRecientes,
    trabajosEnProgreso: combinedState.trabajosEnProgreso,
    estadisticas: combinedState.estadisticas,
    
    // Funciones de importación
    importarNormal,
    importarAutomatica,
    validarAutomatica,
    confirmarAutomatica,
    
    // Funciones de utilidad
    descargarPlantilla,
    cancelarTrabajo: baseHook.cancelarTrabajo,
    descargarReporteErrores: baseHook.descargarReporteErrores,
    
    // Funciones de limpieza
    clearError: baseHook.clearError,
    clearSuccess: baseHook.clearSuccess,
    clearValidationErrors: baseHook.clearValidationErrors,
    clearDeteccionTipo: baseHook.clearDeteccionTipo,
    
    // Funciones de WebSocket
    subscribeToTrabajo,
    unsubscribeFromTrabajo,
    
    // Utilidades
    isReady: combinedState.isReady,
    hasData: combinedState.hasData,
    hasActiveImport: combinedState.hasActiveImport,
    
    // Análisis de archivos
    analyzeFile,
  }
} 