'use client'

import React from 'react'
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
  RefreshCw
} from 'lucide-react'
import { TrabajoImportacion } from '@/lib/api/importacion'

interface ImportacionStatusProps {
  trabajo: TrabajoImportacion | null
  isImporting: boolean
  onCancel?: () => void
  onRefresh?: () => void
  onDownloadErrors?: () => void
  className?: string
}

const estadoConfig = {
  pendiente: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: 'Pendiente',
    description: 'El trabajo está en cola esperando procesamiento'
  },
  procesando: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Procesando',
    description: 'Procesando registros...'
  },
  completado: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    title: 'Completado',
    description: 'Importación finalizada exitosamente'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'Error',
    description: 'Ocurrió un error durante la importación'
  },
  cancelado: {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'Cancelado',
    description: 'El trabajo fue cancelado'
  }
}

export const ImportacionStatus: React.FC<ImportacionStatusProps> = React.memo(({
  trabajo,
  isImporting,
  onCancel,
  onRefresh,
  onDownloadErrors,
  className = ''
}) => {
  if (!trabajo) return null

  const config = estadoConfig[trabajo.estado] || estadoConfig.pendiente
  const IconComponent = config.icon

  const progreso = trabajo.totalRegistros > 0 
    ? Math.round((trabajo.registrosProcesados / trabajo.totalRegistros) * 100)
    : 0

  const tieneErrores = trabajo.registrosConError > 0

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <IconComponent className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <CardTitle className={`text-lg ${config.color}`}>
                {config.title}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {config.description}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={config.color}>
            {trabajo.estado.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información del trabajo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{trabajo.totalRegistros}</div>
            <div className="text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{trabajo.registrosProcesados}</div>
            <div className="text-gray-600">Procesados</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{trabajo.registrosExitosos}</div>
            <div className="text-gray-600">Exitosos</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600">{trabajo.registrosConError}</div>
            <div className="text-gray-600">Errores</div>
          </div>
        </div>

        {/* Barra de progreso */}
        {(trabajo.estado === 'procesando' || trabajo.estado === 'pendiente') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progreso</span>
              <span className="font-medium">{progreso}%</span>
            </div>
            <Progress value={progreso} className="h-2" />
          </div>
        )}

        {/* Mensaje de estado */}
        {trabajo.mensaje && (
          <div className={`p-3 rounded-lg ${
            trabajo.estado === 'error' ? 'bg-red-100 text-red-800' :
            trabajo.estado === 'completado' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{trabajo.mensaje}</span>
            </div>
          </div>
        )}

        {/* Errores específicos */}
        {trabajo.errores && trabajo.errores.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-medium text-red-800">Errores encontrados</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              {trabajo.errores.slice(0, 3).map((error, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-red-600">•</span>
                  <span>{error}</span>
                </div>
              ))}
              {trabajo.errores.length > 3 && (
                <div className="text-red-600 text-xs">
                  ... y {trabajo.errores.length - 3} errores más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isImporting}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isImporting ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            )}
            
            {tieneErrores && onDownloadErrors && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadErrors}
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar errores
              </Button>
            )}
          </div>

          {onCancel && (trabajo.estado === 'pendiente' || trabajo.estado === 'procesando') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onCancel}
              disabled={isImporting}
            >
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ImportacionStatus.displayName = 'ImportacionStatus' 