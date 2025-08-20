'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  RefreshCw, 
  Search, 
  Mail,
  Phone,
  Wifi,
  Zap,
  MapPin,
  Thermometer,
  Droplets,
  Gauge,
  Scale,
  Settings
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface AlertaActiva {
  id: string
  sensorId: number
  sensorNombre: string
  sensorTipo: string
  ubicacion: string
  valor: number
  unidad: string
  umbralMin?: number
  umbralMax?: number
  severidad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  estado: 'ACTIVA' | 'EN_ESCALAMIENTO' | 'RESUELTA' | 'ESCALADA'
  mensaje: string
  timestamp: string
  nivelEscalamiento: number
  destinatariosNotificados: string[]
  ultimaNotificacion?: string
  proximaNotificacion?: string
  intentosNotificacion: number
  maxIntentos: number
}

interface AlertasActivasGestionProps {
  alertas: AlertaActiva[]
  onResolver: (alertaId: string) => Promise<void>
  onEscalar: (alertaId: string) => Promise<void>
  onReenviarNotificacion: (alertaId: string, tipo: 'email' | 'sms' | 'websocket') => Promise<void>
  onActualizar: () => Promise<void>
  isLoading?: boolean
}

export function AlertasActivasGestion({ 
  alertas, 
  onResolver, 
  onEscalar, 
  onReenviarNotificacion,
  onActualizar,
  isLoading = false 
}: AlertasActivasGestionProps) {
  const [filtros, setFiltros] = useState({
    busqueda: '',
    severidad: 'TODAS',
    estado: 'TODOS',
    sensorTipo: 'TODOS',
    ubicacion: 'TODAS'
  })
  
  const [alertasFiltradas, setAlertasFiltradas] = useState<AlertaActiva[]>(alertas)
  const [ordenamiento, setOrdenamiento] = useState<'timestamp' | 'severidad' | 'sensor'>('timestamp')
  const { addToast } = useToast()

  useEffect(() => {
    let resultado = [...alertas]

    // Filtro de búsqueda
    if (filtros.busqueda) {
      resultado = resultado.filter(alerta => 
        alerta.sensorNombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        alerta.mensaje.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        alerta.ubicacion.toLowerCase().includes(filtros.busqueda.toLowerCase())
      )
    }

    // Filtro de severidad
    if (filtros.severidad !== 'TODAS') {
      resultado = resultado.filter(alerta => alerta.severidad === filtros.severidad)
    }

    // Filtro de estado
    if (filtros.estado !== 'TODOS') {
      resultado = resultado.filter(alerta => alerta.estado === filtros.estado)
    }

    // Filtro de tipo de sensor
    if (filtros.sensorTipo !== 'TODOS') {
      resultado = resultado.filter(alerta => alerta.sensorTipo === filtros.sensorTipo)
    }

    // Filtro de ubicación
    if (filtros.ubicacion !== 'TODAS') {
      resultado = resultado.filter(alerta => alerta.ubicacion === filtros.ubicacion)
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      switch (ordenamiento) {
        case 'timestamp':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'severidad':
          const ordenSeveridad = { 'CRITICA': 4, 'ALTA': 3, 'MEDIA': 2, 'BAJA': 1 }
          return ordenSeveridad[b.severidad] - ordenSeveridad[a.severidad]
        case 'sensor':
          return a.sensorNombre.localeCompare(b.sensorNombre)
        default:
          return 0
      }
    })

    setAlertasFiltradas(resultado)
  }, [alertas, filtros, ordenamiento])

  const handleResolver = async (alertaId: string) => {
    try {
      await onResolver(alertaId)
      addToast({
        type: 'success',
        title: 'Alerta resuelta',
        message: 'La alerta se ha marcado como resuelta'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo resolver la alerta'
      })
    }
  }

  const handleEscalar = async (alertaId: string) => {
    try {
      await onEscalar(alertaId)
      addToast({
        type: 'success',
        title: 'Alerta escalada',
        message: 'La alerta se ha escalado al siguiente nivel'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo escalar la alerta'
      })
    }
  }

  const handleReenviarNotificacion = async (alertaId: string, tipo: 'email' | 'sms' | 'websocket') => {
    try {
      await onReenviarNotificacion(alertaId, tipo)
      addToast({
        type: 'success',
        title: 'Notificación reenviada',
        message: `Se ha reenviado la notificación por ${tipo.toUpperCase()}`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: `No se pudo reenviar la notificación por ${tipo.toUpperCase()}`
      })
    }
  }

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case 'TEMPERATURA': return <Thermometer className="w-4 h-4 text-red-500" />
      case 'HUMEDAD': return <Droplets className="w-4 h-4 text-blue-500" />
      case 'PRESION': return <Gauge className="w-4 h-4 text-purple-500" />
      case 'PESO': return <Scale className="w-4 h-4 text-green-500" />
      default: return <Settings className="w-4 h-4 text-gray-500" />
    }
  }

  const getSeverityColor = (severidad: string) => {
    switch (severidad) {
      case 'BAJA': return 'bg-green-100 text-green-800'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800'
      case 'ALTA': return 'bg-orange-100 text-orange-800'
      case 'CRITICA': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return 'bg-red-100 text-red-800'
      case 'EN_ESCALAMIENTO': return 'bg-orange-100 text-orange-800'
      case 'RESUELTA': return 'bg-green-100 text-green-800'
      case 'ESCALADA': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTiempoTranscurrido = (timestamp: string) => {
    const ahora = new Date()
    const alerta = new Date(timestamp)
    const diffMs = ahora.getTime() - alerta.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 60) return `${diffMins} min`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ${diffMins % 60}min`
    return `${Math.floor(diffMins / 1440)}d ${Math.floor((diffMins % 1440) / 60)}h`
  }

  const ubicacionesUnicas = [...new Set(alertas.map(a => a.ubicacion))]
  const tiposSensorUnicos = [...new Set(alertas.map(a => a.sensorTipo))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-2xl font-bold">Alertas Activas</h2>
            <p className="text-gray-600">
              {alertasFiltradas.length} de {alertas.length} alertas mostradas
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onActualizar}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="busqueda">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="busqueda"
                  placeholder="Buscar por sensor, mensaje o ubicación..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severidad">Severidad</Label>
              <Select
                value={filtros.severidad}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, severidad: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas las severidades</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="CRITICA">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={filtros.estado}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVA">Activa</SelectItem>
                  <SelectItem value="EN_ESCALAMIENTO">En escalamiento</SelectItem>
                  <SelectItem value="ESCALADA">Escalada</SelectItem>
                  <SelectItem value="RESUELTA">Resuelta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoSensor">Tipo de Sensor</Label>
              <Select
                value={filtros.sensorTipo}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, sensorTipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los tipos</SelectItem>
                  {tiposSensorUnicos.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Select
                value={filtros.ubicacion}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, ubicacion: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas las ubicaciones</SelectItem>
                  {ubicacionesUnicas.map(ubicacion => (
                    <SelectItem key={ubicacion} value={ubicacion}>{ubicacion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordenamiento">Ordenar por</Label>
              <Select
                value={ordenamiento}
                onValueChange={(value) => setOrdenamiento(value as 'timestamp' | 'severidad' | 'sensor')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">Más reciente</SelectItem>
                  <SelectItem value="severidad">Mayor severidad</SelectItem>
                  <SelectItem value="sensor">Nombre del sensor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {alertasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alertas activas</h3>
              <p className="text-gray-500">
                {filtros.busqueda || filtros.severidad !== 'TODAS' || filtros.estado !== 'TODOS' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'El sistema está funcionando normalmente'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          alertasFiltradas.map((alerta) => (
            <Card key={alerta.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getIconForTipo(alerta.sensorTipo)}
                    <div>
                      <h3 className="font-semibold text-lg">{alerta.sensorNombre}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {alerta.ubicacion}
                        <span className="mx-2">•</span>
                        <span>{alerta.sensorTipo}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alerta.severidad)}>
                      {alerta.severidad}
                    </Badge>
                    <Badge className={getEstadoColor(alerta.estado)}>
                      {alerta.estado.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Valor Actual</div>
                    <div className="text-lg font-semibold">
                      {alerta.valor} {alerta.unidad}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Rango Normal</div>
                    <div className="text-sm">
                      {alerta.umbralMin !== undefined && alerta.umbralMax !== undefined 
                        ? `${alerta.umbralMin} - ${alerta.umbralMax} ${alerta.unidad}`
                        : 'No configurado'
                      }
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Tiempo Activa</div>
                    <div className="text-sm font-medium">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {getTiempoTranscurrido(alerta.timestamp)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Nivel Escalamiento</div>
                    <div className="text-sm font-medium">
                      <Zap className="w-4 h-4 inline mr-1" />
                      {alerta.nivelEscalamiento}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Mensaje de Alerta:</div>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-red-800">{alerta.mensaje}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Destinatarios Notificados:</div>
                    <div className="flex flex-wrap gap-1">
                      {alerta.destinatariosNotificados.length > 0 ? (
                        alerta.destinatariosNotificados.map((destinatario, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {destinatario}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Ninguno</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Estado de Notificaciones:</div>
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span>Intentos: {alerta.intentosNotificacion}/{alerta.maxIntentos}</span>
                      </div>
                      {alerta.ultimaNotificacion && (
                        <div className="text-gray-600">
                          Última: {formatTimestamp(alerta.ultimaNotificacion)}
                        </div>
                      )}
                      {alerta.proximaNotificacion && (
                        <div className="text-gray-600">
                          Próxima: {formatTimestamp(alerta.proximaNotificacion)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Creada: {formatTimestamp(alerta.timestamp)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReenviarNotificacion(alerta.id, 'email')}
                      disabled={isLoading}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Reenviar Email
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReenviarNotificacion(alerta.id, 'sms')}
                      disabled={isLoading}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Reenviar SMS
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReenviarNotificacion(alerta.id, 'websocket')}
                      disabled={isLoading}
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      Reenviar WS
                    </Button>
                    
                    {alerta.estado === 'ACTIVA' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEscalar(alerta.id)}
                        disabled={isLoading}
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Escalar
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleResolver(alerta.id)}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Estadísticas Rápidas */}
      {alertas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {alertas.filter(a => a.severidad === 'CRITICA').length}
                </div>
                <div className="text-sm text-gray-600">Críticas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {alertas.filter(a => a.severidad === 'ALTA').length}
                </div>
                <div className="text-sm text-gray-600">Altas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {alertas.filter(a => a.severidad === 'MEDIA').length}
                </div>
                <div className="text-sm text-gray-600">Medias</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {alertas.filter(a => a.severidad === 'BAJA').length}
                </div>
                <div className="text-sm text-gray-600">Bajas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
