import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { 
  importacionAPI, 
  TrabajoImportacion, 
  ResultadoImportacion, 
  ImportacionValidationError,
  ImportacionUnificadaDto,
  ImportacionAutoDto,
  DeteccionTipoResponse,
  TiposSoportadosResponse,
  TipoSoportado
} from '@/lib/api/importacion'

export type TipoImportacion = 'productos' | 'proveedores' | 'movimientos'

interface UseImportacionOptions {
  autoPolling?: boolean
  pollingInterval?: number
  maxPollingTime?: number
}

interface ImportacionState {
  isImporting: boolean
  isLoading: boolean
  currentTrabajo: TrabajoImportacion | null
  trabajos: TrabajoImportacion[]
  error: string | null
  success: string | null
  validationErrors: ImportacionValidationError[] | null
  tiposSoportados: TipoSoportado[]
  deteccionTipo: DeteccionTipoResponse | null
  isLoadingTipos: boolean
}

// Configuración por defecto
const DEFAULT_OPTIONS: Required<UseImportacionOptions> = {
  autoPolling: true,
  pollingInterval: 2000,
  maxPollingTime: 300000 // 5 minutos
}

// Utilidades para manejo de errores
const createErrorHandler = (setState: React.Dispatch<React.SetStateAction<ImportacionState>>) => 
  (error: any, context: string) => {
    console.error(`Error en ${context}:`, error)
    setState(prev => ({
      ...prev,
      isImporting: false,
      error: error.message || `Error en ${context}`,
      validationErrors: null
    }))
  }

// Utilidades para limpiar estado
const createClearHandlers = (setState: React.Dispatch<React.SetStateAction<ImportacionState>>) => ({
  clearError: useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, []),
  
  clearSuccess: useCallback(() => {
    setState(prev => ({ ...prev, success: null }))
  }, []),
  
  clearValidationErrors: useCallback(() => {
    setState(prev => ({ ...prev, validationErrors: null }))
  }, []),

  clearDeteccionTipo: useCallback(() => {
    setState(prev => ({ ...prev, deteccionTipo: null }))
  }, [])
})

