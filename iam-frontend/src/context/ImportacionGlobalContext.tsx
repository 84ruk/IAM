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
  isInitializing: boolean // Nuevo: para evitar inicializaciones múltiples
  
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
  isInitializing: false,
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
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | { type: 'SET_IMPORTING'; payload: boolean }
  | { type: 'SET_CURRENT_TRABAJO'; payload: TrabajoImportacion | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ImportacionValidationError[] | null }
  | { type: 'SET_DETECCION_TIPO'; payload: DeteccionTipoResponse | null }
  | { type: 'SET_LAST_FETCH_TIME'; payload: number }
  | { type: 'SET_POLLING_INTERVAL'; payload: NodeJS.Timeout | null }
  | { type: 'ADD_TRABAJO'; payload: TrabajoImportacion }
  | { type: 'UPDATE_TRABAJO'; payload: TrabajoImportacion }
  | { type: 'UPDATE_TRABAJO_PROGRESO'; payload: { trabajoId: string; progreso: ProgresoTrabajo } }
  | { type: 'ADD_VALIDATION_ERROR'; payload: { trabajoId: string; error: ImportacionValidationError } }
  | { type: 'UPDATE_ESTADISTICAS'; payload: EstadisticasTrabajo }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_SUCCESS' }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  | { type: 'CLEAR_DETECCION_TIPO' }
  | { type: 'RESET_STATE' }

// Interfaces específicas para tipos de datos
interface ProgresoTrabajo {
  registrosProcesados: number
  registrosExitosos: number
  registrosConError: number
  progreso: number
  mensaje?: string
}

interface EstadisticasTrabajo {
  total: number
  exitosos: number
  errores: number
  duplicados: number
  validados?: number
  omitidos?: number
}

// Interfaces para opciones de importación
interface OpcionesImportacionUnificada {
  sobrescribirExistentes: boolean
  validarSolo: boolean
  notificarEmail: boolean
  emailNotificacion?: string
  configuracionEspecifica?: Record<string, unknown>
}

