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
  AlertCircle,
  Users,
  Package,
  TrendingUp
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
  errores?: string[] | ErrorImportacion[]
  opciones?: any
  fechaCreacion: string
  progreso: number
  estado: string
  mensaje?: string
}

interface ErrorImportacion {
  fila: number
  columna: string
  valor: string
  mensaje: string
  tipo: 'validacion' | 'duplicado' | 'referencia' | 'sistema'
}

interface ImportacionStatusProps {
  trabajo: TrabajoImportacion | null
  onRefresh?: () => void
  onCancel?: () => void
  onDownloadErrors?: () => void
  className?: string
}

export default function ImportacionStatus({
  trabajo,
  onRefresh,
  onCancel,
  onDownloadErrors,
  className = ''
}: ImportacionStatusProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  if (!trabajo) {
    return null
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        // Si está completado pero tiene errores, mostrar icono de advertencia
        if (trabajo.registrosConError > 0 && trabajo.registrosExitosos === 0) {
          return <XCircle className="w-5 h-5 text-red-500" />
        } else if (trabajo.registrosConError > 0) {
          return <AlertTriangle className="w-5 h-5 text-yellow-500" />
        }
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
        // Si está completado pero tiene errores, mostrar color de advertencia
        if (trabajo.registrosConError > 0 && trabajo.registrosExitosos === 0) {
          return 'bg-red-100 text-red-800 border-red-200'
        } else if (trabajo.registrosConError > 0) {
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'procesando':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getErrorTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'duplicado':
        return <Users className="w-4 h-4 text-orange-500" />
      case 'validacion':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'referencia':
        return <Package className="w-4 h-4 text-purple-500" />
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getErrorTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'duplicado':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'validacion':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'referencia':
        return 'bg-purple-50 border-purple-200 text-purple-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getErrorTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'duplicado':
        return 'Duplicado'
      case 'validacion':
        return 'Validación'
      case 'referencia':
        return 'Referencia'
      default:
        return 'Sistema'
    }
  }

  // Convertir errores a formato estándar si son strings
  const erroresNormalizados: ErrorImportacion[] = (trabajo.errores || []).map((error, index) => {
    if (typeof error === 'string') {
      return {
        fila: index + 1,
        columna: 'general',
        valor: '',
        mensaje: error,
        tipo: 'sistema' as const
      }
    }
    return error as ErrorImportacion
  })

  const erroresPorTipo = erroresNormalizados.reduce((acc, error) => {
    acc[error.tipo] = (acc[error.tipo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const erroresDuplicados = erroresNormalizados.filter(e => e.tipo === 'duplicado')
  const erroresValidacion = erroresNormalizados.filter(e => e.tipo === 'validacion')
  const erroresSistema = erroresNormalizados.filter(e => e.tipo === 'sistema')

  const getResumenMensaje = () => {
    if (trabajo.estado === 'completado') {
      if (trabajo.registrosExitosos === trabajo.totalRegistros) {
        return `✅ Importación completada exitosamente: ${trabajo.registrosExitosos} registros procesados`
      } else if (trabajo.registrosExitosos > 0) {
        return `⚠️ Importación completada parcialmente: ${trabajo.registrosExitosos} exitosos, ${trabajo.registrosConError} con errores`
      } else {
        return `❌ Importación completada sin éxito: ${trabajo.registrosConError} errores encontrados`
      }
    } else if (trabajo.estado === 'procesando') {
      return `🔄 Procesando: ${trabajo.registrosProcesados}/${trabajo.totalRegistros} registros`
    } else {
      return `⏸️ Estado: ${trabajo.estado}`
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Estado Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(trabajo.estado)}
              <div>
                <CardTitle className="text-lg">
                  Importación de {trabajo.tipo}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Trabajo: {trabajo.id}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(trabajo.estado)}>
              {trabajo.estado.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mensaje de Resumen */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">{getResumenMensaje()}</p>
          </div>

          {/* Progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso</span>
              <span>{trabajo.progreso.toFixed(1)}%</span>
            </div>
            <Progress value={trabajo.progreso} className="h-2" />
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {trabajo.totalRegistros}
              </div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {trabajo.registrosExitosos}
              </div>
              <div className="text-xs text-gray-600">Exitosos</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {trabajo.registrosConError}
              </div>
              <div className="text-xs text-gray-600">Con Error</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {trabajo.registrosProcesados}
              </div>
              <div className="text-xs text-gray-600">Procesados</div>
            </div>
          </div>

          {/* Desglose de Errores por Tipo */}
          {erroresNormalizados.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Desglose de Errores</h4>
                <Button 
                  onClick={() => setShowDetails(!showDetails)} 
                  variant="outline" 
                  size="sm"
                >
                  <Info className="w-4 h-4 mr-2" />
                  {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {Object.entries(erroresPorTipo).map(([tipo, cantidad]) => (
                  <div key={tipo} className={`p-2 rounded-lg border ${getErrorTypeColor(tipo)}`}>
                    <div className="flex items-center space-x-2">
                      {getErrorTypeIcon(tipo)}
                      <span className="text-sm font-medium">{getErrorTypeLabel(tipo)}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {cantidad}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errores Detallados */}
          {showDetails && erroresNormalizados.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-3">Errores Detallados</h4>
                             <div className="max-h-64 overflow-y-auto space-y-2">
                 {erroresNormalizados.map((error, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getErrorTypeColor(error.tipo)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 mb-1">
                        {getErrorTypeIcon(error.tipo)}
                        <Badge variant="outline" className="text-xs">
                          Fila {error.fila}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {error.columna}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getErrorTypeLabel(error.tipo)}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{error.mensaje}</p>
                    {error.valor && (
                      <p className="text-xs text-gray-600">
                        Valor: <code className="bg-gray-100 px-1 rounded">{error.valor}</code>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sugerencias */}
          {erroresNormalizados.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-800 mb-1">Sugerencias para resolver errores:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {erroresDuplicados.length > 0 && (
                      <li>• <strong>Duplicados ({erroresDuplicados.length})</strong>: Habilitar "Sobrescribir existentes" o cambiar códigos únicos</li>
                    )}
                    {erroresValidacion.length > 0 && (
                      <li>• <strong>Validación ({erroresValidacion.length})</strong>: Verificar formato y datos requeridos</li>
                    )}
                    {erroresSistema.length > 0 && (
                      <li>• <strong>Sistema ({erroresSistema.length})</strong>: Contactar soporte técnico</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2">
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            )}
            {onCancel && trabajo.estado === 'procesando' && (
              <Button onClick={onCancel} variant="outline" size="sm">
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
                         {onDownloadErrors && erroresNormalizados.length > 0 && (
              <Button onClick={onDownloadErrors} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Descargar Errores
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 