import { useMemo } from 'react'
import { useImportacionGlobal } from '@/context/ImportacionGlobalContext'
import { TipoImportacion } from '@/context/ImportacionGlobalContext'
import { ErrorHandlerService, UserFriendlyError } from '@/lib/api/errorHandler'

export const useImportacionOptimized = () => {
  const {
    state,
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
    stopPolling
  } = useImportacionGlobal()

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

  // Memoizar estadísticas
  const estadisticas = useMemo(() => {
    const total = safeState.trabajos.length
    const completados = safeState.trabajos.filter(t => t.estado === 'completado').length
    const conError = safeState.trabajos.filter(t => t.estado === 'error').length
    const enProgreso = trabajosEnProgreso.length

    return {
      total,
      completados,
      conError,
      enProgreso,
      porcentajeExito: total > 0 ? Math.round((completados / total) * 100) : 0
    }
  }, [safeState.trabajos, trabajosEnProgreso])

  // Función para manejar errores de importación
  const handleImportError = (error: any, tipo?: TipoImportacion): UserFriendlyError => {
    console.log('🔍 Handling import error:', error)
    
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
    descargarPlantilla: descargarPlantilla || ((tipo?: any) => Promise.resolve()),
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