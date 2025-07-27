'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, ReactNode } from 'react'
import { importacionAPI } from '@/lib/api/importacion'
import { TrabajoImportacion, TipoSoportado, ImportacionValidationError, DeteccionTipoResponse, ResultadoImportacion, ImportacionAutoDto } from '@/lib/api/importacion'
import { useServerUser } from '@/context/ServerUserContext'

export type TipoImportacion = 'productos' | 'proveedores' | 'movimientos' | 'auto'

// Estado inicial
interface ImportacionGlobalState {
  // Datos
  trabajos: TrabajoImportacion[]
  tiposSoportados: TipoSoportado[]
  
  // Estados de carga
  isLoadingTrabajos: boolean
  isLoadingTipos: boolean
  isInitialized: boolean
  
  // Estado actual de importación
  isImporting: boolean
  currentTrabajo: TrabajoImportacion | null
  
  // Estados de error/éxito
  error: string | null
  success: string | null
  validationErrors: ImportacionValidationError[] | null
  deteccionTipo: DeteccionTipoResponse | null
  
  // Cache y control
  lastFetchTime: number
  pollingInterval: NodeJS.Timeout | null
}

const initialState: ImportacionGlobalState = {
  trabajos: [],
  tiposSoportados: [],
  isLoadingTrabajos: false,
  isLoadingTipos: false,
  isInitialized: false,
  isImporting: false,
  currentTrabajo: null,
  error: null,
  success: null,
  validationErrors: null,
  deteccionTipo: null,
  lastFetchTime: 0,
  pollingInterval: null
}

