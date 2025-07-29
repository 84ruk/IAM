import { useMemo, useCallback } from 'react'
import { useImportacionGlobal, TipoImportacion } from '@/context/ImportacionGlobalContext'
import { ErrorHandlerService, UserFriendlyError } from '@/lib/api/errorHandler'

export const useImportacionOptimized = () => {
  const context = useImportacionGlobal()
  
  // Asegurar que todas las funciones estén disponibles
  const {
    state,
    loadTrabajos = (() => Promise.resolve()),
    loadTiposSoportados = (() => Promise.resolve()),
    initializeData = (() => Promise.resolve()),
    importarUnified = (() => Promise.resolve()),
    importarAuto = (() => Promise.resolve()),
    validarAuto = (() => Promise.resolve(null)),
    descargarPlantilla = (() => Promise.resolve()),
    clearError = (() => {}),
    clearSuccess = (() => {}),
    clearValidationErrors = (() => {}),
    clearDeteccionTipo = (() => {}),
    startPolling = (() => {}),
    stopPolling = (() => {})
  } = context || {}

  // Estado seguro
  const safeState = state || {
    trabajos: [],
    isLoadingTrabajos: false,
    isImporting: false,
    currentTrabajo: null,
    error: null,
    success: null,
    validationErrors: null,
    deteccionTipo: null,
    isInitialized: false
  }

  // Memoizar trabajos recientes para evitar recálculos innecesarios
  const trabajosRecientes = useMemo(() => 
    safeState.trabajos?.slice(0, 5) || [], 
    [safeState.trabajos]
  )

  // Memoizar si hay trabajos en progreso
  const trabajosEnProgreso = useMemo(() => 
    safeState.trabajos?.filter(t => t.estado === 'pendiente' || t.estado === 'procesando') || [],
    [safeState.trabajos]
  )

  // Memoizar estadísticas con optimización de rendimiento
  const estadisticas = useMemo(() => {
    const trabajos = safeState.trabajos || []
    const total = trabajos.length
    
    // Usar reduce para calcular todo en una sola pasada
    const { completados, conError, enProgreso } = trabajos.reduce((acc, trabajo) => {
      switch (trabajo.estado) {
        case 'completado':
          acc.completados++
          break
        case 'error':
          acc.conError++
          break
        case 'pendiente':
        case 'procesando':
          acc.enProgreso++
          break
      }
      return acc
    }, { completados: 0, conError: 0, enProgreso: 0 })

    return {
      total,
      completados,
      conError,
      enProgreso,
      porcentajeExito: total > 0 ? Math.round((completados / total) * 100) : 0
    }
  }, [safeState.trabajos])

  // Función mejorada para importación con feedback inmediato
  const importarUnifiedOptimized = useCallback(async (
    archivo: File, 
    tipo: TipoImportacion, 
    opciones: any
  ) => {
    try {
      // Proporcionar feedback inmediato
      if (context?.dispatch) {
        context.dispatch({ type: 'SET_IMPORTING', payload: true })
        context.dispatch({ type: 'SET_ERROR', payload: null })
        context.dispatch({ type: 'SET_SUCCESS', payload: null })
        
        // Crear un trabajo temporal para feedback inmediato
        const trabajoTemporal: any = {
          id: `temp-${Date.now()}`,
          tipo: tipo === 'auto' ? 'productos' : tipo,
          estado: 'pendiente',
          empresaId: 0,
          usuarioId: 0,
          archivoOriginal: archivo.name,
          totalRegistros: 0,
          registrosProcesados: 0,
          registrosExitosos: 0,
          registrosConError: 0,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString(),
          progreso: 0,
          mensaje: 'Preparando archivo para importación...'
        }
        
        context.dispatch({ type: 'SET_CURRENT_TRABAJO', payload: trabajoTemporal })
      }

      // Ejecutar la importación real
      await importarUnified(archivo, tipo, opciones)
    } catch (error) {
      console.error('Error en importación optimizada:', error)
      throw error
    }
  }, [importarUnified, context])

  // Función mejorada para importación automática
  const importarAutoOptimized = useCallback(async (
    archivo: File, 
    opciones: any
  ) => {
    try {
      // Proporcionar feedback inmediato
      if (context?.dispatch) {
        context.dispatch({ type: 'SET_IMPORTING', payload: true })
        context.dispatch({ type: 'SET_ERROR', payload: null })
        context.dispatch({ type: 'SET_SUCCESS', payload: null })
        
        // Crear un trabajo temporal para feedback inmediato
        const trabajoTemporal: any = {
          id: `temp-auto-${Date.now()}`,
          tipo: 'productos',
          estado: 'pendiente',
          empresaId: 0,
          usuarioId: 0,
          archivoOriginal: archivo.name,
          totalRegistros: 0,
          registrosProcesados: 0,
          registrosExitosos: 0,
          registrosConError: 0,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString(),
          progreso: 0,
          mensaje: 'Detectando tipo de datos...'
        }
        
        context.dispatch({ type: 'SET_CURRENT_TRABAJO', payload: trabajoTemporal })
      }

      // Ejecutar la importación automática real
      await importarAuto(archivo, opciones)
    } catch (error) {
      console.error('Error en importación automática optimizada:', error)
      throw error
    }
  }, [importarAuto, context])

  // Función para manejar errores de importación
  const handleImportError = (error: any, tipo?: TipoImportacion): UserFriendlyError => {
    // Si el error ya tiene un userFriendlyError (del interceptor), usarlo
    if ((error as any).userFriendlyError) {
      const baseError = (error as any).userFriendlyError as UserFriendlyError
      
      // Si tenemos el tipo, personalizar el error
      if (tipo) {
        return ErrorHandlerService.parseImportError(error, tipo)
      }
      
      return baseError
    }
    
    // Si no, crear uno nuevo
    if (tipo) {
      return ErrorHandlerService.parseImportError(error, tipo)
    }
    
    return ErrorHandlerService.parseBackendError(error)
  }

  return {
    // Estado
    ...safeState,
    trabajosRecientes,
    trabajosEnProgreso,
    estadisticas,
    
    // Acciones
    loadTrabajos,
    loadTiposSoportados,
    initializeData,
    importarUnified: importarUnifiedOptimized,
    importarAuto: importarAutoOptimized,
    validarAuto,
    descargarPlantilla,
    clearError,
    clearSuccess,
    clearValidationErrors,
    clearDeteccionTipo,
    startPolling,
    stopPolling,
    
    // Manejo de errores
    handleImportError,
    
    // Funciones adicionales con fallbacks
    cancelarTrabajo: (() => Promise.resolve()),
    descargarReporteErrores: (() => Promise.resolve()),
    importarProductos: (() => Promise.resolve()),
    importarProveedores: (() => Promise.resolve()),
    importarMovimientos: (() => Promise.resolve()),
    confirmarAuto: (() => Promise.resolve()),
    descargarPlantillaMejorada: (() => Promise.resolve()),
    
    // Utilidades
    isReady: safeState.isInitialized,
    hasData: safeState.trabajos && safeState.trabajos.length > 0,
    hasActiveImport: safeState.isImporting || (safeState.currentTrabajo && 
      (safeState.currentTrabajo.estado === 'pendiente' || safeState.currentTrabajo.estado === 'procesando'))
  }
} 