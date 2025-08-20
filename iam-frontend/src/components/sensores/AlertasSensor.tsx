import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useAlertasSensor } from '@/hooks/useAlertasSensor'
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Bell, Activity, Globe } from 'lucide-react'

interface AlertasSensorProps {
  sensorId: number
  sensorNombre: string
  sensorTipo: string
}

export function AlertasSensor({ sensorId, sensorNombre, sensorTipo }: AlertasSensorProps) {
  const {
    alertas,
    alertasActivas,
    estadisticas,
    historial,
    isLoading,
    error,
    obtenerHistorial,
    resolverAlerta,
    probarConfiguracion,
    refrescarDatos,
  } = useAlertasSensor(sensorId)

  const [activeTab, setActiveTab] = useState('resumen')
  const [resolviendoAlerta, setResolviendoAlerta] = useState<number | null>(null)

  useEffect(() => {
    if (sensorId) {
      refrescarDatos()
    }
  }, [sensorId, refrescarDatos])

  const handleResolverAlerta = async (alertaId: number) => {
    setResolviendoAlerta(alertaId)
    try {
      const success = await resolverAlerta(alertaId, 'Resuelta por el usuario')
      if (success) {
        // La alerta se actualizó automáticamente en el hook
      }
    } finally {
      setResolviendoAlerta(null)
    }
  }

  const handleProbarConfiguracion = async (tipo: 'EMAIL' | 'SMS' | 'WEBSOCKET') => {
    const resultado = await probarConfiguracion(tipo)
    if (resultado) {
      alert(`✅ Prueba ${tipo} enviada exitosamente a: ${resultado.destinatario}`)
    }
  }

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'CRITICA': return 'destructive'
      case 'ALTA': return 'destructive'
      case 'MEDIA': return 'default'
      case 'BAJA': return 'secondary'
      default: return 'default'
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return 'destructive'
      case 'RESUELTA': return 'default'
      case 'ESCALADA': return 'destructive'
      default: return 'secondary'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return <AlertTriangle className="h-4 w-4" />
      case 'RESUELTA': return <CheckCircle className="h-4 w-4" />
      case 'ESCALADA': return <TrendingUp className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatFecha = (fecha: Date | string) => {
    const date = new Date(fecha)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Estado cuando el backend no está disponible
  if (error && error.includes('conexión')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Sistema de Alertas - Backend no disponible
          </CardTitle>
          <CardDescription>
            El servidor de alertas no está ejecutándose. Las funcionalidades estarán disponibles cuando se conecte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Estado:</strong> Backend offline
                <br />
                <strong>Acción requerida:</strong> Iniciar el servidor backend
                <br />
                <strong>Endpoint esperado:</strong> http://localhost:3001
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-2">Funcionalidades disponibles cuando el backend esté activo:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Monitoreo de alertas en tiempo real</li>
                  <li>• Historial de alertas del sensor</li>
                  <li>• Estadísticas de alertas</li>
                  <li>• Resolución de alertas</li>
                  <li>• Pruebas de configuración</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-semibold mb-2">Para activar el sistema:</h4>
                <ol className="text-sm space-y-1 text-blue-700">
                  <li>1. Ir al directorio del backend</li>
                  <li>2. Ejecutar: npm run start:dev</li>
                  <li>3. Esperar a que se inicie</li>
                  <li>4. Recargar esta página</li>
                </ol>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={refrescarDatos}
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Verificar conexión
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.open('http://localhost:3001/health', '_blank')}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                Probar endpoint de salud
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading && !estadisticas) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin" />
            Cargando alertas...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar las alertas: {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={refrescarDatos}
          >
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Resumen de Alertas - {sensorNombre}
          </CardTitle>
          <CardDescription>
            Sensor {sensorTipo} • ID: {sensorId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estadisticas && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">
                  {estadisticas.activas || 0}
                </div>
                <div className="text-sm text-red-600">Activas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {estadisticas.resueltas || 0}
                </div>
                <div className="text-sm text-green-600">Resueltas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">
                  {estadisticas.escaladas || 0}
                </div>
                <div className="text-sm text-orange-600">Escaladas</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {estadisticas.total || 0}
                </div>
                <div className="text-sm text-blue-600">Total</div>
              </div>
            </div>
          )}

          {/* Indicadores de Severidad */}
          {estadisticas && estadisticas.porSeveridad && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución por Severidad</h4>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <Badge variant="secondary" className="w-full">
                    {estadisticas.porSeveridad.BAJA || 0} BAJA
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge variant="default" className="w-full">
                    {estadisticas.porSeveridad.MEDIA || 0} MEDIA
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge variant="destructive" className="w-full">
                    {estadisticas.porSeveridad.ALTA || 0} ALTA
                  </Badge>
                </div>
                <div className="text-center">
                  <Badge variant="destructive" className="w-full">
                    {estadisticas.porSeveridad.CRITICA || 0} CRÍTICA
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleProbarConfiguracion('EMAIL')}
            >
              Probar Email
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleProbarConfiguracion('SMS')}
            >
              Probar SMS
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleProbarConfiguracion('WEBSOCKET')}
            >
              Probar WebSocket
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refrescarDatos}
            >
              Refrescar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para Diferentes Vistas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="activas">Activas ({estadisticas?.activas || 0})</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recientes</CardTitle>
              <CardDescription>
                Últimas alertas del sensor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No hay alertas para este sensor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertas.slice(0, 5).map((alerta) => (
                    <div key={alerta.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getEstadoIcon(alerta.estado)}
                        <div>
                          <div className="font-medium">{alerta.mensaje}</div>
                          <div className="text-sm text-gray-500">
                            {formatFecha(alerta.fechaEnvio)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeveridadColor(alerta.severidad)}>
                          {alerta.severidad}
                        </Badge>
                        <Badge variant={getEstadoColor(alerta.estado)}>
                          {alerta.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Alertas Activas */}
        <TabsContent value="activas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Activas</CardTitle>
              <CardDescription>
                Alertas que requieren atención inmediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertasActivas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No hay alertas activas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertasActivas.map((alerta) => (
                    <div key={alerta.id} className="p-4 border rounded-lg bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <h4 className="font-semibold text-red-800">{alerta.mensaje}</h4>
                          </div>
                          <div className="text-sm text-red-700 mb-3">
                            <strong>Severidad:</strong> {alerta.severidad} • 
                            <strong> Fecha:</strong> {formatFecha(alerta.fechaEnvio)}
                          </div>
                          {alerta.valor && (
                            <div className="text-sm text-red-700 mb-2">
                              <strong>Valor:</strong> {alerta.valor}
                            </div>
                          )}
                          {alerta.umbralesExcedidos && alerta.umbralesExcedidos.length > 0 && (
                            <div className="text-sm text-red-700 mb-2">
                              <strong>Umbrales excedidos:</strong> {alerta.umbralesExcedidos.join(', ')}
                            </div>
                          )}
                          {alerta.recomendaciones && alerta.recomendaciones.length > 0 && (
                            <div className="text-sm text-red-700">
                              <strong>Recomendaciones:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {alerta.recomendaciones.map((rec, idx) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant={getSeveridadColor(alerta.severidad)}>
                            {alerta.severidad}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleResolverAlerta(alerta.id)}
                            disabled={resolviendoAlerta === alerta.id}
                          >
                            {resolviendoAlerta === alerta.id ? 'Resolviendo...' : 'Resolver'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alertas</CardTitle>
              <CardDescription>
                Historial completo de alertas del sensor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historial ? (
                <div className="space-y-4">
                  {/* Filtros */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => obtenerHistorial(7)}
                    >
                      Últimos 7 días
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => obtenerHistorial(30)}
                    >
                      Últimos 30 días
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => obtenerHistorial(90)}
                    >
                      Últimos 90 días
                    </Button>
                  </div>

                  {/* Histórico por fecha */}
                  {Object.entries(historial.agrupadoPorFecha).map(([fecha, alertasFecha]) => (
                    <div key={fecha} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-gray-700">
                        {new Date(fecha).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                      <div className="space-y-2">
                        {alertasFecha.map((alerta) => (
                          <div key={alerta.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {getEstadoIcon(alerta.estado)}
                              <span className="text-sm">{alerta.mensaje}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getSeveridadColor(alerta.severidad)} size="sm">
                                {alerta.severidad}
                              </Badge>
                              <Badge variant={getEstadoColor(alerta.estado)} size="sm">
                                {alerta.estado}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatFecha(alerta.fechaEnvio)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No hay historial disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