// Acciones
type ImportacionAction =
  | { type: 'SET_LOADING_TRABAJOS'; payload: boolean }
  | { type: 'SET_LOADING_TIPOS'; payload: boolean }
  | { type: 'SET_TRABAJOS'; payload: TrabajoImportacion[] }
  | { type: 'SET_TIPOS_SOPORTADOS'; payload: TipoSoportado[] }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_IMPORTING'; payload: boolean }
  | { type: 'SET_CURRENT_TRABAJO'; payload: TrabajoImportacion | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ImportacionValidationError[] | null }
  | { type: 'SET_DETECCION_TIPO'; payload: DeteccionTipoResponse | null }
  | { type: 'SET_LAST_FETCH_TIME'; payload: number }
  | { type: 'SET_POLLING_INTERVAL'; payload: NodeJS.Timeout | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_SUCCESS' }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  | { type: 'CLEAR_DETECCION_TIPO' }
  | { type: 'RESET_STATE' }

// Reducer
function importacionReducer(state: ImportacionGlobalState, action: ImportacionAction): ImportacionGlobalState {
  switch (action.type) {
    case 'SET_LOADING_TRABAJOS':
      return { ...state, isLoadingTrabajos: action.payload }
    case 'SET_LOADING_TIPOS':
      return { ...state, isLoadingTipos: action.payload }
    case 'SET_TRABAJOS':
      return { ...state, trabajos: action.payload }
    case 'SET_TIPOS_SOPORTADOS':
      return { ...state, tiposSoportados: action.payload }
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload }
    case 'SET_IMPORTING':
      return { ...state, isImporting: action.payload }
    case 'SET_CURRENT_TRABAJO':
      return { ...state, currentTrabajo: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_SUCCESS':
      return { ...state, success: action.payload }
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload }
    case 'SET_DETECCION_TIPO':
      return { ...state, deteccionTipo: action.payload }
    case 'SET_LAST_FETCH_TIME':
      return { ...state, lastFetchTime: action.payload }
    case 'SET_POLLING_INTERVAL':
      return { ...state, pollingInterval: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'CLEAR_SUCCESS':
      return { ...state, success: null }
    case 'CLEAR_VALIDATION_ERRORS':
      return { ...state, validationErrors: null }
    case 'CLEAR_DETECCION_TIPO':
      return { ...state, deteccionTipo: null }
    case 'RESET_STATE':
      return initialState
    default:
      return state
  }
}

// Contexto
interface ImportacionGlobalContextType {
  state: ImportacionGlobalState
  dispatch: React.Dispatch<ImportacionAction>
  
  // Acciones
  loadTrabajos: (force?: boolean) => Promise<void>
  loadTiposSoportados: (force?: boolean) => Promise<void>
  initializeData: () => Promise<void>
  
  // Importación
  importarUnified: (archivo: File, tipo: TipoImportacion, opciones: any) => Promise<void>
  importarAuto: (archivo: File, opciones: ImportacionAutoDto) => Promise<void>
  validarAuto: (archivo: File, opciones?: any) => Promise<DeteccionTipoResponse | null>
  
  // Plantillas
  descargarPlantilla: (tipo: TipoImportacion) => Promise<void>
  
  // Limpieza
  clearError: () => void
  clearSuccess: () => void
  clearValidationErrors: () => void
  clearDeteccionTipo: () => void
  
  // Polling
  startPolling: (trabajoId: string) => void
  stopPolling: () => void
}

const ImportacionGlobalContext = createContext<ImportacionGlobalContextType | undefined>(undefined)

// Provider
interface ImportacionGlobalProviderProps {
  children: ReactNode
}

export function ImportacionGlobalProvider({ children }: ImportacionGlobalProviderProps) {
  const [state, dispatch] = useReducer(importacionReducer, initialState)
  const user = useServerUser()
  
  // Verificar si el usuario está autenticado usando el contexto directamente
  const isAuthenticated = !!user
  
  // Log de verificación para confirmar que el contexto funciona
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 ImportacionGlobalProvider - Verificación de contexto:', {
      userExists: !!user,
      userEmail: user?.email,
      isAuthenticated,
      contextWorking: true
    })
  }

  // Función para cargar trabajos con cache
  const loadTrabajos = useCallback(async (force = false) => {
    const now = Date.now()
    const cacheTime = 30000 // 30 segundos de cache
    
    // Evitar peticiones duplicadas y respetar cache
    if (!force && 
        state.isLoadingTrabajos || 
        (now - state.lastFetchTime < cacheTime && state.trabajos && state.trabajos.length > 0)) {
      return
    }

    try {
      dispatch({ type: 'SET_LOADING_TRABAJOS', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      const response = await importacionAPI.listarTrabajos(50, 0)
      const trabajos = response?.trabajos || []
      dispatch({ type: 'SET_TRABAJOS', payload: trabajos })
      dispatch({ type: 'SET_LAST_FETCH_TIME', payload: now })
    } catch (error) {
      console.error('Error al cargar trabajos:', error)
      dispatch({ type: 'SET_TRABAJOS', payload: [] })
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Error al cargar trabajos' })
    } finally {
      dispatch({ type: 'SET_LOADING_TRABAJOS', payload: false })
    }
  }, [state.isLoadingTrabajos, state.lastFetchTime, state.trabajos])

  // Función para cargar tipos soportados con cache
  const loadTiposSoportados = useCallback(async (force = false) => {
    // Cache más largo para tipos soportados (5 minutos)
    const now = Date.now()
    const cacheTime = 300000 // 5 minutos
    
    if (!force && 
        state.isLoadingTipos || 
        (now - state.lastFetchTime < cacheTime && state.tiposSoportados && state.tiposSoportados.length > 0)) {
      return
    }

    try {
      dispatch({ type: 'SET_LOADING_TIPOS', payload: true })
      
      const response = await importacionAPI.obtenerTiposSoportados()
      const tipos = response?.tipos || []
      dispatch({ type: 'SET_TIPOS_SOPORTADOS', payload: tipos })
    } catch (error) {
      console.error('Error al cargar tipos soportados:', error)
      dispatch({ type: 'SET_TIPOS_SOPORTADOS', payload: [] })
    } finally {
      dispatch({ type: 'SET_LOADING_TIPOS', payload: false })
    }
  }, [state.isLoadingTipos, state.lastFetchTime, state.tiposSoportados])

  // Función para inicializar datos
  const initializeData = useCallback(async () => {
    if (state.isInitialized) return

    try {
      console.log('🔄 Inicializando datos de importación...')
      await Promise.all([
        loadTrabajos(true),
        loadTiposSoportados(true)
      ])
      dispatch({ type: 'SET_INITIALIZED', payload: true })
      console.log('✅ Datos de importación inicializados correctamente')
    } catch (error) {
      console.error('❌ Error al inicializar datos:', error)
      dispatch({ type: 'SET_INITIALIZED', payload: true })
    }
  }, [state.isInitialized, loadTrabajos, loadTiposSoportados])

  // Función para manejar respuesta de importación
  const handleImportResponse = useCallback((resultado: any, archivo: File, tipo: TipoImportacion) => {
    console.log('🔍 Respuesta del backend:', resultado)
    
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
      
      dispatch({ type: 'SET_CURRENT_TRABAJO', payload: trabajo })
      dispatch({ type: 'SET_DETECCION_TIPO', payload: resultado.deteccionTipo || null })

      if (estado === 'pendiente' || estado === 'procesando') {
        startPolling(trabajoId)
      } else {
        dispatch({ type: 'SET_IMPORTING', payload: false })
        dispatch({ 
          type: 'SET_SUCCESS', 
          payload: mensaje || `¡Importación de ${tipo} completada! ${totalRegistros} registros procesados exitosamente.` 
        })
      }
    } else {
      console.log('❌ Respuesta con error:', resultado)
      
      if (resultado.erroresDetallados && resultado.erroresDetallados.length > 0) {
        const erroresCopiados = resultado.erroresDetallados.map((error: any) => ({
          fila: error.fila,
          columna: error.columna,
          valor: error.valor,
          mensaje: error.mensaje,
          tipo: error.tipo
        }))
        
        dispatch({ type: 'SET_IMPORTING', payload: false })
        dispatch({ type: 'SET_VALIDATION_ERRORS', payload: erroresCopiados })
        dispatch({ type: 'SET_ERROR', payload: null })
      } else {
        dispatch({ type: 'SET_IMPORTING', payload: false })
        dispatch({ type: 'SET_ERROR', payload: mensaje || 'Error en la importación' })
        dispatch({ type: 'SET_VALIDATION_ERRORS', payload: null })
      }
    }
  }, [])

  // Funciones de importación
  const importarUnified = useCallback(async (archivo: File, tipo: TipoImportacion, opciones: any) => {
    if (!state.isInitialized) {
      await initializeData()
    }

    dispatch({ type: 'SET_IMPORTING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_SUCCESS', payload: null })
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: null })

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
      dispatch({ type: 'SET_IMPORTING', payload: false })
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Error en importación' })
    }
  }, [state.isInitialized, initializeData, handleImportResponse])

  const importarAuto = useCallback(async (archivo: File, opciones: ImportacionAutoDto) => {
    if (!state.isInitialized) {
      await initializeData()
    }

    dispatch({ type: 'SET_IMPORTING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_SUCCESS', payload: null })
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: null })

    try {
      const resultado = await importacionAPI.importarAuto(archivo, opciones)
      handleImportResponse(resultado, archivo, 'productos')
    } catch (error) {
      console.error('Error en importación automática:', error)
      dispatch({ type: 'SET_IMPORTING', payload: false })
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Error en importación automática' })
    }
  }, [state.isInitialized, initializeData, handleImportResponse])

  const validarAuto = useCallback(async (archivo: File, opciones?: any) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })
      dispatch({ type: 'SET_SUCCESS', payload: null })
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: null })

      const resultado = await importacionAPI.validarAuto(archivo, opciones)
      dispatch({ type: 'SET_DETECCION_TIPO', payload: resultado })
      return resultado
    } catch (error) {
      console.error('Error en validación automática:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Error en validación automática' })
      return null
    }
  }, [])

  // Funciones de polling
  const startPolling = useCallback((trabajoId: string) => {
    // Detener polling anterior si existe
    if (state.pollingInterval) {
      clearTimeout(state.pollingInterval)
    }

    // Timeout de seguridad para evitar polling infinito (5 minutos)
    const safetyTimeout = setTimeout(() => {
      console.log('⚠️ Polling - Timeout de seguridad alcanzado, deteniendo polling')
      dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
      dispatch({ type: 'SET_IMPORTING', payload: false })
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Timeout: La importación tardó demasiado en completarse'
      })
    }, 5 * 60 * 1000) // 5 minutos

    const poll = async () => {
      try {
        const response = await importacionAPI.obtenerEstadoTrabajo(trabajoId)
        const trabajo = response.trabajo

        // Solo loggear cambios significativos para reducir logs
        const currentTrabajo = state.currentTrabajo
        const hasSignificantChange = !currentTrabajo || 
          currentTrabajo.estado !== trabajo.estado ||
          currentTrabajo.progreso !== trabajo.progreso ||
          currentTrabajo.registrosExitosos !== trabajo.registrosExitosos ||
          currentTrabajo.registrosConError !== trabajo.registrosConError

        if (hasSignificantChange && process.env.NODE_ENV === 'development') {
          console.log('🔄 Polling - Estado del trabajo:', {
            id: trabajo.id,
            estado: trabajo.estado,
            progreso: trabajo.progreso,
            registrosExitosos: trabajo.registrosExitosos,
            registrosConError: trabajo.registrosConError,
            totalRegistros: trabajo.totalRegistros
          })
        }

        dispatch({ type: 'SET_CURRENT_TRABAJO', payload: trabajo })
        
        // Solo mostrar como importando si está pendiente o procesando
        const isStillImporting = trabajo.estado === 'pendiente' || trabajo.estado === 'procesando'
        dispatch({ type: 'SET_IMPORTING', payload: isStillImporting })

        // Verificar si el trabajo está realmente completado
        const isCompleted = trabajo.estado === 'completado'
        const hasError = trabajo.estado === 'error'
        const isCancelled = trabajo.estado === 'cancelado'
        const hasErrors = trabajo.registrosConError > 0
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Polling - Análisis de estado:', {
            isCompleted,
            hasError,
            isCancelled,
            hasErrors,
            shouldStop: isCompleted || hasError || isCancelled
          })
        }
        
        // Detener polling si el trabajo está completado, tiene error, fue cancelado, o tiene errores
        if (isCompleted || hasError || isCancelled) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Polling - Deteniendo polling, trabajo finalizado')
          }
          clearTimeout(safetyTimeout) // Limpiar timeout de seguridad
          dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
          dispatch({ type: 'SET_IMPORTING', payload: false })
          
          if (isCompleted) {
            if (hasErrors) {
              // Si está completado pero tiene errores, mostrar mensaje de advertencia
              dispatch({ 
                type: 'SET_ERROR', 
                payload: `Importación completada con errores: ${trabajo.registrosConError} registros con errores, ${trabajo.registrosExitosos} exitosos`
              })
              dispatch({ type: 'SET_SUCCESS', payload: null })
              
              // Si hay errores detallados, mostrarlos
              if (trabajo.errores && trabajo.errores.length > 0) {
                const erroresDetallados = Array.isArray(trabajo.errores) 
                  ? trabajo.errores.map((error, index) => {
                      if (typeof error === 'string') {
                        return {
                          fila: index + 1,
                          columna: 'general',
                          valor: '',
                          mensaje: error,
                          tipo: 'sistema'
                        }
                      }
                      return error
                    })
                  : []
                
                dispatch({ type: 'SET_VALIDATION_ERRORS', payload: erroresDetallados })
              }
            } else {
              // Si está completado sin errores, mostrar éxito
              dispatch({ 
                type: 'SET_SUCCESS', 
                payload: `Importación completada exitosamente: ${trabajo.registrosExitosos} registros procesados`
              })
              dispatch({ type: 'SET_ERROR', payload: null })
            }
          } else if (hasError) {
            console.log('❌ Polling - Trabajo con error:', trabajo.mensaje)
            dispatch({ 
              type: 'SET_ERROR', 
              payload: `Error en la importación: ${trabajo.mensaje || 'Error desconocido'}`
            })
            dispatch({ type: 'SET_SUCCESS', payload: null })
          } else if (isCancelled) {
            dispatch({ 
              type: 'SET_ERROR', 
              payload: 'Importación cancelada'
            })
            dispatch({ type: 'SET_SUCCESS', payload: null })
          }
          
          // Actualizar lista de trabajos
          await loadTrabajos(true)
          return
        }

        // Continuar polling
        const interval = setTimeout(poll, 2000)
        dispatch({ type: 'SET_POLLING_INTERVAL', payload: interval })
      } catch (error) {
        console.error('Error en polling:', error)
        clearTimeout(safetyTimeout) // Limpiar timeout de seguridad
        dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
        dispatch({ type: 'SET_IMPORTING', payload: false })
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Error al verificar el estado de la importación'
        })
      }
    }

    poll()
  }, [state.pollingInterval, loadTrabajos])

  const stopPolling = useCallback(() => {
    if (state.pollingInterval) {
      clearTimeout(state.pollingInterval)
      dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
    }
  }, [state.pollingInterval])

  // Funciones de limpieza
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const clearSuccess = useCallback(() => {
    dispatch({ type: 'CLEAR_SUCCESS' })
  }, [])

  const clearValidationErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_VALIDATION_ERRORS' })
  }, [])

  const clearDeteccionTipo = useCallback(() => {
    dispatch({ type: 'CLEAR_DETECCION_TIPO' })
  }, [])

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
      dispatch({ type: 'SET_ERROR', payload: 'Error al descargar la plantilla' })
    }
  }, [])

  // Memoizar el estado de autenticación para evitar re-renders innecesarios
  const authState = useMemo(() => ({
    isAuthenticated,
    userEmail: user?.email,
    isInitialized: state.isInitialized,
    source: 'context'
  }), [isAuthenticated, user?.email, state.isInitialized])

  // Memoizar las funciones de inicialización para evitar re-creaciones
  const memoizedInitializeData = useCallback(async () => {
    if (!state.isInitialized) {
      console.log('🔄 Usuario autenticado, inicializando datos de importación...')
      await initializeData()
    }
  }, [state.isInitialized, initializeData])

  const memoizedStopPolling = useCallback(() => {
    stopPolling()
  }, [stopPolling])

  // Inicializar datos al montar el provider - OPTIMIZADO
  useEffect(() => {
    // Solo loggear en desarrollo y cuando hay cambios reales
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 ImportacionGlobalProvider - Estado de autenticación:', authState)
    }
    
    // Solo inicializar si el usuario está autenticado y no está ya inicializado
    if (isAuthenticated && !state.isInitialized) {
      memoizedInitializeData()
    } else if (!isAuthenticated && process.env.NODE_ENV === 'development') {
      console.log('⏸️ Usuario no autenticado, saltando inicialización de importación')
    } else if (state.isInitialized && process.env.NODE_ENV === 'development') {
      console.log('✅ Datos de importación ya inicializados')
    }
    
    // Cleanup al desmontar
    return memoizedStopPolling
  }, [authState, memoizedInitializeData, memoizedStopPolling])

  // Memoizar el context value para evitar re-renders innecesarios
  const contextValue: ImportacionGlobalContextType = useMemo(() => ({
    state,
    dispatch,
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
  }), [
    state,
    dispatch,
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
  ])

  return (
    <ImportacionGlobalContext.Provider value={contextValue}>
      {children}
    </ImportacionGlobalContext.Provider>
  )
}

// Hook para usar el contexto
export function useImportacionGlobal() {
  const context = useContext(ImportacionGlobalContext)
  if (context === undefined) {
    throw new Error('useImportacionGlobal debe ser usado dentro de ImportacionGlobalProvider')
  }
  return context
} 