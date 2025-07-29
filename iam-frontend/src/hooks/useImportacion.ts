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
import { useServerUser } from '@/context/ServerUserContext'

export type TipoImportacion = 'productos' | 'proveedores' | 'movimientos' | 'auto'

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

// Configuración por defecto optimizada
const DEFAULT_OPTIONS: Required<UseImportacionOptions> = {
  autoPolling: true,
  pollingInterval: 3000, // Aumentado a 3 segundos
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
  const user = useServerUser()
  const isAuthenticated = !!user

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

  // Función para generar mensajes de error detallados
  const generateDetailedErrorMessage = useCallback((trabajo: any) => {
    if (trabajo.registrosConError > 0 && trabajo.registrosExitosos === 0) {
      // Todos los registros fallaron
      if (trabajo.registrosConError === trabajo.totalRegistros) {
        return `Todos los productos ya existen en la base de datos. Para sobrescribirlos, activa la opción "Sobrescribir existentes" en las opciones avanzadas.`
      }
      return `No se pudo importar ningún producto. ${trabajo.registrosConError} de ${trabajo.totalRegistros} registros tienen errores.`
    } else if (trabajo.registrosConError > 0) {
      // Algunos registros fallaron
      return `Importación completada parcialmente: ${trabajo.registrosExitosos} productos importados exitosamente, ${trabajo.registrosConError} con errores.`
    } else {
      // Error general
      return trabajo.mensaje || `Error en la importación: ${trabajo.registrosConError} errores encontrados`
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

        // Verificar si el trabajo está realmente completado o tiene errores
        const isCompleted = trabajo.estado === 'completado' && trabajo.progreso >= 100
        const hasError = trabajo.estado === 'error' || (trabajo.registrosConError > 0 && trabajo.registrosProcesados === trabajo.totalRegistros)
        const isCancelled = trabajo.estado === 'cancelado'
        
        // Detener polling si está completado, tiene error o fue cancelado
        if (isCompleted || hasError || isCancelled) {
          stopPolling()
          
          setState(prev => ({
            ...prev,
            isImporting: false,
            success: isCompleted 
              ? `Importación completada: ${trabajo.registrosExitosos} registros procesados exitosamente`
              : null,
            error: hasError 
              ? generateDetailedErrorMessage(trabajo)
              : isCancelled
              ? 'Importación cancelada'
              : null
          }))
          
          // Actualizar la lista de trabajos
          await loadTrabajos()
          return
        }

        // Si el trabajo está en estado 'completado' pero el progreso no es 100%, 
        // continuar polling hasta que realmente termine
        if (trabajo.estado === 'completado' && trabajo.progreso < 100) {
          console.log(`⚠️ Trabajo marcado como completado pero progreso es ${trabajo.progreso}%. Continuando polling...`)
        }

        // Si todos los registros han sido procesados pero hay errores, considerar como completado con errores
        if (trabajo.registrosProcesados === trabajo.totalRegistros && trabajo.registrosProcesados > 0) {
          console.log(`⚠️ Todos los registros procesados (${trabajo.registrosProcesados}/${trabajo.totalRegistros}) pero con ${trabajo.registrosConError} errores`)
          
          // Si hay errores, detener el polling y mostrar el error
          if (trabajo.registrosConError > 0) {
            stopPolling()
            
            setState(prev => ({
              ...prev,
              isImporting: false,
              error: `Importación completada con errores: ${trabajo.registrosConError} de ${trabajo.totalRegistros} registros tienen errores`
            }))
            
            await loadTrabajos()
            return
          }
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

        // Continuar polling solo si el trabajo está activo
        if (trabajo.estado === 'pendiente' || trabajo.estado === 'procesando') {
          pollingRef.current = setTimeout(poll, config.pollingInterval)
        } else {
          // Si el trabajo no está activo, detener polling
          stopPolling()
        }
      } catch (error) {
        handleError(error, 'polling')
        stopPolling()
      }
    }

    poll()
  }, [config.autoPolling, config.pollingInterval, config.maxPollingTime, stopPolling, handleError, loadTrabajos])

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
    tipo: tipo === 'auto' ? 'productos' : tipo,
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
  const handleImportResponse = useCallback((resultado: any, archivo: File, tipo: TipoImportacion) => {
    // Manejar diferentes estructuras de respuesta del backend
    const isSuccess = resultado.success !== false && (resultado.trabajoId || resultado.success)
    const trabajoId = resultado.trabajoId
    const estado = resultado.estado
    const mensaje = resultado.mensaje || resultado.message
    const totalRegistros = resultado.totalRegistros || resultado.estadisticas?.total || 0
    const errores = resultado.errores || resultado.estadisticas?.errores || 0
    
    if (isSuccess) {
      const trabajo = {
        id: trabajoId,
        tipo: tipo === 'auto' ? 'productos' : tipo,
        estado: estado as any,
        empresaId: 0,
        usuarioId: 0,
        archivoOriginal: archivo.name,
        totalRegistros: totalRegistros,
        registrosProcesados: 0,
        registrosExitosos: 0,
        registrosConError: errores,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        progreso: 0
      }
      
      setState(prev => ({
        ...prev,
        currentTrabajo: trabajo,
        deteccionTipo: resultado.deteccionTipo || null
      }))

      if (estado === 'pendiente' || estado === 'procesando') {
        startPolling(trabajoId)
      } else {
        setState(prev => ({
          ...prev,
          isImporting: false,
          success: mensaje || `¡Importación de ${tipo} completada! ${totalRegistros} registros procesados exitosamente.`
        }))
      }
    } else {
      if (resultado.erroresDetallados && resultado.erroresDetallados.length > 0) {
        const erroresCopiados = resultado.erroresDetallados.map((error: any) => ({
          fila: error.fila,
          columna: error.columna,
          valor: error.valor,
          mensaje: error.mensaje,
          tipo: error.tipo
        }))
        
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
          error: mensaje || 'Error en la importación',
          validationErrors: null
        }))
      }
    }
  }, [startPolling])

  // Función para importar productos (mantener compatibilidad)
  const importarProductos = useCallback(async (archivo: File, opciones: any) => {
    setState(prev => ({
      ...prev,
      isImporting: true,
      error: null,
      success: null,
      validationErrors: null
    }))

    try {
      const resultado = await importacionAPI.importarProductos(archivo, opciones)
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

  // Función para descargar plantillas
  const descargarPlantilla = useCallback(async (tipo: TipoImportacion) => {
    try {
      // Si el tipo es 'auto', usar 'productos' como fallback
      const tipoPlantilla = tipo === 'auto' ? 'productos' : tipo
      
      // Usar las nuevas rutas de plantillas automáticas
      const blob = await importacionAPI.obtenerMejorPlantilla(tipoPlantilla)
      
      if (!blob.success || !blob.data) {
        throw new Error('No se pudo obtener la plantilla')
      }
      
      // Descargar la mejor plantilla disponible
      const plantillaBlob = await importacionAPI.descargarPlantillaAuto(tipoPlantilla, blob.data.nombre)
      const url = window.URL.createObjectURL(plantillaBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = blob.data.nombre
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al descargar plantilla:', error)
      setState(prev => ({ ...prev, error: 'Error al descargar la plantilla' }))
    }
  }, [])

  // Nueva función para descargar plantilla mejorada
  const descargarPlantillaMejorada = useCallback(async (tipo: TipoImportacion) => {
    try {
      // Si el tipo es 'auto', usar 'productos' como fallback
      const tipoPlantilla = tipo === 'auto' ? 'productos' : tipo
      
      // Buscar plantillas mejoradas del tipo específico
      const plantillas = await importacionAPI.buscarPlantillas({
        tipo: tipoPlantilla,
        incluirMejoradas: true
      })
      
      if (!plantillas.success || !plantillas.data.plantillas.length) {
        throw new Error('No se encontraron plantillas mejoradas')
      }
      
      // Obtener la primera plantilla mejorada
      const plantillaMejorada = plantillas.data.plantillas[0]
      
      // Descargar la plantilla mejorada
      const plantillaBlob = await importacionAPI.descargarPlantillaAuto(tipoPlantilla, plantillaMejorada.nombre)
      const url = window.URL.createObjectURL(plantillaBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = plantillaMejorada.nombre
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al descargar plantilla mejorada:', error)
      setState(prev => ({ ...prev, error: 'Error al descargar la plantilla mejorada' }))
    }
  }, [])

  // Efectos
  useEffect(() => {
    const initializeData = async () => {
      if (!isAuthenticated) return
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
  }, [loadTrabajos, loadTiposSoportados, isAuthenticated])

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