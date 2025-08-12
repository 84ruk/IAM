'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Thermometer, 
  Droplets, 
  Scale, 
  Gauge,
  Trash2,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  Cpu
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ESP32DashboardProps {
  ubicacionId?: number;
}

interface ESP32Device {
  id: number;
  deviceId: string;
  nombre: string;
  tipo: string;
  activo: boolean;
  ultimaActualizacion: string;
  ubicacion: {
    nombre: string;
  };
  sensores: Array<{
    id: number;
    nombre: string;
    tipo: string;
  }>;
  estado: {
    deviceId: string;
    connected: boolean;
    lastSeen?: string;
    dataReceived?: boolean;
    sensorCount?: number;
    uptime?: number;
    wifiRSSI?: number;
    mqttConnected?: boolean;
    lastDataTimestamp?: string;
    errors?: string[];
  };
}

interface ESP32Stats {
  total: number;
  conectados: number;
  desconectados: number;
  sensoresActivos: number;
  tasaConectividad: number;
}

export function ESP32Dashboard({ ubicacionId }: ESP32DashboardProps) {
  const [dispositivos, setDispositivos] = useState<ESP32Device[]>([]);
  const [estadisticas, setEstadisticas] = useState<ESP32Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<ESP32Device | null>(null);
  const [error, setError] = useState<string>('')
  const { addToast } = useToast()

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      
      // Cargar dispositivos y estadísticas en paralelo
      const [dispositivosRes, estadisticasRes] = await Promise.all([
        fetch('/api/mqtt-sensor/esp32/dispositivos'),
        fetch(`/api/mqtt-sensor/esp32/estadisticas${ubicacionId ? `?ubicacionId=${ubicacionId}` : ''}`)
      ]);

      if (dispositivosRes.ok) {
        const dispositivosData = await dispositivosRes.json();
        setDispositivos(dispositivosData.dispositivos || []);
      }

      if (estadisticasRes.ok) {
        const estadisticasData = await estadisticasRes.json();
        setEstadisticas(estadisticasData.estadisticas);
      }
    } catch {
      addToast({
        title: 'Error',
        message: 'Error cargando datos de dispositivos ESP32',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // Actualizar datos cada 30 segundos
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, [ubicacionId]);

  const eliminarDispositivo = async (deviceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este dispositivo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/mqtt-sensor/esp32/dispositivo/${deviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        addToast({
          title: 'Dispositivo eliminado',
          message: 'El dispositivo ESP32 ha sido eliminado correctamente',
          type: 'success'
        });
        cargarDatos(); // Recargar datos
      } else {
        const error = await response.json();
        addToast({
          title: 'Error',
          message: error.message || 'Error eliminando dispositivo',
          type: 'error'
        });
      }
    } catch {
      addToast({
        title: 'Error',
        message: 'Error de conexión',
        type: 'error'
      });
    }
  };

  const getStatusIcon = (connected: boolean, dataReceived?: boolean) => {
    if (!connected) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (dataReceived === false) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = (connected: boolean, dataReceived?: boolean) => {
    if (!connected) return 'Desconectado';
    if (dataReceived === false) return 'Sin datos';
    return 'Conectado';
  };

  const getStatusBadge = (connected: boolean, dataReceived?: boolean) => {
    if (!connected) return <Badge variant="destructive">Desconectado</Badge>;
    if (dataReceived === false) return <Badge variant="secondary">Sin datos</Badge>;
    return <Badge variant="default">Conectado</Badge>;
  };

  const getSensorIcon = (tipo: string) => {
    switch (tipo) {
      case 'TEMPERATURA': return <Thermometer className="w-4 h-4" />;
      case 'HUMEDAD': return <Droplets className="w-4 h-4" />;
      case 'PESO': return <Scale className="w-4 h-4" />;
      case 'PRESION': return <Gauge className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatUptime = (uptime?: number) => {
    if (!uptime) return 'N/A';
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Nunca';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-lg font-medium">Cargando dispositivos ESP32...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs y Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dispositivos</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total}</div>
              <p className="text-xs text-muted-foreground">
                Dispositivos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conectados</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estadisticas.conectados}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.tasaConectividad.toFixed(1)}% tasa de conectividad
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desconectados</CardTitle>
              <WifiOff className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{estadisticas.desconectados}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sensores Activos</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estadisticas.sensoresActivos}</div>
              <p className="text-xs text-muted-foreground">
                Enviando datos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Dispositivos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Dispositivos ESP32
            </CardTitle>
            <Button onClick={cargarDatos} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dispositivos.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay dispositivos ESP32 registrados. 
                <a href="/sensores/esp32/configuracion-automatica" className="text-blue-600 hover:underline ml-1">
                  Configura tu primer dispositivo
                </a>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {dispositivos.map((dispositivo) => (
                <div key={dispositivo.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(dispositivo.estado?.connected || false, dispositivo.estado?.dataReceived)}
                      <div>
                        <h3 className="font-medium">{dispositivo.nombre}</h3>
                        <p className="text-sm text-gray-500">
                          {dispositivo.ubicacion.nombre} • {dispositivo.deviceId}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(dispositivo.estado?.connected || false, dispositivo.estado?.dataReceived)}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDevice(selectedDevice?.id === dispositivo.id ? null : dispositivo)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => eliminarDispositivo(dispositivo.deviceId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Detalles expandibles */}
                  {selectedDevice?.id === dispositivo.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Estado:</span>
                          <p className="font-medium">
                            {getStatusText(dispositivo.estado?.connected || false, dispositivo.estado?.dataReceived)}
                          </p>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Última conexión:</span>
                          <p className="font-medium">
                            {formatLastSeen(dispositivo.estado?.lastSeen)}
                          </p>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Tiempo activo:</span>
                          <p className="font-medium">
                            {formatUptime(dispositivo.estado?.uptime)}
                          </p>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Señal WiFi:</span>
                          <p className="font-medium">
                            {dispositivo.estado?.wifiRSSI ? `${dispositivo.estado.wifiRSSI} dBm` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Sensores */}
                      <div>
                        <h4 className="font-medium mb-2">Sensores ({dispositivo.sensores.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {dispositivo.sensores.map((sensor) => (
                            <div key={sensor.id} className="flex items-center gap-2 text-sm">
                              {getSensorIcon(sensor.tipo)}
                              <span>{sensor.nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Errores */}
                      {dispositivo.estado?.errors && dispositivo.estado.errors.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-red-600">Errores</h4>
                          <div className="space-y-1">
                            {dispositivo.estado.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-600">• {error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 