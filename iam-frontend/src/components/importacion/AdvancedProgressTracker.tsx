'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  Settings,
  Zap,
  AlertCircle,
  Info,
  TrendingUp,
  Timer,
  HardDrive,
  Cpu
} from 'lucide-react'

interface ProgressStage {
  id: string
  nombre: string
  descripcion: string
  progreso: number
  estado: 'pendiente' | 'procesando' | 'completado' | 'error'
  tiempoInicio?: string
  tiempoFin?: string
  tiempoEstimado?: number
  registrosProcesados?: number
  registrosTotal?: number
  errores?: any[]
  mensaje?: string
}

interface ProgressSummary {
  trabajoId: string
  progresoGeneral: number
  etapaActual: string
  etapas: ProgressStage[]
  tiempoTranscurrido: number
  tiempoEstimadoTotal: number
  registrosProcesados: number
  registrosTotal: number
  registrosExitosos: number
  registrosConError: number
  tasaExito: number
  velocidadProcesamiento: number
  ultimaActualizacion: string
}

interface AdvancedProgressTrackerProps {
  trabajoId: string
  onRefresh?: () => void
  onResolveErrors?: (opciones: any) => Promise<void>
  className?: string
}

const estadoConfig = {
  pendiente: {
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    text: 'Pendiente'
  },
  procesando: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    text: 'Procesando'
  },
    completado: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    text: 'Completado'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    text: 'Error'
  }
}

export default function AdvancedProgressTracker({
  trabajoId,
  onRefresh,
  onResolveErrors,
  className = ''
}: AdvancedProgressTrackerProps) {
  const [progreso, setProgreso] = useState<ProgressSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showErrorResolution, setShowErrorResolution] = useState(false)
  const [resolutionOptions, setResolutionOptions] = useState({
    autoCorregir: true,
    usarValoresPorDefecto: true,
    nivelConfianzaMinimo: 70
  })

  // Función para formatear tiempo
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

  // Función para cargar progreso
  const loadProgress = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/importacion/trabajos/${trabajoId}/progreso-detallado`)
      if (!response.ok) {
        throw new Error('Error al cargar el progreso')
      }
      
      const data = await response.json()
      setProgreso(data.progreso)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  // Función para resolver errores
  const handleResolveErrors = async () => {
    if (!onResolveErrors) return
    
    try {
      await onResolveErrors(resolutionOptions)
      setShowErrorResolution(false)
      await loadProgress() // Recargar progreso
    } catch (err) {
      console.error('Error resolviendo errores:', err)
    }
  }

  // Cargar progreso inicial y configurar polling
  useEffect(() => {
    loadProgress()
    
    const interval = setInterval(loadProgress, 2000)
    return () => clearInterval(interval)
  }, [trabajoId])

  if (isLoading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Cargando progreso...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <span>Error: {error}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadProgress}
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!progreso) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No se encontró información de progreso
          </div>
        </CardContent>
      </Card>
    )
  }

  const tiempoRestante = progreso.tiempoEstimadoTotal - progreso.tiempoTranscurrido
  const etapaActual = progreso.etapas.find(e => e.id === progreso.etapaActual)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con progreso general */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Progreso de Importación</CardTitle>
                <p className="text-sm text-gray-600">
                  Trabajo: {trabajoId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600">
                {progreso.progresoGeneral}%
              </Badge>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Barra de progreso general */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progreso General</span>
              <span className="font-medium">{progreso.progresoGeneral}%</span>
            </div>
            <Progress value={progreso.progresoGeneral} className="h-3" />
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Total</span>
              </div>
              <div className="font-semibold text-lg">{progreso.registrosTotal}</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-600">Procesados</span>
              </div>
              <div className="font-semibold text-lg text-blue-600">{progreso.registrosProcesados}</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-600">Exitosos</span>
              </div>
              <div className="font-semibold text-lg text-green-600">{progreso.registrosExitosos}</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-600">Errores</span>
              </div>
              <div className="font-semibold text-lg text-red-600">{progreso.registrosConError}</div>
            </div>
          </div>

          {/* Métricas de rendimiento */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Timer className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Tiempo Transcurrido</div>
                <div className="font-medium">{formatTime(progreso.tiempoTranscurrido)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Tiempo Restante</div>
                <div className="font-medium">{formatTime(Math.max(0, tiempoRestante))}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Zap className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Velocidad</div>
                <div className="font-medium">{progreso.velocidadProcesamiento.toFixed(1)} reg/s</div>
              </div>
            </div>
          </div>

          {/* Tasa de éxito */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-600">Tasa de Éxito</span>
                <span className="font-medium">{progreso.tasaExito}%</span>
              </div>
              <Progress value={progreso.tasaExito} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Etapas de progreso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Etapas del Proceso</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {progreso.etapas.map((etapa, index) => {
            const config = estadoConfig[etapa.estado]
            const IconComponent = config.icon
            
            return (
              <div key={etapa.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${config.color} ${etapa.estado === 'procesando' ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{etapa.nombre}</h4>
                      <p className="text-sm text-gray-600">{etapa.descripcion}</p>
                    </div>
                  </div>
                  <Badge className={config.color}>
                    {config.text}
                  </Badge>
                </div>

                {/* Progreso de la etapa */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-medium">{etapa.progreso}%</span>
                  </div>
                  <Progress value={etapa.progreso} className="h-2" />
                </div>

                {/* Detalles de la etapa */}
                {etapa.registrosProcesados !== undefined && (
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-600">Registros procesados:</span>
                      <span className="font-medium ml-2">{etapa.registrosProcesados}</span>
                    </div>
                    {etapa.registrosTotal && (
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium ml-2">{etapa.registrosTotal}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensaje de la etapa */}
                {etapa.mensaje && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{etapa.mensaje}</span>
                    </div>
                  </div>
                )}

                {/* Errores de la etapa */}
                {etapa.errores && etapa.errores.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium text-red-700">
                        {etapa.errores.length} error(es) encontrado(s)
                      </span>
                    </div>
                    <ul className="text-xs text-red-600 space-y-1">
                      {etapa.errores.slice(0, 3).map((error, idx) => (
                        <li key={idx}>• {error.mensaje || error}</li>
                      ))}
                      {etapa.errores.length > 3 && (
                        <li>• ... y {etapa.errores.length - 3} errores más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Panel de resolución de errores */}
      {progreso.registrosConError > 0 && onResolveErrors && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <CardTitle className="text-lg text-orange-800">
                Resolución Inteligente de Errores
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-orange-700">
              Se encontraron {progreso.registrosConError} errores. 
              Puede usar la resolución inteligente para corregirlos automáticamente.
            </p>
            
            {!showErrorResolution ? (
              <Button 
                onClick={() => setShowErrorResolution(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Resolución
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={resolutionOptions.autoCorregir}
                      onChange={(e) => setResolutionOptions(prev => ({
                        ...prev,
                        autoCorregir: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Auto-corregir formatos</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={resolutionOptions.usarValoresPorDefecto}
                      onChange={(e) => setResolutionOptions(prev => ({
                        ...prev,
                        usarValoresPorDefecto: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">Usar valores por defecto</span>
                  </label>
                  
                  <div>
                    <label className="text-sm block mb-1">Nivel de confianza mínimo</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={resolutionOptions.nivelConfianzaMinimo}
                      onChange={(e) => setResolutionOptions(prev => ({
                        ...prev,
                        nivelConfianzaMinimo: parseInt(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-600">{resolutionOptions.nivelConfianzaMinimo}%</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleResolveErrors}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Aplicar Correcciones
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setShowErrorResolution(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 