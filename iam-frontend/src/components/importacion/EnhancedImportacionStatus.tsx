'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Download, 
  RefreshCw,
  Info,
  TrendingUp,
  Timer,
  HardDrive,
  Cpu,
  Zap,
  Settings
} from 'lucide-react'

interface TrabajoImportacion {
  id: string
  tipo: string
  empresaId: number
  usuarioId: number
  archivoOriginal: string
  totalRegistros: number
  registrosProcesados: number
  registrosExitosos: number
  registrosConError: number
  errores: any[]
  opciones: any
  fechaCreacion: string
  progreso: number
  estado: string
}

interface ProgressStage {
  id: string
  nombre: string
  progreso: number
  estado: 'pendiente' | 'procesando' | 'completado' | 'error'
  mensaje: string
  errores: any[]
  tiempoInicio?: Date
  tiempoFin?: Date
}

interface ProgressSummary {
  trabajoId: string
  tipoImportacion: string
  totalRegistros: number
  registrosProcesados: number
  registrosExitosos: number
  registrosConError: number
  progresoGeneral: number
  estado: string
  etapas: ProgressStage[]
  tiempoEstimado: number
  tiempoTranscurrido: number
  alertas: string[]
  metricas: {
    velocidadProcesamiento: number
    eficiencia: number
    erroresPorMinuto: number
  }
}

interface LogEntry {
  nivel: 'debug' | 'info' | 'warn' | 'error'
  mensaje: string
  timestamp: Date
  contexto: any
  datos?: any
  errores?: any[]
}

interface EnhancedImportacionStatusProps {
  trabajoId: string
  onRefresh?: () => void
  onCancel?: () => void
  onDownloadErrors?: () => void
  onResolveErrors?: () => void
  className?: string
}

export default function EnhancedImportacionStatus({
  trabajoId,
  onRefresh,
  onCancel,
  onDownloadErrors,
  onResolveErrors,
  className = ''
}: EnhancedImportacionStatusProps) {
  const [progreso, setProgreso] = useState<ProgressSummary | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'procesando':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'procesando':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const loadProgress = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener progreso detallado
      const response = await fetch(`/api/importacion/trabajos/${trabajoId}/progreso-detallado`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Error al obtener progreso')
      }

      const data = await response.json()
      setProgreso(data.progreso)

      // Obtener logs detallados
      const logsResponse = await fetch(`/api/importacion/trabajos/${trabajoId}/logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setLogs(logsData.logs || [])
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolveErrors = async () => {
    try {
      const response = await fetch(`/api/importacion/trabajos/${trabajoId}/resolver-errores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          autoCorregir: true,
          usarValoresPorDefecto: true,
          nivelConfianzaMinimo: 70,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Errores resueltos:', result)
        await loadProgress() // Recargar progreso
        onResolveErrors?.()
      }
    } catch (err) {
      console.error('Error resolviendo errores:', err)
    }
  }

  useEffect(() => {
    loadProgress()

    // Polling cada 2 segundos si está procesando
    const interval = setInterval(() => {
      if (progreso?.estado === 'procesando') {
        loadProgress()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [trabajoId])

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Cargando información del trabajo...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span>Error: {error}</span>
          </div>
          <Button onClick={loadProgress} className="mt-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!progreso) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No se encontró información del trabajo
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Estado Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(progreso.estado)}
              <div>
                <CardTitle className="text-lg">
                  Importación de {progreso.tipoImportacion}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Trabajo: {trabajoId}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(progreso.estado)}>
              {progreso.estado.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progreso General */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso General</span>
              <span>{progreso.progresoGeneral}%</span>
            </div>
            <Progress value={progreso.progresoGeneral} className="h-2" />
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {progreso.totalRegistros}
              </div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {progreso.registrosExitosos}
              </div>
              <div className="text-xs text-gray-600">Exitosos</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {progreso.registrosConError}
              </div>
              <div className="text-xs text-gray-600">Con Error</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {progreso.registrosProcesados}
              </div>
              <div className="text-xs text-gray-600">Procesados</div>
            </div>
          </div>

          {/* Tiempo */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-1">
              <Timer className="w-4 h-4" />
              <span>Tiempo transcurrido: {formatTime(progreso.tiempoTranscurrido)}</span>
            </div>
            {progreso.tiempoEstimado > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Tiempo estimado: {formatTime(progreso.tiempoEstimado)}</span>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadProgress} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            {progreso.registrosConError > 0 && (
              <Button onClick={handleResolveErrors} variant="outline" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Resolver Errores
              </Button>
            )}
            {onDownloadErrors && progreso.registrosConError > 0 && (
              <Button onClick={onDownloadErrors} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Descargar Errores
              </Button>
            )}
            <Button 
              onClick={() => setShowAdvancedInfo(!showAdvancedInfo)} 
              variant="outline" 
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdvancedInfo ? 'Ocultar' : 'Mostrar'} Detalles
            </Button>
            <Button 
              onClick={() => setShowLogs(!showLogs)} 
              variant="outline" 
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              {showLogs ? 'Ocultar' : 'Mostrar'} Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información Avanzada */}
      {showAdvancedInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Métricas y Rendimiento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Velocidad</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {progreso.metricas.velocidadProcesamiento.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600">registros/min</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <HardDrive className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Eficiencia</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {progreso.metricas.eficiencia.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">tasa de éxito</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="font-medium">Errores</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {progreso.metricas.erroresPorMinuto.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600">por minuto</div>
              </div>
            </div>

            {/* Etapas */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Etapas del Proceso</h4>
              <div className="space-y-2">
                {progreso.etapas.map((etapa) => (
                  <div key={etapa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {etapa.estado === 'completado' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {etapa.estado === 'procesando' && <Clock className="w-4 h-4 text-blue-500 animate-spin" />}
                      {etapa.estado === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                      {etapa.estado === 'pendiente' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      <span className="font-medium">{etapa.nombre}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{etapa.progreso}%</span>
                      <Badge variant={etapa.estado === 'completado' ? 'default' : 'secondary'}>
                        {etapa.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas */}
            {progreso.alertas.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span>Alertas</span>
                </h4>
                <div className="space-y-2">
                  {progreso.alertas.map((alerta, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">{alerta}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Logs del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {logs.map((log, index) => (
                <div key={index} className={`p-3 rounded-lg text-sm ${
                  log.nivel === 'error' ? 'bg-red-50 border border-red-200' :
                  log.nivel === 'warn' ? 'bg-yellow-50 border border-yellow-200' :
                  log.nivel === 'info' ? 'bg-blue-50 border border-blue-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium ${
                      log.nivel === 'error' ? 'text-red-700' :
                      log.nivel === 'warn' ? 'text-yellow-700' :
                      log.nivel === 'info' ? 'text-blue-700' :
                      'text-gray-700'
                    }`}>
                      {log.nivel.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-800">{log.mensaje}</p>
                  {log.datos && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-600">
                        Ver datos adicionales
                      </summary>
                      <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(log.datos, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 