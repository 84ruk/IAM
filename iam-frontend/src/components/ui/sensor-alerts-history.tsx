'use client'

import { useState } from 'react'
import { useSensorAlerts } from '@/hooks/useSensorAlerts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter,
  RefreshCw,
  Bell
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface SensorAlertsHistoryProps {
  className?: string
}

export function SensorAlertsHistory({ className }: SensorAlertsHistoryProps) {
  const {
    alertas,
    estadisticas,
    loading,
    error,
    fetchAlertas,
    actualizarEstadoAlerta,
    simularAlerta,
    refetch
  } = useSensorAlerts()

  const { addToast } = useToast()
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    ubicacionId: ''
  })

  const [simulacion, setSimulacion] = useState({
    tipo: 'TEMPERATURA',
    valor: 35
  })

  const handleFiltrar = () => {
    fetchAlertas({
      estado: filtros.estado || undefined,
      tipo: filtros.tipo || undefined,
      ubicacionId: filtros.ubicacionId ? parseInt(filtros.ubicacionId) : undefined
    })
  }

  const handleActualizarEstado = async (alertaId: string, nuevoEstado: string) => {
    const success = await actualizarEstadoAlerta(
      alertaId, 
      nuevoEstado as 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTA' | 'IGNORADA'
    )
    
    if (success) {
      addToast({
        type: 'success',
        title: 'Estado actualizado',
        message: 'El estado de la alerta se ha actualizado correctamente'
      })
    }
  }

  const handleSimularAlerta = async () => {
    const resultado = await simularAlerta(simulacion.tipo, simulacion.valor)
    if (resultado) {
      addToast({
        type: 'success',
        title: 'Alerta simulada',
        message: 'Se ha generado una alerta de prueba correctamente'
      })
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
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800'
      case 'EN_PROCESO': return 'bg-blue-100 text-blue-800'
      case 'RESUELTA': return 'bg-green-100 text-green-800'
      case 'IGNORADA': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Clock className="w-4 h-4" />
      case 'EN_PROCESO': return <Clock className="w-4 h-4" /> // Changed from Play to Clock
      case 'RESUELTA': return <CheckCircle className="w-4 h-4" />
      case 'IGNORADA': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
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
    <div className={`space-y-6 ${className}`}>
      {/* Header y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estadisticas?.pendientes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" /> {/* Changed from Play to Clock */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas?.enProceso || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas?.resueltas || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={filtros.estado}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                  <SelectItem value="RESUELTA">Resuelta</SelectItem>
                  <SelectItem value="IGNORADA">Ignorada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Sensor</Label>
              <Select
                value={filtros.tipo}
                onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  <SelectItem value="TEMPERATURA">Temperatura</SelectItem>
                  <SelectItem value="HUMEDAD">Humedad</SelectItem>
                  <SelectItem value="PESO">Peso</SelectItem>
                  <SelectItem value="PRESION">Presión</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                placeholder="ID de ubicación"
                value={filtros.ubicacionId}
                onChange={(e) => setFiltros(prev => ({ ...prev, ubicacionId: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleFiltrar} disabled={loading}>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline" onClick={refetch} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simulación de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Simular Alerta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="simTipo">Tipo de Sensor</Label>
              <Select
                value={simulacion.tipo}
                onValueChange={(value) => setSimulacion(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEMPERATURA">Temperatura</SelectItem>
                  <SelectItem value="HUMEDAD">Humedad</SelectItem>
                  <SelectItem value="PESO">Peso</SelectItem>
                  <SelectItem value="PRESION">Presión</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="simValor">Valor</Label>
              <Input
                id="simValor"
                type="number"
                value={simulacion.valor}
                onChange={(e) => setSimulacion(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                placeholder="35"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleSimularAlerta} disabled={loading}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Simular Alerta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : alertas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay alertas para mostrar
            </div>
          ) : (
            <div className="space-y-4">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getSeverityColor(alerta.severidad)}>
                          {alerta.severidad}
                        </Badge>
                        <Badge className={getEstadoColor(alerta.estado)}>
                          <div className="flex items-center gap-1">
                            {getEstadoIcon(alerta.estado)}
                            {alerta.estado}
                          </div>
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(alerta.timestamp)}
                        </span>
                      </div>

                      <h4 className="font-medium mb-1">
                        Alerta de {alerta.sensorTipo} - Sensor {alerta.sensorId}
                      </h4>
                      <p className="text-gray-600 mb-2">{alerta.mensaje}</p>

                      <div className="text-sm text-gray-500">
                        <span>Ubicación: {alerta.ubicacionNombre}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {alerta.estado === 'PENDIENTE' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActualizarEstado(alerta.id, 'EN_PROCESO')}
                          >
                            <Clock className="w-4 h-4 mr-1" /> {/* Changed from Play to Clock */}
                            En Proceso
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActualizarEstado(alerta.id, 'IGNORADA')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Ignorar
                          </Button>
                        </>
                      )}

                      {alerta.estado === 'EN_PROCESO' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActualizarEstado(alerta.id, 'RESUELTA')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolver
                        </Button>
                      )}

                      {alerta.estado === 'RESUELTA' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActualizarEstado(alerta.id, 'PENDIENTE')}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Reabrir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
