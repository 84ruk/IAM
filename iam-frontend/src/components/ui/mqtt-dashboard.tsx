'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button  from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Scale,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface MqttStatus {
  enabled: boolean
  connected: boolean
  reconnectAttempts: number
}

interface DeviceInfo {
  id: string
  username: string
  is_superuser: boolean
  created_at: string
  updated_at: string
  stats?: {
    connections: number
    subscriptions: number
    topics: number
  }
}

interface SensorReading {
  id: number
  sensorId: number
  tipo: string
  valor: number
  unidad: string
  fecha: string
  ubicacion: string
}

export function MqttDashboard() {
  const [status, setStatus] = useState<MqttStatus>({
    enabled: false,
    connected: false,
    reconnectAttempts: 0
  })
  
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [recentReadings, setRecentReadings] = useState<SensorReading[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError('')

      const [statusRes, devicesRes, readingsRes] = await Promise.all([
        fetch('/api/mqtt-sensor/status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/mqtt-sensor/devices', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/sensores/lecturas/recientes', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatus(statusData)
      }

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json()
        setDevices(devicesData)
      }

      if (readingsRes.ok) {
        const readingsData = await readingsRes.json()
        setRecentReadings(readingsData)
      }
    } catch {
      setError('Error cargando datos del dashboard')
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSensorIcon = (tipo: string) => {
    switch (tipo) {
      case 'TEMPERATURA': return <Thermometer className="w-4 h-4" />
      case 'HUMEDAD': return <Droplets className="w-4 h-4" />
      case 'PESO': return <Scale className="w-4 h-4" />
      case 'PRESION': return <Gauge className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = (connected: boolean) => {
    return connected ? 'text-green-600' : 'text-red-600'
  }

  const getStatusBadge = (connected: boolean) => {
    return connected ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Conectado
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Desconectado
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard MQTT</h2>
          <p className="text-gray-600">Monitoreo en tiempo real de sensores y conexiones MQTT</p>
        </div>
        <Button
          onClick={loadDashboardData}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estado MQTT</p>
                <div className="flex items-center gap-2 mt-1">
                  {status.connected ? (
                    <Wifi className={`w-5 h-5 ${getStatusColor(status.connected)}`} />
                  ) : (
                    <WifiOff className={`w-5 h-5 ${getStatusColor(status.connected)}`} />
                  )}
                  {getStatusBadge(status.connected)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dispositivos</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reconexiones</p>
                <p className="text-2xl font-bold">{status.reconnectAttempts}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lecturas (24h)</p>
                <p className="text-2xl font-bold">{recentReadings.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices and Recent Readings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispositivos Conectados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Dispositivos Conectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <WifiOff className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay dispositivos conectados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{device.username}</p>
                        <p className="text-xs text-gray-500">
                          Creado: {formatDate(device.created_at)}
                        </p>
                      </div>
                    </div>
                    {device.stats && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Conexiones</p>
                        <p className="font-medium">{device.stats.connections}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lecturas Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Lecturas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReadings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay lecturas recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReadings.slice(0, 10).map((reading) => (
                  <div
                    key={reading.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getSensorIcon(reading.tipo)}
                      <div>
                        <p className="font-medium">
                          {reading.valor} {reading.unidad}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reading.ubicacion} • {formatDate(reading.fecha)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {reading.tipo}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connection Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de Conexión MQTT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Estado del Servicio</p>
              <div className="flex items-center gap-2">
                {status.enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className={status.enabled ? 'text-green-600' : 'text-red-600'}>
                  {status.enabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Conexión al Broker</p>
              <div className="flex items-center gap-2">
                {status.connected ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className={status.connected ? 'text-green-600' : 'text-red-600'}>
                  {status.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Última Actualización</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {new Date().toLocaleTimeString('es-ES')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 