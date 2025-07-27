import { useMemo } from 'react'
import { useImportacionOptimized } from './useImportacionOptimized'

export const useImportacionSafe = () => {
  const importacionData = useImportacionOptimized()

  const safeData = useMemo(() => {
    // Si importacionData es undefined, usar valores por defecto
    if (!importacionData) {
      return {
        // Arrays
        trabajos: [],
        tiposSoportados: [],
        trabajosRecientes: [],
        trabajosEnProgreso: [],
        validationErrors: [],
        
        // Estados de carga
        isLoadingTrabajos: false,
        isLoadingTipos: false,
        isImporting: false,
        isValidating: false,
        
        // Estados de respuesta
        success: null,
        error: null,
        deteccionTipo: null,
        
        // Trabajo actual
        currentTrabajo: null,
        
        // Estadísticas
        estadisticas: {
          total: 0,
          completados: 0,
          conError: 0,
          enProgreso: 0,
          porcentajeExito: 0
        },
        
        // Funciones con fallbacks seguros
        descargarPlantilla: (tipo?: any) => Promise.resolve(),
        cancelarTrabajo: () => Promise.resolve(),
        descargarReporteErrores: () => Promise.resolve(),
        importarProductos: () => Promise.resolve(),
        importarProveedores: () => Promise.resolve(),
        importarMovimientos: () => Promise.resolve(),
        importarUnified: () => Promise.resolve(),
        importarUnificada: () => Promise.resolve(),
        importarAuto: () => Promise.resolve(),
        validarAuto: () => Promise.resolve(),
        confirmarAuto: () => Promise.resolve(),
        descargarPlantillaMejorada: () => Promise.resolve(),
        
        // Funciones de limpieza
        clearError: () => {},
        clearSuccess: () => {},
        clearValidationErrors: () => {},
        clearDeteccionTipo: () => {},
        
        // Manejo de errores
        handleImportError: () => ({ title: 'Error', message: 'Error desconocido', type: 'system' })
      }
    }

    return {
      ...importacionData,
      // Arrays
      trabajos: importacionData.trabajos || [],
      tiposSoportados: importacionData.tiposSoportados || [],
      trabajosRecientes: importacionData.trabajosRecientes || [],
      trabajosEnProgreso: importacionData.trabajosEnProgreso || [],
      validationErrors: importacionData.validationErrors || [],
      
      // Estados de carga
      isLoadingTrabajos: importacionData.isLoadingTrabajos || false,
      isLoadingTipos: importacionData.isLoadingTipos || false,
      isImporting: importacionData.isImporting || false,
      isValidating: importacionData.isValidating || false,
      
      // Estados de respuesta
      success: importacionData.success || null,
      error: importacionData.error || null,
      deteccionTipo: importacionData.deteccionTipo || null,
      
      // Trabajo actual
      currentTrabajo: importacionData.currentTrabajo || null,
      
      // Estadísticas
      estadisticas: {
        total: importacionData.estadisticas?.total || 0,
        completados: importacionData.estadisticas?.completados || 0,
        conError: importacionData.estadisticas?.conError || 0,
        enProgreso: importacionData.estadisticas?.enProgreso || 0,
        porcentajeExito: importacionData.estadisticas?.porcentajeExito || 0
      },
      
      // Funciones con fallbacks seguros
      descargarPlantilla: importacionData.descargarPlantilla || ((tipo?: any) => Promise.resolve()),
      cancelarTrabajo: importacionData.cancelarTrabajo || (() => Promise.resolve()),
      descargarReporteErrores: importacionData.descargarReporteErrores || (() => Promise.resolve()),
      importarProductos: importacionData.importarProductos || (() => Promise.resolve()),
      importarProveedores: importacionData.importarProveedores || (() => Promise.resolve()),
      importarMovimientos: importacionData.importarMovimientos || (() => Promise.resolve()),
      importarUnified: importacionData.importarUnified || (() => Promise.resolve()),
      importarUnificada: importacionData.importarUnificada || (() => Promise.resolve()),
      importarAuto: importacionData.importarAuto || (() => Promise.resolve()),
      validarAuto: importacionData.validarAuto || (() => Promise.resolve()),
      confirmarAuto: importacionData.confirmarAuto || (() => Promise.resolve()),
      descargarPlantillaMejorada: importacionData.descargarPlantillaMejorada || (() => Promise.resolve()),
      
      // Funciones de limpieza
      clearError: importacionData.clearError || (() => {}),
      clearSuccess: importacionData.clearSuccess || (() => {}),
      clearValidationErrors: importacionData.clearValidationErrors || (() => {}),
      clearDeteccionTipo: importacionData.clearDeteccionTipo || (() => {}),
      
      // Manejo de errores
      handleImportError: importacionData.handleImportError || (() => ({ title: 'Error', message: 'Error desconocido', type: 'system' }))
    }
  }, [importacionData])

  return safeData
} 