'use client'

import { useState, useCallback } from 'react'

export interface UmbralesSensor {
  temperaturaMin?: number
  temperaturaMax?: number
  humedadMin?: number
  humedadMax?: number
  pesoMin?: number
  pesoMax?: number
  presionMin?: number
  presionMax?: number
  alertasActivas: boolean
  mensajeAlerta?: string
  mensajeCritico?: string
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  intervaloVerificacionMinutos: number
}

export interface ConfiguracionAlertas {
  notificacionEmail: boolean
  notificacionSMS: boolean
  notificacionWebSocket: boolean
  notificacionPush: boolean
  destinatarios: DestinatarioAlerta[]
  escalamiento: ConfiguracionEscalamiento
  horario: ConfiguracionHorario
}

export interface DestinatarioAlerta {
  id: string
  nombre: string
  email: string
  telefono?: string
  tipo: 'EMAIL' | 'SMS' | 'AMBOS'
  activo: boolean
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
}

export interface ConfiguracionEscalamiento {
  habilitado: boolean
  tiempoEscalacionMinutos: number
  destinatariosEscalacion: string[]
  nivelesEscalamiento: NivelEscalamiento[]
}

export interface NivelEscalamiento {
  nivel: number
  tiempoMinutos: number
  destinatarios: string[]
  mensaje: string
}

export interface ConfiguracionHorario {
  habilitado: boolean
  inicio: string // HH:mm
  fin: string // HH:mm
  diasSemana: number[] // 0=Domingo, 1=Lunes, etc.
  zonaHoraria: string
}

export interface UseConfiguracionSensoresReturn {
  // Estado
  umbrales: UmbralesSensor
  configuracionAlertas: ConfiguracionAlertas
  isLoading: boolean
  error: string | null
  isSaving: boolean
  
  // Funciones de umbrales
  actualizarUmbral: (tipo: keyof UmbralesSensor, valor: number | string | boolean) => void
  resetearUmbrales: () => void
  validarUmbrales: () => boolean
  
  // Funciones de alertas
  agregarDestinatario: (destinatario: Omit<DestinatarioAlerta, 'id'>) => void
  actualizarDestinatario: (id: string, cambios: Partial<DestinatarioAlerta>) => void
  eliminarDestinatario: (id: string) => void
  toggleNotificacion: (tipo: keyof Pick<ConfiguracionAlertas, 'notificacionEmail' | 'notificacionSMS' | 'notificacionWebSocket' | 'notificacionPush'>) => void
  
  // Funciones de escalamiento
  toggleEscalamiento: () => void
  actualizarTiempoEscalamiento: (minutos: number) => void
  agregarNivelEscalamiento: (nivel: Omit<NivelEscalamiento, 'nivel'>) => void
  eliminarNivelEscalamiento: (nivel: number) => void
  
  // Funciones de horario
  toggleHorario: () => void
  actualizarHorario: (inicio: string, fin: string) => void
  toggleDiaSemana: (dia: number) => void
  actualizarZonaHoraria: (zona: string) => void
  
  // Funciones de persistencia
  guardarConfiguracion: () => Promise<boolean>
  cargarConfiguracion: (sensorId: number) => Promise<void>
  exportarConfiguracion: () => void
  importarConfiguracion: (config: { umbrales: UmbralesSensor; configuracionAlertas: ConfiguracionAlertas }) => Promise<boolean>
}