export const useImportacion = (options: UseImportacionOptions = {}) => {
  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options])

  const [state, setState] = useState<ImportacionState>({
    isImporting: false,
    isLoading: true,
    currentTrabajo: null,
    trabajos: [],
    error: null,
    success: null,
    validationErrors: null,
    tiposSoportados: [],
    deteccionTipo: null,
    isLoadingTipos: false
  })

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Handlers de limpieza
  const { clearError, clearSuccess, clearValidationErrors, clearDeteccionTipo } = createClearHandlers(setState)
  
  // Handler de errores
  const handleError = useMemo(() => createErrorHandler(setState), [])

  // Función para detener polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Función para iniciar polling
  const startPolling = useCallback((trabajoId: string) => {
    if (!config.autoPolling) return

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
          stopPolling()
          
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
        if (Date.now() - startTimeRef.current > config.maxPollingTime) {
          stopPolling()
          
          setState(prev => ({
            ...prev,
            isImporting: false,
            error: 'Tiempo de espera agotado. La importación puede estar procesándose en segundo plano.'
          }))
          return
        }

        // Continuar polling
        pollingRef.current = setTimeout(poll, config.pollingInterval)
      } catch (error) {
        handleError(error, 'polling')
        stopPolling()
      }
    }

    poll()
  }, [config.autoPolling, config.pollingInterval, config.maxPollingTime, stopPolling, handleError])

  // Función para cargar trabajos
  const loadTrabajos = useCallback(async (limit = 50, offset = 0) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await importacionAPI.listarTrabajos(limit, offset)
      setState(prev => ({
        ...prev,
        trabajos: response.trabajos || [],
        isLoading: false
      }))
    } catch (error) {
      console.error('Error al cargar trabajos:', error)
      setState(prev => ({
        ...prev,
        trabajos: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar trabajos'
      }))
    }
  }, [])

  // Función para cargar tipos soportados
  const loadTiposSoportados = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoadingTipos: true }))
      const response = await importacionAPI.obtenerTiposSoportados()
      setState(prev => ({
        ...prev,
        tiposSoportados: response.tipos || [],
        isLoadingTipos: false
      }))
    } catch (error) {
      console.error('Error al cargar tipos soportados:', error)
      setState(prev => ({ 
        ...prev, 
        tiposSoportados: [],
        isLoadingTipos: false 
      }))
    }
  }, [])

  // Función para crear trabajo de importación
  const createTrabajoFromResult = useCallback((resultado: ResultadoImportacion, archivo: File, tipo: TipoImportacion) => ({
    id: resultado.trabajoId,
    tipo,
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
  }), [])

  // Función para manejar respuesta de importación
  const handleImportResponse = useCallback((resultado: ResultadoImportacion, archivo: File, tipo: TipoImportacion) => {
    console.log('🔍 Respuesta del backend:', resultado);
    console.log('🔍 Tipo de resultado en handleImportResponse:', typeof resultado);
    console.log('🔍 Resultado.success en handleImportResponse:', resultado.success);
    console.log('🔍 Resultado.erroresDetallados en handleImportResponse:', resultado.erroresDetallados);
    console.log('🔍 Resultado.erroresDetallados?.length en handleImportResponse:', resultado.erroresDetallados?.length);
    
    if (resultado.success) {
      const trabajo = createTrabajoFromResult(resultado, archivo, tipo)
      
      setState(prev => ({
        ...prev,
        currentTrabajo: trabajo,
        deteccionTipo: resultado.deteccionTipo || null
      }))

      if (resultado.estado === 'pendiente' || resultado.estado === 'procesando') {
        startPolling(resultado.trabajoId)
      } else {
        setState(prev => ({
          ...prev,
          isImporting: false,
          success: `¡Importación de ${tipo} completada! ${resultado.totalRegistros || 0} registros procesados exitosamente.`
        }))
      }
    } else {
      console.log('❌ Respuesta con error:', resultado);
      console.log('🔍 Errores detallados:', resultado.erroresDetallados);
      
      // Verificar si hay errores de validación detallados
      console.log('🔍 Verificando erroresDetallados...');
      console.log('🔍 resultado.erroresDetallados existe:', !!resultado.erroresDetallados);
      console.log('🔍 resultado.erroresDetallados es array:', Array.isArray(resultado.erroresDetallados));
      console.log('🔍 resultado.erroresDetallados.length:', resultado.erroresDetallados?.length);
      
      if (resultado.erroresDetallados && resultado.erroresDetallados.length > 0) {
        console.log('✅ Configurando errores de validación:', resultado.erroresDetallados.length, 'errores');
        console.log('📋 Contenido de erroresDetallados:', JSON.stringify(resultado.erroresDetallados, null, 2));
        
        // Crear una copia del array para evitar referencias circulares
        const erroresCopiados = resultado.erroresDetallados.map(error => ({
          fila: error.fila,
          columna: error.columna,
          valor: error.valor,
          mensaje: error.mensaje,
          tipo: error.tipo
        }));
        
        console.log('📋 Errores copiados:', erroresCopiados);
        
        setState(prev => {
          console.log('🔍 Estado anterior:', prev);
          const nuevoEstado = {
            ...prev,
            isImporting: false,
            validationErrors: erroresCopiados,
            error: null
          };
          console.log('🔍 Nuevo estado:', nuevoEstado);
          return nuevoEstado;
        })
      } else {
        console.log('⚠️ Configurando error general:', resultado.message);
        setState(prev => ({
          ...prev,
          isImporting: false,
          error: resultado.message,
          validationErrors: null
        }))
      }
    }
  }, [createTrabajoFromResult, startPolling])

  // Función para importar productos (mantener compatibilidad)
  const importarProductos = useCallback(async (archivo: File, opciones: any) => {
    try {
      setState(prev => ({
        ...prev,
        isImporting: true,
        error: null,
        success: null,
        validationErrors: null
      }))

      console.log('🔄 Llamando a importacionAPI.importarProductos...');
      const resultado = await importacionAPI.importarProductos(archivo, opciones)
      console.log('📋 Resultado de importacionAPI:', resultado);
      console.log('📋 Tipo de resultado:', typeof resultado);
      console.log('📋 Resultado.success:', resultado.success);
      console.log('📋 Resultado.erroresDetallados:', resultado.erroresDetallados);
      console.log('📋 Resultado.erroresDetallados?.length:', resultado.erroresDetallados?.length);
      handleImportResponse(resultado, archivo, 'productos')
    } catch (error) {
      handleError(error, 'importar productos')
    }
  }, [handleImportResponse, handleError])

  // Función para importar proveedores (mantener compatibilidad)
  const importarProveedores = useCallback(async (archivo: File, opciones: any) => {
    try {
      setState(prev => ({
        ...prev,
        isImporting: true,
        error: null,
        success: null,
        validationErrors: null
      }))

      const resultado = await importacionAPI.importarProveedores(archivo, opciones)
      handleImportResponse(resultado, archivo, 'proveedores')
    } catch (error) {
      handleError(error, 'importar proveedores')
    }
  }, [handleImportResponse, handleError])

  // Función para importar movimientos (mantener compatibilidad)
  const importarMovimientos = useCallback(async (archivo: File, opciones: any) => {
    try {
      setState(prev => ({
        ...prev,
        isImporting: true,
        error: null,
        success: null,
        validationErrors: null
      }))

      const resultado = await importacionAPI.importarMovimientos(archivo, opciones)
      handleImportResponse(resultado, archivo, 'movimientos')
    } catch (error) {
      handleError(error, 'importar movimientos')
    }
  }, [handleImportResponse, handleError])

  // Función unificada para importar cualquier tipo
  const importarUnified = useCallback(async (archivo: File, tipo: TipoImportacion, opciones: any) => {
    setState(prev => ({
      ...prev,
      isImporting: true,
      error: null,
      success: null,
      validationErrors: null
    }))

    try {
      let resultado: ResultadoImportacion

      switch (tipo) {
        case 'productos':
          resultado = await importacionAPI.importarProductos(archivo, opciones)
          break
        case 'proveedores':
          resultado = await importacionAPI.importarProveedores(archivo, opciones)
          break
        case 'movimientos':
          resultado = await importacionAPI.importarMovimientos(archivo, opciones)
          break
        default:
          throw new Error(`Tipo de importación no soportado: ${tipo}`)
      }

      handleImportResponse(resultado, archivo, tipo)
    } catch (error) {
      handleError(error, `importar ${tipo}`)
    }
  }, [handleImportResponse, handleError])

  // Nueva función para importación unificada usando el nuevo endpoint
  const importarUnificada = useCallback(async (archivo: File, opciones: ImportacionUnificadaDto) => {
    setState(prev => ({
      ...prev,
      isImporting: true,
      error: null,
      success: null,
      validationErrors: null
    }))

    try {
      const resultado = await importacionAPI.importarUnificada(archivo, opciones)
      handleImportResponse(resultado, archivo, opciones.tipo)
    } catch (error) {
      handleError(error, 'importar unificada')
    }
  }, [handleImportResponse, handleError])

  // Nueva función para importación automática
  const importarAuto = useCallback(async (archivo: File, opciones: ImportacionAutoDto) => {
    setState(prev => ({
      ...prev,
      isImporting: true,
      error: null,
      success: null,
      validationErrors: null
    }))

    try {
      const resultado = await importacionAPI.importarAuto(archivo, opciones)
      handleImportResponse(resultado, archivo, 'auto')
    } catch (error) {
      handleError(error, 'importar auto')
    }
  }, [handleImportResponse, handleError])

  // Nueva función para validar automáticamente
  const validarAuto = useCallback(async (archivo: File, opciones?: any) => {
    try {
      setState(prev => ({
        ...prev,
        error: null,
        success: null,
        validationErrors: null
      }))

      const resultado = await importacionAPI.validarAuto(archivo, opciones)
      setState(prev => ({
        ...prev,
        deteccionTipo: resultado
      }))
      return resultado
    } catch (error) {
      handleError(error, 'validar auto')
      return null
    }
  }, [handleError])

  // Nueva función para confirmar tipo automático
  const confirmarAuto = useCallback(async (trabajoId: string, opciones: any) => {
    try {
      const resultado = await importacionAPI.confirmarAuto(trabajoId, opciones)
      handleImportResponse(resultado, {} as File, opciones.tipoConfirmado)
    } catch (error) {
      handleError(error, 'confirmar auto')
    }
  }, [handleImportResponse, handleError])

  // Función para cancelar trabajo
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
    } catch (error) {
      handleError(error, 'cancelar trabajo')
    }
  }, [state.currentTrabajo?.id, loadTrabajos, stopPolling, handleError])

  // Función para descargar reporte de errores
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
    } catch (error) {
      handleError(error, 'descargar reporte de errores')
    }
  }, [handleError])

  // Función para descargar plantilla
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
    } catch (error) {
      handleError(error, 'descargar plantilla')
    }
  }, [handleError])

  // Nueva función para descargar plantilla mejorada
  const descargarPlantillaMejorada = useCallback(async (tipo: TipoImportacion) => {
    try {
      const blob = await importacionAPI.descargarPlantillaMejorada(tipo)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plantilla-mejorada-${tipo}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      handleError(error, 'descargar plantilla mejorada')
    }
  }, [handleError])

  // Efectos
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadTrabajos(),
          loadTiposSoportados()
        ])
      } catch (error) {
        console.error('Error al inicializar datos:', error)
      }
    }

    initializeData()
  }, [loadTrabajos, loadTiposSoportados])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  // Memoizar trabajos recientes
  const trabajosRecientes = useMemo(() => 
    state.trabajos?.slice(0, 5) || [], 
    [state.trabajos]
  )

  // Log del estado completo para debug
  console.log('🔍 Estado completo del hook:', {
    isLoading: state.isLoading,
    isImporting: state.isImporting,
    currentTrabajo: state.currentTrabajo,
    trabajos: state.trabajos,
    trabajosLength: state.trabajos?.length,
    error: state.error,
    success: state.success,
    validationErrors: state.validationErrors,
    validationErrorsLength: state.validationErrors?.length,
    validationErrorsType: typeof state.validationErrors,
    validationErrorsIsArray: Array.isArray(state.validationErrors),
    tiposSoportados: state.tiposSoportados,
    deteccionTipo: state.deteccionTipo
  });

  return {
    ...state,
    trabajosRecientes,
    importarProductos,
    importarProveedores,
    importarMovimientos,
    importarUnified,
    importarUnificada,
    importarAuto,
    validarAuto,
    confirmarAuto,
    loadTrabajos,
    loadTiposSoportados,
    cancelarTrabajo,
    descargarReporteErrores,
    descargarPlantilla,
    descargarPlantillaMejorada,
    clearError,
    clearSuccess,
    clearValidationErrors,
    clearDeteccionTipo,
    stopPolling
  }
} 