interface OpcionesValidacionAuto {
  configuracionEspecifica?: Record<string, unknown>
}

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
    case 'SET_INITIALIZING':
      return { ...state, isInitializing: action.payload }
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
    case 'ADD_TRABAJO':
      return { 
        ...state, 
        trabajos: [action.payload, ...state.trabajos]
      }
    case 'UPDATE_TRABAJO':
      return {
        ...state,
        trabajos: state.trabajos.map(trabajo => 
          trabajo.id === action.payload.id ? action.payload : trabajo
        ),
        currentTrabajo: state.currentTrabajo?.id === action.payload.id 
          ? action.payload 
          : state.currentTrabajo
      }
    case 'UPDATE_TRABAJO_PROGRESO':
      return {
        ...state,
        trabajos: state.trabajos.map(trabajo => 
          trabajo.id === action.payload.trabajoId 
            ? { ...trabajo, ...action.payload.progreso }
            : trabajo
        )
      }
    case 'ADD_VALIDATION_ERROR':
      return {
        ...state,
        validationErrors: state.validationErrors 
          ? [...state.validationErrors, action.payload.error]
          : [action.payload.error]
      }
    case 'UPDATE_ESTADISTICAS':
      // Las estadísticas se calculan dinámicamente, no se almacenan
      return state
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
  importarUnified: (archivo: File, tipo: TipoImportacion, opciones: OpcionesImportacionUnificada) => Promise<void>
  importarAuto: (archivo: File, opciones: ImportacionAutoDto) => Promise<void>
  validarAuto: (archivo: File, opciones?: OpcionesValidacionAuto) => Promise<DeteccionTipoResponse | null>
  
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

  // Función para cargar trabajos con cache optimizado
  const loadTrabajos = useCallback(async (force = false) => {
    const now = Date.now()
    const cacheTime = 30000 // 30 segundos de cache (reducido para datos que cambian más)
    
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
      console.error('❌ Error al cargar trabajos:', error)
      dispatch({ type: 'SET_TRABAJOS', payload: [] })
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Error al cargar trabajos' })
    } finally {
      dispatch({ type: 'SET_LOADING_TRABAJOS', payload: false })
    }
  }, [state.isLoadingTrabajos, state.lastFetchTime, state.trabajos])

  // Función para cargar tipos soportados con cache extendido
  const loadTiposSoportados = useCallback(async (force = false) => {
    // Cache extendido para tipos soportados (30 minutos - datos que cambian muy raramente)
    const now = Date.now()
    const cacheTime = 1800000 // 30 minutos
    
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

  // Función para inicializar datos optimizada
  const initializeData = useCallback(async () => {
    if (state.isInitialized || state.isInitializing) {
      return
    }

    try {
      dispatch({ type: 'SET_INITIALIZING', payload: true })
      
      // Cargar en paralelo para mejor rendimiento
      const [trabajosPromise, tiposPromise] = await Promise.allSettled([
        loadTrabajos(true),
        loadTiposSoportados(true)
      ])
      
      // Manejar errores individuales sin fallar toda la inicialización
      if (trabajosPromise.status === 'rejected') {
        console.warn('⚠️ Error al cargar trabajos:', trabajosPromise.reason)
      }
      
      if (tiposPromise.status === 'rejected') {
        console.warn('⚠️ Error al cargar tipos:', tiposPromise.reason)
      }
      
      dispatch({ type: 'SET_INITIALIZED', payload: true })
      dispatch({ type: 'SET_INITIALIZING', payload: false })
    } catch (error) {
      console.error('❌ Error al inicializar datos:', error)
      dispatch({ type: 'SET_INITIALIZED', payload: true })
      dispatch({ type: 'SET_INITIALIZING', payload: false })
    }
  }, [state.isInitialized, state.isInitializing, loadTrabajos, loadTiposSoportados])



  // Funciones de importación
  const importarUnified = useCallback(async (archivo: File, tipo: TipoImportacion, opciones: OpcionesImportacionUnificada) => {
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

      // Manejar respuesta de importación
      const isSuccess = resultado.success !== false && (resultado.trabajoId || resultado.success)
      const trabajoId = resultado.trabajoId
      const estado = resultado.estado
      const mensaje = (resultado as any).mensaje || (resultado as any).message
      const totalRegistros = resultado.totalRegistros || (resultado as any).estadisticas?.total || 0
      const errores = resultado.errores || (resultado as any).estadisticas?.errores || 0
      
      if (isSuccess) {
        // Crear un trabajo temporal con información básica
        // Función helper para mapear tipo
        const mapearTipo = (t: TipoImportacion): 'productos' | 'proveedores' | 'movimientos' => {
          if (t === 'auto') return 'productos'
          return t as 'productos' | 'proveedores' | 'movimientos'
        }

        const trabajo: TrabajoImportacion = {
          id: trabajoId,
          tipo: mapearTipo(tipo),
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
          progreso: 0,
          mensaje: 'Iniciando procesamiento...'
        }
        
        dispatch({ type: 'SET_CURRENT_TRABAJO', payload: trabajo })
        dispatch({ type: 'SET_DETECCION_TIPO', payload: resultado.deteccionTipo || null })

        if (estado === 'pendiente' || estado === 'procesando') {
          // Iniciar polling inmediatamente para obtener actualizaciones
          startPolling(trabajoId)
        } else {
          // Si ya está completado, mostrar resultado final
          dispatch({ type: 'SET_IMPORTING', payload: false })
          dispatch({ 
            type: 'SET_SUCCESS', 
            payload: mensaje || `¡Importación de ${tipo} completada! ${totalRegistros} registros procesados exitosamente.` 
          })
        }
      } else {
        // Manejar errores de validación o del sistema
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
    } catch (error) {
      console.error('Error en importación:', error)
      dispatch({ type: 'SET_IMPORTING', payload: false })
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Error en importación' })
    }
  }, [state.isInitialized, initializeData])

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
      
      // Manejar respuesta de importación automática
      const isSuccess = resultado.success !== false && (resultado.trabajoId || resultado.success)
      const trabajoId = resultado.trabajoId
      const estado = resultado.estado
      const mensaje = (resultado as any).mensaje || (resultado as any).message
      const totalRegistros = resultado.totalRegistros || (resultado as any).estadisticas?.total || 0
      const errores = resultado.errores || (resultado as any).estadisticas?.errores || 0
      
      if (isSuccess) {
        // Crear un trabajo temporal con información básica
        const trabajo: TrabajoImportacion = {
          id: trabajoId,
          tipo: 'productos',
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
          progreso: 0,
          mensaje: 'Iniciando procesamiento...'
        }
        
        dispatch({ type: 'SET_CURRENT_TRABAJO', payload: trabajo })
        dispatch({ type: 'SET_DETECCION_TIPO', payload: resultado.deteccionTipo || null })

        if (estado === 'pendiente' || estado === 'procesando') {
          // Iniciar polling inmediatamente para obtener actualizaciones
          startPolling(trabajoId)
        } else {
          // Si ya está completado, mostrar resultado final
          dispatch({ type: 'SET_IMPORTING', payload: false })
          dispatch({ 
            type: 'SET_SUCCESS', 
            payload: mensaje || `¡Importación automática completada! ${totalRegistros} registros procesados exitosamente.` 
          })
        }
      } else {
        // Manejar errores de validación o del sistema
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
          dispatch({ type: 'SET_ERROR', payload: mensaje || 'Error en la importación automática' })
          dispatch({ type: 'SET_VALIDATION_ERRORS', payload: null })
        }
      }
    } catch (error) {
      console.error('Error en importación automática:', error)
      dispatch({ type: 'SET_IMPORTING', payload: false })
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Error en importación automática' })
    }
  }, [state.isInitialized, initializeData])

  const validarAuto = useCallback(async (archivo: File, opciones?: OpcionesValidacionAuto) => {
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

  // Funciones de polling optimizadas - SOLO cuando WebSocket no está disponible
  const startPolling = useCallback((trabajoId: string) => {
    // Verificar si WebSocket está disponible
    const isWebSocketAvailable = typeof window !== 'undefined' && 
      window.WebSocket && 
      navigator.onLine &&
      !window.location.hostname.includes('localhost') // En desarrollo, usar polling como fallback

    if (isWebSocketAvailable) {
      return
    }

    // Limpiar polling anterior si existe
    if (state.pollingInterval) {
      clearTimeout(state.pollingInterval)
    }

    // Función para determinar el intervalo de polling basado en el estado y progreso
    const getPollingInterval = (estado: string, progreso: number): number => {
      // Polling más agresivo al inicio para dar feedback inmediato
      if (estado === 'pendiente') {
        return 1000 // 1s para estado pendiente
      }
      
      if (estado === 'procesando') {
        // Polling más frecuente al inicio, menos frecuente al final
        if (progreso < 25) return 1500 // 1.5s al inicio
        if (progreso < 75) return 2000 // 2s en medio
        return 3000 // 3s al final
      }
      
      return 2000 // Default
    }

    const poll = async () => {
      try {
        const response = await importacionAPI.obtenerEstadoTrabajo(trabajoId)
        const trabajo = response.trabajo

        dispatch({ type: 'SET_CURRENT_TRABAJO', payload: trabajo })
        
        // Solo mostrar como importando si está pendiente o procesando
        const isStillImporting = trabajo.estado === 'pendiente' || trabajo.estado === 'procesando'
        dispatch({ type: 'SET_IMPORTING', payload: isStillImporting })

        // Verificar si el trabajo está realmente completado
        const isCompleted = trabajo.estado === 'completado'
        const hasError = trabajo.estado === 'error'
        const isCancelled = trabajo.estado === 'cancelado'
        const hasErrors = trabajo.registrosConError > 0
        
        // Detener polling si el trabajo está completado, tiene error, fue cancelado, o tiene errores
        if (isCompleted || hasError || isCancelled) {
          clearTimeout(safetyTimeout) // Limpiar timeout de seguridad
          dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
          dispatch({ type: 'SET_IMPORTING', payload: false })

          // Mostrar mensaje de éxito o error
          if (isCompleted) {
            const mensaje = hasErrors 
              ? `Importación completada con advertencias: ${trabajo.registrosExitosos} exitosos, ${trabajo.registrosConError} con errores`
              : `Importación completada exitosamente: ${trabajo.registrosExitosos} registros procesados`
            dispatch({ type: 'SET_SUCCESS', payload: mensaje })
          } else if (hasError) {
            dispatch({ type: 'SET_ERROR', payload: trabajo.mensaje || 'Error en la importación' })
          } else if (isCancelled) {
            dispatch({ type: 'SET_ERROR', payload: 'Importación cancelada' })
          }

          // Actualizar la lista de trabajos
          await loadTrabajos(true)
          return
        }

        // Continuar polling con intervalo dinámico
        const nextInterval = getPollingInterval(trabajo.estado, trabajo.progreso)
        const timeoutId = setTimeout(poll, nextInterval)
        dispatch({ type: 'SET_POLLING_INTERVAL', payload: timeoutId })

      } catch (error) {
        console.error('Error en polling:', error)
        // En caso de error, intentar de nuevo en 5 segundos
        const timeoutId = setTimeout(poll, 5000)
        dispatch({ type: 'SET_POLLING_INTERVAL', payload: timeoutId })
      }
    }

    // Timeout de seguridad para evitar polling infinito (10 minutos)
    const safetyTimeout = setTimeout(() => {
      console.warn('Timeout de seguridad alcanzado para polling del trabajo:', trabajoId)
      dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
      dispatch({ type: 'SET_IMPORTING', payload: false })
      dispatch({ type: 'SET_ERROR', payload: 'Timeout: La importación está tardando más de lo esperado' })
    }, 10 * 60 * 1000) // 10 minutos

    // Iniciar polling inmediatamente
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
      await initializeData()
    }
  }, [state.isInitialized, initializeData])

  const memoizedStopPolling = useCallback(() => {
    stopPolling()
  }, [stopPolling])

  // Inicializar datos al montar el provider - OPTIMIZADO CON DEBOUNCE Y RUTA
  useEffect(() => {
    // Solo inicializar si el usuario está autenticado, no está ya inicializado, y está en una página de importación
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const isImportPage = currentPath.includes('/importacion') || currentPath.includes('/dashboard/importacion')
    
    if (isAuthenticated && !state.isInitialized && isImportPage) {
      // Usar setTimeout para evitar múltiples inicializaciones simultáneas
      const timeoutId = setTimeout(() => {
        // Verificar que no se haya inicializado mientras esperaba
        if (!state.isInitialized) {
          memoizedInitializeData()
        }
      }, 200) // Aumentado a 200ms para evitar conflictos
      
      return () => {
        clearTimeout(timeoutId)
        memoizedStopPolling()
      }
    }
    
    // Cleanup al desmontar
    return memoizedStopPolling
  }, [authState, memoizedInitializeData, memoizedStopPolling, state.isInitialized])

  // Context value sin memoización para evitar problemas de referencia
  const contextValue: ImportacionGlobalContextType = {
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
  }

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
    // En lugar de lanzar un error, devolver un contexto por defecto
    console.warn('⚠️ useImportacionGlobal llamado fuera de ImportacionGlobalProvider, usando contexto por defecto')
    
    const defaultState: ImportacionGlobalState = {
      trabajos: [],
      tiposSoportados: [],
      isLoadingTrabajos: false,
      isLoadingTipos: false,
      isInitialized: false,
      isInitializing: false,
      isImporting: false,
      currentTrabajo: null,
      error: null,
      success: null,
      validationErrors: null,
      deteccionTipo: null,
      lastFetchTime: 0,
      pollingInterval: null
    };

    const noop = () => {
      console.warn('⚠️ Función de importación llamada sin contexto disponible');
    };

    return {
      state: defaultState,
      dispatch: noop,
      loadTrabajos: noop,
      loadTiposSoportados: noop,
      initializeData: noop,
      importarUnified: noop,
      importarAuto: noop,
      validarAuto: noop,
      descargarPlantilla: noop,
      clearError: noop,
      clearSuccess: noop,
      clearValidationErrors: noop,
      clearDeteccionTipo: noop,
      startPolling: noop,
      stopPolling: noop
    };
  }
  return context
} 