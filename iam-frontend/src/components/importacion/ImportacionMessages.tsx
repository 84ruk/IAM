'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Package,
  TrendingUp
} from 'lucide-react'

// Usar interfaces compatibles con el sistema existente
interface MensajeUsuario {
  tipo: 'success' | 'warning' | 'error' | 'info'
  titulo: string
  mensaje: string
  detalles?: string[]
  timestamp?: string
}

interface ResumenProcesamiento {
  duplicadosEncontrados: number
  erroresValidacion: number
  erroresSistema: number
  registrosOmitidos: number
  recomendaciones: string[]
}

interface ImportacionMessagesProps {
  mensajes?: MensajeUsuario[]
  resumen?: ResumenProcesamiento
  onDownloadErrors?: () => void
  onRetry?: () => void
  className?: string
}

const getMessageConfig = (tipo: string) => {
  switch (tipo) {
    case 'success':
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        badgeColor: 'bg-green-100 text-green-800'
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        badgeColor: 'bg-yellow-100 text-yellow-800'
      }
    case 'error':
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        badgeColor: 'bg-red-100 text-red-800'
      }
    case 'info':
      return {
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-800'
      }
    default:
      return {
        icon: Info,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        badgeColor: 'bg-gray-100 text-gray-800'
      }
  }
}

export default function ImportacionMessages({
  mensajes = [],
  resumen,
  onDownloadErrors,
  onRetry,
  className = ''
}: ImportacionMessagesProps) {
  const [expandedMessages, setExpandedMessages] = React.useState<Set<number>>(new Set())

  const toggleMessage = (index: number) => {
    const newExpanded = new Set(expandedMessages)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedMessages(newExpanded)
  }

  if (!mensajes || mensajes.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mensajes principales */}
      {mensajes.map((mensaje, index) => {
        const config = getMessageConfig(mensaje.tipo)
        const IconComponent = config.icon
        const isExpanded = expandedMessages.has(index)
        const hasDetails = mensaje.detalles && mensaje.detalles.length > 0

        return (
          <Card key={index} className={`${config.bgColor} ${config.borderColor} border`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{mensaje.titulo}</h4>
                      <Badge className={config.badgeColor}>
                        {mensaje.tipo.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{mensaje.mensaje}</p>
                    
                    {/* Detalles expandibles */}
                    {hasDetails && (
                      <div className="space-y-2">
                        <button
                          onClick={() => toggleMessage(index)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                        </button>
                        
                        {isExpanded && (
                          <div className="pl-4 border-l-2 border-gray-200 space-y-1">
                            {mensaje.detalles?.map((detalle, detailIndex) => (
                              <p key={detailIndex} className="text-xs text-gray-600">
                                • {detalle}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {mensaje.timestamp && (
                  <span className="text-xs text-gray-500">
                    {new Date(mensaje.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Resumen de procesamiento */}
      {resumen && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Resumen del Procesamiento
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-medium">Duplicados</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {resumen.duplicadosEncontrados}
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Errores Validación</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {resumen.erroresValidacion}
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Errores Sistema</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {resumen.erroresSistema}
                </div>
              </div>

              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-medium">Omitidos</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {resumen.registrosOmitidos}
                </div>
              </div>
            </div>

            {/* Recomendaciones */}
            {resumen.recomendaciones && resumen.recomendaciones.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Recomendaciones
                </h5>
                <div className="space-y-1">
                  {resumen.recomendaciones.map((recomendacion, index) => (
                    <p key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {recomendacion}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        {onDownloadErrors && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadErrors}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar Errores
          </Button>
        )}
        
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
} 