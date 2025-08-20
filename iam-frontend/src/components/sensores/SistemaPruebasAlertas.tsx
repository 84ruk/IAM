'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail, 
  Wifi, 
  Smartphone, 
  Users, 
  Edit, 
  Save, 
  Loader2, 
  AlertTriangle,
  TestTube,
  Settings,
  CheckCircle,
  XCircle,
  Play,
  Trash2,
  Plus
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface DestinatarioAlerta {
  id: string
  nombre: string
  email: string
  telefono: string
  tipo: 'EMAIL' | 'SMS' | 'AMBOS'
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  activo: boolean
}

interface ConfiguracionEscalamiento {
  activo: boolean
  tiempoEscalamientoMinutos: number
  niveles: NivelEscalamiento[]
}

interface NivelEscalamiento {
  id: string
  nivel: number
  tiempoMinutos: number
  destinatarios: string[]
  mensaje: string
}

interface ConfiguracionHorario {
  activo: boolean
  horaInicio: string
  horaFin: string
  diasSemana: number[]
  zonaHoraria: string
}

interface ConfiguracionAlertas {
  tiposNotificacion: {
    email: boolean
    sms: boolean
    webSocket: boolean
    push: boolean
  }
  destinatarios: DestinatarioAlerta[]
  escalamiento: ConfiguracionEscalamiento
  horario: ConfiguracionHorario
  retrasoNotificacionMinutos: number
  maxIntentosNotificacion: number
}

interface ResultadoPrueba {
  tipo: 'EMAIL' | 'SMS' | 'WEBSOCKET'
  exitoso: boolean
  mensaje: string
  timestamp: Date
  detalles?: string
}

interface SistemaPruebasAlertasProps {
  sensorId: number
  onConfiguracionGuardada: (config: ConfiguracionAlertas) => void
}