export function useConfiguracionSensores(): UseConfiguracionSensoresReturn {
  // Estado de umbrales
  const [umbrales, setUmbrales] = useState<UmbralesSensor>({
    temperaturaMin: 15,
    temperaturaMax: 25,
    humedadMin: 40,
    humedadMax: 60,
    pesoMin: 100,
    pesoMax: 900,
    presionMin: 1000,
    presionMax: 1500,
    alertasActivas: true,
    mensajeAlerta: 'Valor fuera del rango normal',
    mensajeCritico: 'Valor crítico detectado',
    severidad: 'MEDIA',
    intervaloVerificacionMinutos: 5
  })

  // Estado de configuración de alertas
  const [configuracionAlertas, setConfiguracionAlertas] = useState<ConfiguracionAlertas>({
    notificacionEmail: true,
    notificacionSMS: false,
    notificacionWebSocket: true,
    notificacionPush: false,
    destinatarios: [
      {
        id: '1',
        nombre: 'Administrador del Sistema',
        email: 'admin@empresa.com',
        tipo: 'EMAIL',
        activo: true,
        prioridad: 'CRITICA'
      }
    ],
    escalamiento: {
      habilitado: false,
      tiempoEscalacionMinutos: 30,
      destinatariosEscalacion: [],
      nivelesEscalamiento: [
        {
          nivel: 1,
          tiempoMinutos: 15,
          destinatarios: ['admin@empresa.com'],
          mensaje: 'Primera notificación de escalamiento'
        },
        {
          nivel: 2,
          tiempoMinutos: 30,
          destinatarios: ['admin@empresa.com', 'supervisor@empresa.com'],
          mensaje: 'Segunda notificación de escalamiento'
        }
      ]
    },
    horario: {
      habilitado: false,
      inicio: '08:00',
      fin: '18:00',
      diasSemana: [1, 2, 3, 4, 5], // Lunes a Viernes
      zonaHoraria: 'America/Mexico_City'
    }
  })

  // Estado general
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Función para actualizar umbrales
  const actualizarUmbral = useCallback((tipo: keyof UmbralesSensor, valor: number | string | boolean) => {
    setUmbrales(prev => ({
      ...prev,
      [tipo]: valor
    }))
  }, [])

  // Función para resetear umbrales a valores por defecto
  const resetearUmbrales = useCallback(() => {
    setUmbrales({
      temperaturaMin: 15,
      temperaturaMax: 25,
      humedadMin: 40,
      humedadMax: 60,
      pesoMin: 100,
      pesoMax: 900,
      presionMin: 1000,
      presionMax: 1500,
      alertasActivas: true,
      mensajeAlerta: 'Valor fuera del rango normal',
      mensajeCritico: 'Valor crítico detectado',
      severidad: 'MEDIA',
      intervaloVerificacionMinutos: 5
    })
  }, [])

  // Función para validar umbrales
  const validarUmbrales = useCallback((): boolean => {
    // Validar temperatura
    if (umbrales.temperaturaMin !== undefined && umbrales.temperaturaMax !== undefined) {
      if (umbrales.temperaturaMin >= umbrales.temperaturaMax) {
        setError('La temperatura mínima debe ser menor que la máxima')
        return false
      }
    }

    // Validar humedad
    if (umbrales.humedadMin !== undefined && umbrales.humedadMax !== undefined) {
      if (umbrales.humedadMin >= umbrales.humedadMax) {
        setError('La humedad mínima debe ser menor que la máxima')
        return false
      }
      if (umbrales.humedadMin < 0 || umbrales.humedadMax > 100) {
        setError('La humedad debe estar entre 0% y 100%')
        return false
      }
    }

    // Validar peso
    if (umbrales.pesoMin !== undefined && umbrales.pesoMax !== undefined) {
      if (umbrales.pesoMin >= umbrales.pesoMax) {
        setError('El peso mínimo debe ser menor que el máximo')
        return false
      }
      if (umbrales.pesoMin < 0 || umbrales.pesoMax < 0) {
        setError('El peso debe ser positivo')
        return false
      }
    }

    // Validar presión
    if (umbrales.presionMin !== undefined && umbrales.presionMax !== undefined) {
      if (umbrales.presionMin >= umbrales.presionMax) {
        setError('La presión mínima debe ser menor que la máxima')
        return false
      }
    }

    // Validar intervalo de verificación
    if (umbrales.intervaloVerificacionMinutos < 1 || umbrales.intervaloVerificacionMinutos > 1440) {
      setError('El intervalo de verificación debe estar entre 1 y 1440 minutos')
      return false
    }

    setError(null)
    return true
  }, [umbrales])

  // Función para agregar destinatario
  const agregarDestinatario = useCallback((destinatario: Omit<DestinatarioAlerta, 'id'>) => {
    const nuevoDestinatario: DestinatarioAlerta = {
      ...destinatario,
      id: Date.now().toString()
    }
    
    setConfiguracionAlertas(prev => ({
      ...prev,
      destinatarios: [...prev.destinatarios, nuevoDestinatario]
    }))
  }, [])

  // Función para actualizar destinatario
  const actualizarDestinatario = useCallback((id: string, cambios: Partial<DestinatarioAlerta>) => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      destinatarios: prev.destinatarios.map(dest => 
        dest.id === id ? { ...dest, ...cambios } : dest
      )
    }))
  }, [])

  // Función para eliminar destinatario
  const eliminarDestinatario = useCallback((id: string) => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      destinatarios: prev.destinatarios.filter(dest => dest.id !== id)
    }))
  }, [])

  // Función para toggle de notificaciones
  const toggleNotificacion = useCallback((tipo: keyof Pick<ConfiguracionAlertas, 'notificacionEmail' | 'notificacionSMS' | 'notificacionWebSocket' | 'notificacionPush'>) => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      [tipo]: !prev[tipo]
    }))
  }, [])

  // Función para toggle de escalamiento
  const toggleEscalamiento = useCallback(() => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      escalamiento: {
        ...prev.escalamiento,
        habilitado: !prev.escalamiento.habilitado
      }
    }))
  }, [])

  // Función para actualizar tiempo de escalamiento
  const actualizarTiempoEscalamiento = useCallback((minutos: number) => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      escalamiento: {
        ...prev.escalamiento,
        tiempoEscalacionMinutos: minutos
      }
    }))
  }, [])

  // Función para agregar nivel de escalamiento
  const agregarNivelEscalamiento = useCallback((nivel: Omit<NivelEscalamiento, 'nivel'>) => {
    setConfiguracionAlertas(prev => {
      const niveles = prev.escalamiento.nivelesEscalamiento;
      const nuevoNivel = niveles.length > 0 ? Math.max(...niveles.map(n => n.nivel)) + 1 : 1;
      const nuevoNivelEscalamiento: NivelEscalamiento = {
        ...nivel,
        nivel: nuevoNivel
      };
      return {
        ...prev,
        escalamiento: {
          ...prev.escalamiento,
          nivelesEscalamiento: [...niveles, nuevoNivelEscalamiento]
        }
      };
    });
  }, []);

  // Función para eliminar nivel de escalamiento
  const eliminarNivelEscalamiento = useCallback((nivel: number) => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      escalamiento: {
        ...prev.escalamiento,
        nivelesEscalamiento: prev.escalamiento.nivelesEscalamiento.filter(n => n.nivel !== nivel)
      }
    }))
  }, [])

  // Función para toggle de horario
  const toggleHorario = useCallback(() => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      horario: {
        ...prev.horario,
        habilitado: !prev.horario.habilitado
      }
    }))
  }, [])

  // Función para actualizar horario
  const actualizarHorario = useCallback((inicio: string, fin: string) => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      horario: {
        ...prev.horario,
        inicio,
        fin
      }
    }))
  }, [])

  // Función para toggle de día de semana
  const toggleDiaSemana = useCallback((dia: number) => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      horario: {
        ...prev.horario,
        diasSemana: prev.horario.diasSemana.includes(dia)
          ? prev.horario.diasSemana.filter(d => d !== dia)
          : [...prev.horario.diasSemana, dia].sort()
      }
    }))
  }, [])

  // Función para actualizar zona horaria
  const actualizarZonaHoraria = useCallback((zona: string) => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      horario: {
        ...prev.horario,
        zonaHoraria: zona
      }
    }))
  }, [])

  // Función para guardar configuración
  const guardarConfiguracion = useCallback(async (): Promise<boolean> => {
    if (!validarUmbrales()) {
      return false
    }

    try {
      setIsSaving(true)
      setError(null)

      // Aquí iría la lógica para guardar en el backend
      // Por ahora simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('✅ Configuración guardada:', { umbrales, configuracionAlertas })
      return true
    } catch (error) {
      setError('Error guardando configuración')
      console.error('❌ Error guardando configuración:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [umbrales, configuracionAlertas, validarUmbrales])

  // Función para cargar configuración
  const cargarConfiguracion = useCallback(async (sensorId: number) => {
    try {
      setIsLoading(true)
      setError(null)

      // Aquí iría la lógica para cargar desde el backend
      // Por ahora simulamos la carga
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log(`📥 Configuración cargada para sensor ${sensorId}`)
    } catch (error) {
      setError('Error cargando configuración')
      console.error('❌ Error cargando configuración:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Función para exportar configuración
  const exportarConfiguracion = useCallback(() => {
    const config = {
      umbrales,
      configuracionAlertas,
      fechaExportacion: new Date().toISOString(),
      version: '1.0.0'
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `configuracion-sensor-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('📤 Configuración exportada')
  }, [umbrales, configuracionAlertas])

  // Función para importar configuración
  const importarConfiguracion = useCallback(async (config: { umbrales: UmbralesSensor; configuracionAlertas: ConfiguracionAlertas }): Promise<boolean> => {
    try {
      setError(null)

      // Validar estructura de configuración
      if (!config.umbrales || !config.configuracionAlertas) {
        setError('Formato de configuración inválido')
        return false
      }

      // Aplicar configuración
      setUmbrales(config.umbrales)
      setConfiguracionAlertas(config.configuracionAlertas)

      console.log('📥 Configuración importada:', config)
      return true
    } catch (error) {
      setError('Error importando configuración')
      console.error('❌ Error importando configuración:', error)
      return false
    }
  }, [])

  return {
    // Estado
    umbrales,
    configuracionAlertas,
    isLoading,
    error,
    isSaving,
    
    // Funciones de umbrales
    actualizarUmbral,
    resetearUmbrales,
    validarUmbrales,
    
    // Funciones de alertas
    agregarDestinatario,
    actualizarDestinatario,
    eliminarDestinatario,
    toggleNotificacion,
    
    // Funciones de escalamiento
    toggleEscalamiento,
    actualizarTiempoEscalamiento,
    agregarNivelEscalamiento,
    eliminarNivelEscalamiento,
    
    // Funciones de horario
    toggleHorario,
    actualizarHorario,
    toggleDiaSemana,
    actualizarZonaHoraria,
    
    // Funciones de persistencia
    guardarConfiguracion,
    cargarConfiguracion,
    exportarConfiguracion,
    importarConfiguracion,
  }
}
