'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react'
import { 
  importacionAPI, 
  TrabajoImportacion, 
  ResultadoImportacion, 
  ImportacionValidationError,
  ImportacionAutoDto,
  DeteccionTipoResponse,
  TiposSoportadosResponse,
  TipoSoportado
} from '@/lib/api/importacion'

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

  // Funciones de polling
  const startPolling = useCallback((trabajoId: string) => {
    // Detener polling anterior si existe
    if (state.pollingInterval) {
      clearTimeout(state.pollingInterval)
    }

    const poll = async () => {
      try {
        const response = await importacionAPI.obtenerEstadoTrabajo(trabajoId)
        const trabajo = response.trabajo

        dispatch({ type: 'SET_CURRENT_TRABAJO', payload: trabajo })
        
        console.log('🔍 [DEBUG] startPolling - Trabajo actualizado:', trabajo)
        console.log('🔍 [DEBUG] startPolling - Estado:', trabajo.estado)
        console.log('🔍 [DEBUG] startPolling - Progreso:', trabajo.progreso)

        // Solo mostrar mensaje final cuando el trabajo esté realmente completado y progreso sea 100%
        if (trabajo.estado === 'completado' && trabajo.progreso >= 100) {
          console.log('🔍 [DEBUG] startPolling - Trabajo completado exitosamente')
          dispatch({ type: 'SET_IMPORTING', payload: false })
          dispatch({ 
            type: 'SET_SUCCESS', 
            payload: `¡Importación completada! ${trabajo.registrosExitosos} registros procesados exitosamente.` 
          })
          dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
          return
        }

        // Si hay error o está cancelado, detener polling
        if (trabajo.estado === 'error' || trabajo.estado === 'cancelado') {
          console.log('🔍 [DEBUG] startPolling - Trabajo con error o cancelado:', trabajo.estado)
          dispatch({ type: 'SET_IMPORTING', payload: false })
          dispatch({ type: 'SET_ERROR', payload: trabajo.mensaje || 'Error en la importación' })
          dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
          return
        }

        // Si está completado pero progreso no es 100%, continuar polling
        if (trabajo.estado === 'completado' && trabajo.progreso < 100) {
          console.log('🔍 [DEBUG] startPolling - Trabajo marcado como completado pero progreso < 100%, continuando polling')
        }

        // Continuar polling
        const interval = setTimeout(poll, 2000)
        dispatch({ type: 'SET_POLLING_INTERVAL', payload: interval })
      } catch (error) {
        console.error('Error en polling:', error)
        dispatch({ type: 'SET_IMPORTING', payload: false })
        dispatch({ type: 'SET_ERROR', payload: 'Error al verificar estado de importación' })
        dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
      }
    }

    poll()
  }, [state.pollingInterval, dispatch])

  const stopPolling = useCallback(() => {
    if (state.pollingInterval) {
      clearTimeout(state.pollingInterval)
      dispatch({ type: 'SET_POLLING_INTERVAL', payload: null })
    }
  }, [state.pollingInterval, dispatch])

  // Función para manejar respuesta de importación
  const handleImportResponse = useCallback(async (response: any, tipo: TipoImportacion) => {
    console.log('🔍 [DEBUG] handleImportResponse - Respuesta completa:', response);
    console.log('🔍 [DEBUG] handleImportResponse - Tipo:', tipo);
    
    if (!response || !response.resultado) {
      console.error('❌ [DEBUG] handleImportResponse - Respuesta inválida:', response);
      dispatch({ type: 'SET_ERROR', payload: 'Respuesta inválida del servidor' });
      return;
    }

    const resultado = response.resultado;
    console.log('🔍 [DEBUG] handleImportResponse - Resultado:', resultado);
    console.log('🔍 [DEBUG] handleImportResponse - Success:', resultado.success);
    console.log('🔍 [DEBUG] handleImportResponse - Error:', resultado.error);
    console.log('🔍 [DEBUG] handleImportResponse - TrabajoId:', resultado.trabajoId);

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
        archivoOriginal: 'N/A', // No disponible en la respuesta
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
        dispatch({ type: 'SET_IMPORTING', payload: true }) // Ensure importing is true
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
  }, [startPolling])

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

      handleImportResponse(resultado, tipo)
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
      handleImportResponse(resultado, 'productos')
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
      const blob = await importacionAPI.descargarPlantilla(tipoPlantilla)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plantilla-${tipoPlantilla}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al descargar plantilla:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Error al descargar la plantilla' })
    }
  }, [])

  // Inicializar datos al montar el provider
  useEffect(() => {
    // Solo inicializar si no está ya inicializado
    if (!state.isInitialized) {
      initializeData()
    }
    
    // Cleanup al desmontar
    return () => {
      stopPolling()
    }
  }, [state.isInitialized, initializeData, stopPolling])

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
    throw new Error('useImportacionGlobal debe ser usado dentro de ImportacionGlobalProvider')
  }
  return context
} 