export function SistemaPruebasAlertas({ sensorId, onConfiguracionGuardada }: SistemaPruebasAlertasProps) {
  const { authInfo } = useAuth()
  
  // Función helper para construir headers de autenticación (siguiendo el patrón del dashboard)
  const getRequestHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }, [])
  const [configuracion, setConfiguracion] = useState<ConfiguracionAlertas & { id?: number }>({
    tiposNotificacion: {
      email: true,
      sms: true,
      webSocket: true,
      push: false
    },
    destinatarios: [
      {
        id: '1',
        nombre: 'Administrador',
        email: 'admin@empresa.com',
        telefono: '4441882114',
        tipo: 'EMAIL',
        prioridad: 'ALTA',
        activo: true
      }
    ],
    escalamiento: {
      activo: false,
      tiempoEscalamientoMinutos: 30,
      niveles: [
        {
          id: '1',
          nivel: 1,
          tiempoMinutos: 15,
          destinatarios: ['1'],
          mensaje: 'Primera notificación de escalamiento'
        }
      ]
    },
    horario: {
      activo: false,
      horaInicio: '08:00',
      horaFin: '18:00',
      diasSemana: [1, 2, 3, 4, 5], // Lunes a Viernes
      zonaHoraria: 'America/Mexico_City'
    },
    retrasoNotificacionMinutos: 5,
    maxIntentosNotificacion: 3,
    id: undefined
  })
  
  // Log del estado de la configuración para debugging
  console.log('🔧 SistemaPruebasAlertas renderizado con:', {
    sensorId,
    configuracion,
    authInfo,
    tiposNotificacion: configuracion?.tiposNotificacion
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [editandoDestinatario, setEditandoDestinatario] = useState<string | null>(null)
  const [nuevoDestinatario, setNuevoDestinatario] = useState<Partial<DestinatarioAlerta>>({})
  const [mostrarFormularioDestinatario, setMostrarFormularioDestinatario] = useState(false)
  
  // Estados para el sistema de pruebas
  const [pruebasEnCurso, setPruebasEnCurso] = useState<Set<string>>(new Set())
  const [resultadosPruebas, setResultadosPruebas] = useState<ResultadoPrueba[]>([])
  const [configuracionPruebas, setConfiguracionPruebas] = useState({
    mensajePrueba: 'Esta es una alerta de prueba del sistema de sensores',
    severidadPrueba: 'MEDIA' as 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA',
    incluirDatosSensor: true
  })

  // Estados para configuración avanzada
  const [configuracionAvanzada, setConfiguracionAvanzada] = useState({
    modoPrueba: false,
    logDetallado: true,
    simulacionTiempoReal: false,
    intervaloPruebasAutomaticas: 0 // 0 = desactivado
  })

  useEffect(() => {
    console.log('🔐 Estado de autenticación:', authInfo)
    
    if (authInfo.isAuthenticated) {
      console.log('✅ Usuario autenticado, cargando configuración...')
      cargarConfiguracion()
    } else {
      console.log('❌ Usuario no autenticado:', authInfo.error)
      setError(authInfo.error || 'Usuario no autenticado')
    }
  }, [authInfo]);

  const cargarConfiguracion = async () => {
    if (!authInfo.isAuthenticated) {
      setError('Usuario no autenticado')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`🔧 Cargando configuración de alertas para sensor ${sensorId}...`)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensores/${sensorId}/alertas/configuracion`, {
        method: 'GET',
        headers: getRequestHeaders(),
        credentials: 'include' // Importante: incluir cookies automáticamente
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Configuración cargada:', data)
        
        if (data.success && data.data) {
          // Asegurar que destinatarios sea siempre un array y tiposNotificacion tenga valores por defecto
          const configValidada = {
            ...data.data,
            destinatarios: data.data.destinatarios || [],
            tiposNotificacion: {
              email: data.data.tiposNotificacion?.email ?? true,
              sms: data.data.tiposNotificacion?.sms ?? true,
              webSocket: data.data.tiposNotificacion?.webSocket ?? true,
              push: data.data.tiposNotificacion?.push ?? false,
            }
          }
          setConfiguracion(configValidada)
          console.log('✅ Configuración validada y establecida')
        } else {
          console.warn('⚠️ Respuesta del servidor sin datos válidos:', data)
          setError('El servidor no devolvió datos válidos')
        }
      } else if (response.status === 404) {
        // Configuración no existe, usar valores por defecto
        console.log('ℹ️ Configuración no encontrada, usando valores por defecto')
        // La configuración por defecto ya está en el estado inicial
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error(`❌ Error ${response.status} al cargar configuración:`, errorData)
        setError(`Error al cargar configuración: ${errorData.message || response.statusText}`)
      }
    } catch (err) {
      console.error('❌ Error de conexión al cargar configuración:', err)
      setError('Error de conexión al servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!authInfo.isAuthenticated) {
      setError('Usuario no autenticado')
      return
    }

    setIsLoading(true)
    setError(null)
    setSaveSuccess(false)

    try {
      const configuracionValidada = {
        ...configuracion,
        tiposNotificacion: {
          email: true,
          sms: true,
          webSocket: false,
          push: true,
        },
        retrasoNotificacionMinutos: parseInt(configuracion.retrasoNotificacionMinutos.toString()) || 5,
        maxIntentosNotificacion: parseInt(configuracion.maxIntentosNotificacion.toString()) || 3
      }

      // Validar que no haya valores NaN
      if (isNaN(configuracionValidada.retrasoNotificacionMinutos) || 
          isNaN(configuracionValidada.maxIntentosNotificacion)) {
        setError('Valores de configuración inválidos')
        return
      }

      console.log('🔧 Configuración a enviar:', configuracionValidada)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensores/${sensorId}/alertas/configuracion`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include', // Importante: incluir cookies automáticamente
        body: JSON.stringify(configuracionValidada)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Respuesta al guardar:', data)
        
        if (data.success) {
          setSaveSuccess(true)
          setSaveMessage('Configuración guardada exitosamente')
          onConfiguracionGuardada(configuracionValidada)
          
          // Limpiar mensaje de éxito después de 3 segundos
          setTimeout(() => {
            setSaveSuccess(false)
            setSaveMessage('')
          }, 3000)
        } else {
          setError(data.message || 'Error al guardar configuración')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error(`❌ Error ${response.status} al guardar:`, errorData)
        setError(`Error al guardar: ${errorData.message || response.statusText}`)
      }
    } catch (err) {
      console.error('❌ Error de conexión al guardar:', err)
      setError('Error de conexión al servidor')
    } finally {
      setIsLoading(false)
    }
  }

  // ===== SISTEMA DE PRUEBAS =====

  const ejecutarPrueba = async (tipo: 'EMAIL' | 'SMS' | 'WEBSOCKET') => {
    console.log(`🚀 ejecutarPrueba llamado con tipo: ${tipo}`)
    console.log(`🔐 authInfo:`, authInfo)
    
    if (!authInfo.isAuthenticated) {
      setError('Usuario no autenticado')
      return
    }

    setPruebasEnCurso(prev => new Set(prev).add(tipo))
    setError(null)

    try {
      console.log(`📤 Preparando payload para ${tipo}...`)
      const payload = {
        tipoPrueba: tipo,
        destinatario: tipo === 'EMAIL' ? configuracion?.destinatarios?.find(d => d.tipo === 'EMAIL' || d.tipo === 'AMBOS')?.email : 
                     tipo === 'SMS' ? configuracion?.destinatarios?.find(d => d.tipo === 'SMS' || d.tipo === 'AMBOS')?.telefono : undefined
      }
      console.log(`📤 Payload preparado:`, payload)

      console.log(`🧪 Ejecutando prueba de ${tipo}...`, payload)
      console.log(`🌐 URL de la petición:`, `${process.env.NEXT_PUBLIC_API_URL}/sensores/${sensorId}/alertas/probar`)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensores/${sensorId}/alertas/probar`, {
        method: 'POST',
        headers: getRequestHeaders(),
        credentials: 'include', // Importante: incluir cookies automáticamente
        body: JSON.stringify(payload)
      })

      let resultado: ResultadoPrueba
      
      console.log(`📡 Respuesta del servidor:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Respuesta de prueba ${tipo}:`, data)
        
        if (data.success && data.data?.resultado) {
          const resultadoBackend = data.data.resultado
          resultado = {
            tipo,
            exitoso: resultadoBackend.enviado,
            mensaje: resultadoBackend.enviado ? 'Prueba ejecutada exitosamente' : 'Error en la prueba',
            timestamp: new Date(),
            detalles: resultadoBackend.detalles || `Notificación ${resultadoBackend.enviado ? 'enviada' : 'falló'} a ${resultadoBackend.destinatario}`
          }
        } else {
          resultado = {
            tipo,
            exitoso: false,
            mensaje: 'Respuesta del servidor inválida',
            timestamp: new Date(),
            detalles: 'El servidor no devolvió un resultado válido'
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error(`❌ Error en prueba ${tipo}:`, errorData)
        
        resultado = {
          tipo,
          exitoso: false,
          mensaje: `Error ${response.status}: ${response.statusText}`,
          timestamp: new Date(),
          detalles: errorData.message || 'Error del servidor'
        }
      }

      setResultadosPruebas(prev => [resultado, ...prev.slice(0, 9)]) // Mantener solo los últimos 10 resultados

    } catch (err) {
      console.error(`❌ Error de conexión en prueba ${tipo}:`, err)
      
      const resultado: ResultadoPrueba = {
        tipo,
        exitoso: false,
        mensaje: 'Error de conexión',
        timestamp: new Date(),
        detalles: 'No se pudo conectar con el servidor'
      }
      setResultadosPruebas(prev => [resultado, ...prev.slice(0, 9)])
    } finally {
      setPruebasEnCurso(prev => {
        const nuevo = new Set(prev)
        nuevo.delete(tipo)
        return nuevo
      })
    }
  }

  const ejecutarPruebaCompleta = async () => {
    if (!configuracion?.tiposNotificacion) return
    
    const tiposActivos = Object.entries(configuracion.tiposNotificacion)
      .filter(([_, activo]) => activo)
      .map(([tipo]) => tipo.toUpperCase() as 'EMAIL' | 'SMS' | 'WEBSOCKET')

    for (const tipo of tiposActivos) {
      await ejecutarPrueba(tipo)
      // Pequeña pausa entre pruebas
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const limpiarResultadosPruebas = () => {
    setResultadosPruebas([])
  }

  // ===== GESTIÓN DE DESTINATARIOS =====

  const agregarDestinatario = async () => {
    if (!nuevoDestinatario.nombre || !nuevoDestinatario.email) {
      setError('Nombre y email son obligatorios');
      return;
    }
    // Validación de teléfono: solo 10 dígitos, sin prefijo 52
    if (nuevoDestinatario.tipo === 'SMS' || nuevoDestinatario.tipo === 'AMBOS') {
      const telefono = (nuevoDestinatario.telefono || '').replace(/\D/g, '');
      if (telefono.length !== 10) {
        setError('El teléfono debe tener exactamente 10 dígitos (sin prefijo 52)');
        return;
      }
      if (!/^\d{10}$/.test(telefono)) {
        setError('El teléfono solo debe contener números');
        return;
      }
      nuevoDestinatario.telefono = telefono;
    }
    const configId = Number(configuracion.id);
    if (!configId || isNaN(configId)) {
      setError('Primero debes guardar la configuración de alertas antes de agregar destinatarios.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const destinatarioPayload = {
        ...nuevoDestinatario,
        configuracionAlertaId: configId,
      };
      console.log('Intentando agregar destinatario:', destinatarioPayload);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sensores/alertas/config/${sensorId}/destinatarios`,
        {
          method: 'POST',
          headers: getRequestHeaders(),
          credentials: 'include',
          body: JSON.stringify(destinatarioPayload),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setConfiguracion(prev => ({
          ...prev,
          destinatarios: [...prev.destinatarios, data],
        }));
        setNuevoDestinatario({});
        setMostrarFormularioDestinatario(false);
        setError(null);
      } else {
        setError('Error al guardar el destinatario en el servidor');
      }
    } catch (err) {
      setError('Error de conexión al guardar destinatario');
    } finally {
      setIsLoading(false);
    }
  }

  const editarDestinatario = (id: string) => {
    const destinatario = configuracion.destinatarios.find(d => d.id === id)
    if (destinatario) {
      setNuevoDestinatario(destinatario)
      setEditandoDestinatario(id)
      setMostrarFormularioDestinatario(true)
    }
  }

  const actualizarDestinatario = () => {
    if (!editandoDestinatario || !nuevoDestinatario.nombre || !nuevoDestinatario.email) {
      setError('Nombre y email son obligatorios')
      return
    }

    setConfiguracion(prev => ({
      ...prev,
      destinatarios: prev.destinatarios?.map(d => 
        d.id === editandoDestinatario 
          ? { ...d, ...nuevoDestinatario }
          : d
      ) || []
    }))

    setNuevoDestinatario({})
    setEditandoDestinatario(null)
    setMostrarFormularioDestinatario(false)
    setError(null)
  }

  // Eliminar la función eliminarDestinatario del switch. El switch solo debe cambiar el estado 'activo' del destinatario, no eliminarlo.
  const toggleDestinatario = (id: string) => {
    setConfiguracion(prev => ({
      ...prev,
      destinatarios: prev.destinatarios?.map(d => 
        d.id === id ? { ...d, activo: !d.activo } : d
      ) || []
    }))
  }

  // ===== CONFIGURACIÓN AVANZADA =====

  const toggleModoPrueba = () => {
    setConfiguracionAvanzada(prev => ({
      ...prev,
      modoPrueba: !prev.modoPrueba
    }))
  }

  const activarPruebasAutomaticas = (intervaloMinutos: number) => {
    setConfiguracionAvanzada(prev => ({
      ...prev,
      intervaloPruebasAutomaticas: intervaloMinutos
    }))

    if (intervaloMinutos > 0) {
      // Implementar lógica de pruebas automáticas
      console.log(`Pruebas automáticas activadas cada ${intervaloMinutos} minutos`)
    }
  }

  if (isLoading || !configuracion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {isLoading ? 'Cargando configuración...' : 'Configuración no disponible'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>
              {isLoading 
                ? 'Cargando configuración del sistema de alertas...' 
                : 'No se pudo cargar la configuración. Por favor, recarga la página.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sistema de Pruebas y Configuración de Alertas
          </CardTitle>
          <CardDescription>
            Configura y prueba el sistema de notificaciones para el sensor {sensorId}
          </CardDescription>
          {saveSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {saveMessage}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
      </Card>

      {/* Sistema de Pruebas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Sistema de Pruebas
          </CardTitle>
          <CardDescription>
            Ejecuta pruebas para verificar que las notificaciones funcionen correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuración de Pruebas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mensajePrueba">Mensaje de Prueba</Label>
              <Textarea
                id="mensajePrueba"
                value={configuracionPruebas.mensajePrueba}
                onChange={(e) => setConfiguracionPruebas(prev => ({
                  ...prev,
                  mensajePrueba: e.target.value
                }))}
                placeholder="Mensaje que se enviará en la prueba"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="severidadPrueba">Severidad de Prueba</Label>
              <Select
                value={configuracionPruebas.severidadPrueba}
                onValueChange={(value: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA') => 
                  setConfiguracionPruebas(prev => ({ ...prev, severidadPrueba: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="CRITICA">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="incluirDatosSensor"
              checked={configuracionPruebas.incluirDatosSensor}
              onCheckedChange={(checked) => setConfiguracionPruebas(prev => ({
                ...prev,
                incluirDatosSensor: checked
              }))}
            />
            <Label htmlFor="incluirDatosSensor">Incluir datos del sensor en la prueba</Label>
          </div>

          {/* Botones de Prueba */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                console.log('🔘 Botón Email clickeado')
                console.log('📧 Estado configuracion:', configuracion)
                console.log('📧 Tipos notificación:', configuracion?.tiposNotificacion)
                ejecutarPrueba('EMAIL')
              }}
              disabled={pruebasEnCurso.has('EMAIL') || !configuracion?.tiposNotificacion?.email}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {pruebasEnCurso.has('EMAIL') ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Probar Email
            </Button>

            <Button
              onClick={() => {
                console.log('🔘 Botón SMS clickeado')
                console.log('📱 Estado configuracion:', configuracion)
                console.log('📱 Tipos notificación:', configuracion?.tiposNotificacion)
                ejecutarPrueba('SMS')
              }}
              disabled={pruebasEnCurso.has('SMS') || !configuracion?.tiposNotificacion?.sms}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {pruebasEnCurso.has('SMS') ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              Probar SMS
            </Button>

            <Button
              onClick={() => {
                console.log('🔘 Botón WebSocket clickeado')
                console.log('🌐 Estado configuracion:', configuracion)
                console.log('🌐 Tipos notificación:', configuracion?.tiposNotificacion)
                ejecutarPrueba('WEBSOCKET')
              }}
              disabled={pruebasEnCurso.has('WEBSOCKET') || !configuracion?.tiposNotificacion?.webSocket}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {pruebasEnCurso.has('WEBSOCKET') ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Probar WebSocket
            </Button>

            <Button
              onClick={ejecutarPruebaCompleta}
              disabled={pruebasEnCurso.size > 0}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Probar Todo
            </Button>

            <Button
              onClick={limpiarResultadosPruebas}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar
            </Button>
          </div>

          {/* Resultados de Pruebas */}
          {resultadosPruebas.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Resultados de Pruebas</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {resultadosPruebas.map((resultado, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      resultado.exitoso 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {resultado.exitoso ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={resultado.exitoso ? "default" : "destructive"}>
                          {resultado.tipo}
                        </Badge>
                        <span className="text-sm font-medium">
                          {resultado.mensaje}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {resultado.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {resultado.detalles && (
                      <p className="text-sm text-gray-600 mt-1 ml-6">
                        {resultado.detalles}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración de Destinatarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Destinatarios de Alertas
          </CardTitle>
          <CardDescription>
            Gestiona quién recibirá las notificaciones y cómo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lista de Destinatarios */}
          <div className="space-y-3">
            {configuracion.destinatarios && configuracion.destinatarios.map((destinatario) => (
              <div
                key={destinatario.id}
                className={`p-4 border rounded-lg ${
                  destinatario.activo ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={destinatario.activo}
                      onCheckedChange={() => toggleDestinatario(destinatario.id)}
                    />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {destinatario.nombre}
                        <Badge variant={destinatario.prioridad === 'CRITICA' ? 'destructive' : 'secondary'}>
                          {destinatario.prioridad}
                        </Badge>
                        <Badge variant="outline">
                          {destinatario.tipo}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {destinatario.email}
                        {destinatario.telefono && ` • ${destinatario.telefono}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editarDestinatario(destinatario.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDestinatario(destinatario.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Formulario para Agregar/Editar Destinatario */}
          {mostrarFormularioDestinatario && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">
                {editandoDestinatario ? 'Editar' : 'Agregar'} Destinatario
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={nuevoDestinatario.nombre || ''}
                    onChange={(e) => setNuevoDestinatario(prev => ({
                      ...prev,
                      nombre: e.target.value
                    }))}
                    placeholder="Nombre del destinatario"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={nuevoDestinatario.email || ''}
                    onChange={(e) => setNuevoDestinatario(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    placeholder="email@ejemplo.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={nuevoDestinatario.telefono || ''}
                    onChange={(e) => setNuevoDestinatario(prev => ({
                      ...prev,
                      telefono: e.target.value
                    }))}
                    placeholder="+52 55 1234 5678"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo de Notificación</Label>
                  <Select
                    value={nuevoDestinatario.tipo || 'EMAIL'}
                    onValueChange={(value: 'EMAIL' | 'SMS' | 'AMBOS') => 
                      setNuevoDestinatario(prev => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="AMBOS">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select
                    value={nuevoDestinatario.prioridad || 'MEDIA'}
                    onValueChange={(value: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA') => 
                      setNuevoDestinatario(prev => ({ ...prev, prioridad: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAJA">Baja</SelectItem>
                      <SelectItem value="MEDIA">Media</SelectItem>
                      <SelectItem value="ALTA">Alta</SelectItem>
                      <SelectItem value="CRITICA">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={editandoDestinatario ? actualizarDestinatario : agregarDestinatario}
                  size="sm"
                >
                  {editandoDestinatario ? 'Actualizar' : 'Agregar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMostrarFormularioDestinatario(false)
                    setEditandoDestinatario(null)
                    setNuevoDestinatario({})
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Botón para Agregar Nuevo Destinatario */}
          {!mostrarFormularioDestinatario && (
            <Button
              onClick={() => setMostrarFormularioDestinatario(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar Destinatario
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Configuración Avanzada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración Avanzada
          </CardTitle>
          <CardDescription>
            Opciones avanzadas para el sistema de alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="modoPrueba">Modo de Pruebas</Label>
              <p className="text-sm text-gray-600">
                Activa funcionalidades adicionales para testing
              </p>
            </div>
            <Switch
              id="modoPrueba"
              checked={configuracionAvanzada.modoPrueba}
              onCheckedChange={toggleModoPrueba}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="logDetallado">Log Detallado</Label>
              <p className="text-sm text-gray-600">
                Registra información detallada de todas las operaciones
              </p>
            </div>
            <Switch
              id="logDetallado"
              checked={configuracionAvanzada.logDetallado}
              onCheckedChange={(checked) => setConfiguracionAvanzada(prev => ({
                ...prev,
                logDetallado: checked
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="simulacionTiempoReal">Simulación en Tiempo Real</Label>
              <p className="text-sm text-gray-600">
                Simula alertas en tiempo real para testing
              </p>
            </div>
            <Switch
              id="simulacionTiempoReal"
              checked={configuracionAvanzada.simulacionTiempoReal}
              onCheckedChange={(checked) => setConfiguracionAvanzada(prev => ({
                ...prev,
                simulacionTiempoReal: checked
              }))}
            />
          </div>

          <div>
            <Label htmlFor="intervaloPruebasAutomaticas">Pruebas Automáticas</Label>
            <p className="text-sm text-gray-600 mb-2">
              Ejecuta pruebas automáticamente cada cierto tiempo
            </p>
            <div className="flex gap-2">
              {[0, 5, 15, 30, 60].map((minutos) => (
                <Button
                  key={minutos}
                  variant={configuracionAvanzada.intervaloPruebasAutomaticas === minutos ? "default" : "outline"}
                  size="sm"
                  onClick={() => activarPruebasAutomaticas(minutos)}
                >
                  {minutos === 0 ? 'Desactivado' : `${minutos} min`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleGuardar}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isLoading ? 'Guardando...' : saveSuccess ? 'Guardado' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  )
}
