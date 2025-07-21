import { useState, useCallback, useEffect, useRef } from 'react'
import { importacionAPI, TrabajoImportacion, ResultadoImportacion } from '@/lib/api/importacion'

export type TipoImportacion = 'productos' | 'proveedores' | 'movimientos'

interface UseImportacionOptions {
  autoPolling?: boolean
  pollingInterval?: number
  maxPollingTime?: number
}

interface ImportacionState {
  isImporting: boolean
  currentTrabajo: TrabajoImportacion | null
  trabajos: TrabajoImportacion[]
  error: string | null
  success: string | null
}

export const useImportacion = (options: UseImportacionOptions = {}) => {
  const {
    autoPolling = true,
    pollingInterval = 2000,
    maxPollingTime = 300000 // 5 minutos
  } = options

  const [state, setState] = useState<ImportacionState>({
    isImporting: false,
    currentTrabajo: null,
    trabajos: [],
    error: null,
    success: null
  })

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const clearSuccess = useCallback(() => {
    setState(prev => ({ ...prev, success: null }))
  }, [])

  const startPolling = useCallback((trabajoId: string) => {
    if (!autoPolling) return

    startTimeRef.current = Date.now()
    
    const poll = async () => {
      try {
        const response = await importacionAPI.obtenerEstadoTrabajo(trabajoId)
        const trabajo = response.trabajo

        setState(prev => ({
          ...prev,
          currentTrabajo: trabajo,
          isImporting: trabajo.estado === 'pendiente' || trabajo.estado === 'procesando'
        }))

        // Detener polling si el trabajo está completo o hay error
        if (trabajo.estado === 'completado' || trabajo.estado === 'error' || trabajo.estado === 'cancelado') {
          if (pollingRef.current) {
            clearTimeout(pollingRef.current)
            pollingRef.current = null
          }
          
          setState(prev => ({
            ...prev,
            isImporting: false,
            success: trabajo.estado === 'completado' 
              ? `Importación completada: ${trabajo.registrosExitosos} registros procesados exitosamente`
              : null,
            error: trabajo.estado === 'error' 
              ? `Error en la importación: ${trabajo.mensaje || 'Error desconocido'}`
              : null
          }))
          
          // Actualizar la lista de trabajos
          await loadTrabajos()
          return
        }

        // Verificar tiempo máximo de polling
        if (Date.now() - startTimeRef.current > maxPollingTime) {
          if (pollingRef.current) {
            clearTimeout(pollingRef.current)
            pollingRef.current = null
          }
          
          setState(prev => ({
            ...prev,
            isImporting: false,
            error: 'Tiempo de espera agotado. La importación puede estar procesándose en segundo plano.'
          }))
          return
        }

        // Continuar polling
        pollingRef.current = setTimeout(poll, pollingInterval)
      } catch (error) {
        console.error('Error al obtener estado del trabajo:', error)
        setState(prev => ({
          ...prev,
          isImporting: false,
          error: 'Error al verificar el estado de la importación'
        }))
      }
    }

    poll()
  }, [autoPolling, pollingInterval, maxPollingTime])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const importarProductos = useCallback(async (archivo: File, opciones: any) => {
    try {
      setState(prev => ({
        ...prev,
        isImporting: true,
        error: null,
        success: null
      }))

      const resultado = await importacionAPI.importarProductos(archivo, opciones)
      
      if (resultado.success) {
        setState(prev => ({
          ...prev,
          currentTrabajo: {
            id: resultado.trabajoId,
            tipo: 'productos',
            estado: resultado.estado as any,
            empresaId: 0,
            usuarioId: 0,
            archivoOriginal: archivo.name,
            totalRegistros: resultado.totalRegistros || 0,
            registrosProcesados: 0,
            registrosExitosos: 0,
            registrosConError: resultado.errores || 0,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            progreso: 0
          }
        }))

        if (resultado.estado === 'pendiente' || resultado.estado === 'procesando') {
          startPolling(resultado.trabajoId)
        } else {
          setState(prev => ({
            ...prev,
            isImporting: false,
            success: resultado.message
          }))
        }
      } else {
        setState(prev => ({
          ...prev,
          isImporting: false,
          error: resultado.message
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isImporting: false,
        error: error.message || 'Error al importar productos'
      }))
    }
  }, [startPolling])

  const importarProveedores = useCallback(async (archivo: File, opciones: any) => {
    try {
      setState(prev => ({
        ...prev,
        isImporting: true,
        error: null,
        success: null
      }))

      const resultado = await importacionAPI.importarProveedores(archivo, opciones)
      
      if (resultado.success) {
        setState(prev => ({
          ...prev,
          currentTrabajo: {
            id: resultado.trabajoId,
            tipo: 'proveedores',
            estado: resultado.estado as any,
            empresaId: 0,
            usuarioId: 0,
            archivoOriginal: archivo.name,
            totalRegistros: resultado.totalRegistros || 0,
            registrosProcesados: 0,
            registrosExitosos: 0,
            registrosConError: resultado.errores || 0,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            progreso: 0
          }
        }))

        if (resultado.estado === 'pendiente' || resultado.estado === 'procesando') {
          startPolling(resultado.trabajoId)
        } else {
          setState(prev => ({
            ...prev,
            isImporting: false,
            success: resultado.message
          }))
        }
      } else {
        setState(prev => ({
          ...prev,
          isImporting: false,
          error: resultado.message
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isImporting: false,
        error: error.message || 'Error al importar proveedores'
      }))
    }
  }, [startPolling])

  const importarMovimientos = useCallback(async (archivo: File, opciones: any) => {
    try {
      setState(prev => ({
        ...prev,
        isImporting: true,
        error: null,
        success: null
      }))

      const resultado = await importacionAPI.importarMovimientos(archivo, opciones)
      
      if (resultado.success) {
        setState(prev => ({
          ...prev,
          currentTrabajo: {
            id: resultado.trabajoId,
            tipo: 'movimientos',
            estado: resultado.estado as any,
            empresaId: 0,
            usuarioId: 0,
            archivoOriginal: archivo.name,
            totalRegistros: resultado.totalRegistros || 0,
            registrosProcesados: 0,
            registrosExitosos: 0,
            registrosConError: resultado.errores || 0,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            progreso: 0
          }
        }))

        if (resultado.estado === 'pendiente' || resultado.estado === 'procesando') {
          startPolling(resultado.trabajoId)
        } else {
          setState(prev => ({
            ...prev,
            isImporting: false,
            success: resultado.message
          }))
        }
      } else {
        setState(prev => ({
          ...prev,
          isImporting: false,
          error: resultado.message
        }))
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isImporting: false,
        error: error.message || 'Error al importar movimientos'
      }))
    }
  }, [startPolling])

  const loadTrabajos = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await importacionAPI.listarTrabajos(limit, offset)
      setState(prev => ({
        ...prev,
        trabajos: response.trabajos
      }))
    } catch (error: any) {
      console.error('Error al cargar trabajos:', error)
    }
  }, [])

  const cancelarTrabajo = useCallback(async (trabajoId: string) => {
    try {
      await importacionAPI.cancelarTrabajo(trabajoId)
      await loadTrabajos()
      
      if (state.currentTrabajo?.id === trabajoId) {
        setState(prev => ({
          ...prev,
          currentTrabajo: null,
          isImporting: false,
          success: 'Trabajo cancelado exitosamente'
        }))
        stopPolling()
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Error al cancelar el trabajo'
      }))
    }
  }, [state.currentTrabajo?.id, loadTrabajos, stopPolling])

  const descargarReporteErrores = useCallback(async (trabajoId: string) => {
    try {
      const blob = await importacionAPI.descargarReporteErrores(trabajoId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `errores-${trabajoId}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Error al descargar el reporte de errores'
      }))
    }
  }, [])

  const descargarPlantilla = useCallback(async (tipo: TipoImportacion) => {
    try {
      const blob = await importacionAPI.descargarPlantilla(tipo)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plantilla-${tipo}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Error al descargar la plantilla'
      }))
    }
  }, [])

  useEffect(() => {
    loadTrabajos()
  }, [loadTrabajos])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    ...state,
    importarProductos,
    importarProveedores,
    importarMovimientos,
    loadTrabajos,
    cancelarTrabajo,
    descargarReporteErrores,
    descargarPlantilla,
    clearError,
    clearSuccess,
    stopPolling
  }
} 