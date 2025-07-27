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
  lazyLoad?: boolean // Nuevo: cargar datos solo cuando se necesiten
}

interface ImportacionState {
  isImporting: boolean
  isLoading: boolean
  isInitialized: boolean
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
  maxPollingTime: 300000, // 5 minutos
  lazyLoad: true // Por defecto, cargar de forma lazy
}

export const useImportacionLazy = (options: UseImportacionOptions = {}) => {
  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options])

  const [state, setState] = useState<ImportacionState>({
    isImporting: false,
    isLoading: false,
    isInitialized: false,
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
  const initializationPromiseRef = useRef<Promise<void> | null>(null)

  // Función para detener polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Función para cargar trabajos de forma segura
  const loadTrabajos = useCallback(async (limit = 50, offset = 0) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await importacionAPI.listarTrabajos(limit, offset)
      setState(prev => ({
        ...prev,
        trabajos: response.trabajos || [],
        isLoading: false,
        isInitialized: true
      }))
    } catch (error) {
      console.error('Error al cargar trabajos:', error)
      setState(prev => ({
        ...prev,
        trabajos: [],
        isLoading: false,
        isInitialized: true,
        error: error instanceof Error ? error.message : 'Error al cargar trabajos'
      }))
    }
  }, [])

  // Función para cargar tipos soportados de forma segura
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

  // Función para inicializar datos (solo una vez)
  const initializeData = useCallback(async () => {
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current
    }

    initializationPromiseRef.current = (async () => {
      try {
        console.log('🔄 Inicializando datos de importación...')
        await Promise.all([
          loadTrabajos(),
          loadTiposSoportados()
        ])
        console.log('✅ Datos de importación inicializados correctamente')
      } catch (error) {
        console.error('❌ Error al inicializar datos:', error)
        setState(prev => ({ ...prev, isLoading: false, isInitialized: true }))
      }
    })()

    return initializationPromiseRef.current
  }, [loadTrabajos, loadTiposSoportados])

  // Función para forzar la carga de datos
  const forceLoad = useCallback(async () => {
    initializationPromiseRef.current = null
    setState(prev => ({ ...prev, isInitialized: false }))
    await initializeData()
  }, [initializeData])

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
        console.error('Error en polling:', error)
        stopPolling()
      }
    }

    poll()
  }, [config.autoPolling, config.pollingInterval, config.maxPollingTime, stopPolling, loadTrabajos])

  // Función para manejar respuesta de importación
  const handleImportResponse = useCallback((resultado: ResultadoImportacion, archivo: File, tipo: TipoImportacion) => {
    console.log('🔍 Respuesta del backend:', resultado);
    
    if (resultado.success) {
      const trabajo = {
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
      }
      
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
      
      if (resultado.erroresDetallados && resultado.erroresDetallados.length > 0) {
        const erroresCopiados = resultado.erroresDetallados.map(error => ({
          fila: error.fila,
          columna: error.columna,
          valor: error.valor,
          mensaje: error.mensaje,
          tipo: error.tipo
        }));
        
        setState(prev => ({
          ...prev,
          isImporting: false,
          validationErrors: erroresCopiados,
          error: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          isImporting: false,
          error: resultado.message,
          validationErrors: null
        }))
      }
    }
  }, [startPolling])

  // Funciones de importación
  const importarUnified = useCallback(async (archivo: File, tipo: TipoImportacion, opciones: any) => {
    // Asegurar que los datos estén inicializados
    if (!state.isInitialized) {
      await initializeData()
    }

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
      console.error('Error en importación:', error)
      setState(prev => ({
        ...prev,
        isImporting: false,
        error: error instanceof Error ? error.message : 'Error en importación'
      }))
    }
  }, [handleImportResponse, state.isInitialized, initializeData])

  const importarAuto = useCallback(async (archivo: File, opciones: ImportacionAutoDto) => {
    // Asegurar que los datos estén inicializados
    if (!state.isInitialized) {
      await initializeData()
    }

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
      console.error('Error en importación automática:', error)
      setState(prev => ({
        ...prev,
        isImporting: false,
        error: error instanceof Error ? error.message : 'Error en importación automática'
      }))
    }
  }, [handleImportResponse, state.isInitialized, initializeData])

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
      console.error('Error en validación automática:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error en validación automática'
      }))
      return null
    }
  }, [])

  // Funciones de limpieza
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const clearSuccess = useCallback(() => {
    setState(prev => ({ ...prev, success: null }))
  }, [])

  const clearValidationErrors = useCallback(() => {
    setState(prev => ({ ...prev, validationErrors: null }))
  }, [])

  const clearDeteccionTipo = useCallback(() => {
    setState(prev => ({ ...prev, deteccionTipo: null }))
  }, [])

  // Memoizar trabajos recientes
  const trabajosRecientes = useMemo(() => 
    state.trabajos?.slice(0, 5) || [], 
    [state.trabajos]
  )

  // Efectos
  useEffect(() => {
    // Solo inicializar automáticamente si no es lazy load
    if (!config.lazyLoad) {
      initializeData()
    }
  }, [config.lazyLoad, initializeData])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    ...state,
    trabajosRecientes,
    importarUnified,
    importarAuto,
    validarAuto,
    loadTrabajos,
    loadTiposSoportados,
    initializeData,
    forceLoad,
    clearError,
    clearSuccess,
    clearValidationErrors,
    clearDeteccionTipo,
    stopPolling
  }
} 