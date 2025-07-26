'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock, 
  FileText, 
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  Package,
  ShoppingCart,
  Activity
} from 'lucide-react'
import { ValidationErrors, ValidationError } from './ValidationErrors'

// Tipos reutilizables
interface ImportacionResponseProps {
  isImporting: boolean
  currentTrabajo: any
  error: string | null
  success: string | null
  validationErrors: ValidationError[] | null
  onClearError: () => void
  onClearSuccess: () => void
  onClearValidationErrors: () => void
  onRefresh?: () => void
}

// Configuración de tipos reutilizable
const TIPO_CONFIG = {
  productos: {
    title: 'Productos',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  proveedores: {
    title: 'Proveedores',
    icon: ShoppingCart,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  movimientos: {
    title: 'Movimientos',
    icon: Activity,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
} as const

// Configuración de estados reutilizable
const ESTADO_CONFIG = {
  completado: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    text: 'Completado exitosamente'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    text: 'Error en la importación'
  },
  procesando: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    text: 'Procesando...'
  },
  pendiente: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    text: 'Pendiente'
  },
  cancelado: {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    text: 'Cancelado'
  }
} as const

// Componente reutilizable para mensajes de alerta
const AlertMessage: React.FC<{
  type: 'error' | 'success'
  title: string
  message: string
  onClear: () => void
}> = React.memo(({ type, title, message, onClear }) => {
  const config = {
    error: {
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
      messageColor: 'text-red-700',
      buttonColor: 'text-red-600 hover:text-red-800'
    },
    success: {
      borderColor: 'border-green-200',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
      messageColor: 'text-green-700',
      buttonColor: 'text-green-600 hover:text-green-800'
    }
  }[type]

  const Icon = type === 'error' ? XCircle : CheckCircle

  return (
    <Card className={`${config.borderColor} ${config.bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Icon className={`w-5 h-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <h4 className={`font-medium ${config.textColor} mb-1`}>{title}</h4>
              <p className={`${config.messageColor} text-sm`}>{message}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear} 
            className={config.buttonColor}
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

// Componente reutilizable para la barra de progreso
const ProgressBar: React.FC<{ progress: number }> = React.memo(({ progress }) => (
  <div className="space-y-2 mb-3">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">Progreso</span>
      <span className="font-medium">{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div 
        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
))

// Componente reutilizable para estadísticas
const Statistics: React.FC<{ trabajo: any }> = React.memo(({ trabajo }) => (
  <div className="grid grid-cols-2 gap-4 text-sm">
    <div className="flex items-center justify-between p-2 bg-white rounded-lg">
      <span className="text-gray-600">Total registros:</span>
      <span className="font-medium">{trabajo.totalRegistros}</span>
    </div>
    <div className="flex items-center justify-between p-2 bg-white rounded-lg">
      <span className="text-gray-600">Procesados:</span>
      <span className="font-medium">{trabajo.registrosProcesados}</span>
    </div>
    <div className="flex items-center justify-between p-2 bg-white rounded-lg">
      <span className="text-gray-600">Exitosos:</span>
      <span className="font-medium text-green-600">{trabajo.registrosExitosos}</span>
    </div>
    <div className="flex items-center justify-between p-2 bg-white rounded-lg">
      <span className="text-gray-600">Con errores:</span>
      <span className="font-medium text-red-600">{trabajo.registrosConError}</span>
    </div>
  </div>
))

export default function ImportacionResponse({
  isImporting,
  currentTrabajo,
  error,
  success,
  validationErrors,
  onClearError,
  onClearSuccess,
  onClearValidationErrors,
  onRefresh
}: ImportacionResponseProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClearSuccess()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, onClearSuccess])

  // Memoizar configuraciones
  const config = useMemo(() => 
    currentTrabajo ? TIPO_CONFIG[currentTrabajo.tipo as keyof typeof TIPO_CONFIG] : null, 
    [currentTrabajo?.tipo]
  )

  const estadoInfo = useMemo(() => 
    currentTrabajo ? ESTADO_CONFIG[currentTrabajo.estado as keyof typeof ESTADO_CONFIG] : null,
    [currentTrabajo?.estado]
  )

  const IconComponent = config?.icon || FileText
  const EstadoIcon = estadoInfo?.icon || AlertTriangle

  // Early return si no hay contenido para mostrar
  if (!isImporting && !error && !success && !currentTrabajo && !validationErrors) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <AlertMessage
          type="error"
          title="Error en la importación"
          message={error}
          onClear={onClearError}
        />
      )}

      {/* Validation Errors */}
      {validationErrors && validationErrors.length > 0 && (
        <ValidationErrors 
          errors={validationErrors} 
          totalRegistros={currentTrabajo?.totalRegistros || 0}
        />
      )}

      {/* Success Message */}
      {success && (
        <AlertMessage
          type="success"
          title="¡Importación exitosa!"
          message={success}
          onClear={onClearSuccess}
        />
      )}

      {/* Current Job Status */}
      {currentTrabajo && (
        <Card className={`border ${estadoInfo?.borderColor} ${estadoInfo?.bgColor}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config?.bgColor}`}>
                  <IconComponent className={`w-5 h-5 ${config?.color}`} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    Importando {config?.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {currentTrabajo.archivoOriginal}
                  </p>
                </div>
              </div>
              <Badge className={`${estadoInfo?.color} ${estadoInfo?.bgColor} border-0`}>
                <EstadoIcon className={`w-3 h-3 mr-1 ${estadoInfo?.color}`} />
                {estadoInfo?.text}
              </Badge>
            </div>

            {/* Progress Bar */}
            {(currentTrabajo.estado === 'procesando' || currentTrabajo.estado === 'pendiente') && (
              <ProgressBar progress={currentTrabajo.progreso} />
            )}

            {/* Statistics */}
            <Statistics trabajo={currentTrabajo} />

            {/* Error Report Download */}
            {currentTrabajo.registrosConError > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      {currentTrabajo.registrosConError} registros con errores
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar errores
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex-1"
              >
                <Info className="w-4 h-4 mr-2" />
                {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
              </Button>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Details */}
            {showDetails && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Detalles del trabajo:</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>ID:</strong> {currentTrabajo.id}</p>
                  <p><strong>Creado:</strong> {new Date(currentTrabajo.fechaCreacion).toLocaleString()}</p>
                  <p><strong>Actualizado:</strong> {new Date(currentTrabajo.fechaActualizacion).toLocaleString()}</p>
                  {currentTrabajo.mensaje && (
                    <p><strong>Mensaje:</strong> {currentTrabajo.mensaje}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 