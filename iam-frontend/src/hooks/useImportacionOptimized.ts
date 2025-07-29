import { useMemo } from 'react'
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

  // Asegurar que el estado tenga valores por defecto
  const safeState = useMemo(() => ({
    ...state,
    isLoadingTrabajos: state?.isLoadingTrabajos || false,
    isLoadingTipos: state?.isLoadingTipos || false,
    lastFetchTime: state?.lastFetchTime || 0,
    trabajos: state?.trabajos || [],
    tiposSoportados: state?.tiposSoportados || [],
    isInitialized: state?.isInitialized || false,
    isImporting: state?.isImporting || false,
    currentTrabajo: state?.currentTrabajo || null,
    error: state?.error || null,
    success: state?.success || null,
    validationErrors: state?.validationErrors || null,
    deteccionTipo: state?.deteccionTipo || null,
    pollingInterval: state?.pollingInterval || null
  }), [state])

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
    importarUnified,
    importarAuto,
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
    isReady: safeState.isInitialized && !safeState.isLoadingTrabajos && !safeState.isLoadingTipos,
    hasData: safeState.trabajos.length > 0 || safeState.tiposSoportados.length > 0,
    hasActiveImport: safeState.isImporting || trabajosEnProgreso.length > 0
  }
} 