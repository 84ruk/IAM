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
  TrendingUp,
  Loader2
} from 'lucide-react'

import ImportacionMessages from './ImportacionMessages'

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

  // Extraer mensajes de usuario y resumen del trabajo de forma segura
  const mensajesUsuario = (trabajo as any).mensajesUsuario || []
  const resumenProcesamiento = (trabajo as any).resumenProcesamiento

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'procesando':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'pendiente':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
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
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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
      if (trabajo.registrosExitosos > 0) {
        return `Importación completada: ${trabajo.registrosExitosos} registros procesados exitosamente`
      } else {
        return 'Importación completada sin registros procesados'
      }
    } else if (trabajo.estado === 'error') {
      return `Error en la importación: ${trabajo.registrosConError} errores encontrados`
    } else if (trabajo.estado === 'procesando') {
      return `Procesando: ${trabajo.registrosProcesados} de ${trabajo.totalRegistros} registros`
    } else {
      return 'Importación pendiente'
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
              <div className="text-xs text-gray-600">Errores</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {trabajo.registrosProcesados}
              </div>
              <div className="text-xs text-gray-600">Procesados</div>
            </div>
          </div>

          {/* Mensajes de Usuario - Solo mostrar si existen */}
          {mensajesUsuario && mensajesUsuario.length > 0 && (
            <div className="mb-4">
              <ImportacionMessages
                mensajes={mensajesUsuario}
                resumen={resumenProcesamiento}
                onDownloadErrors={onDownloadErrors}
                onRetry={onRefresh}
              />
            </div>
          )}

          {/* Información del Archivo */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Archivo</span>
            </div>
            <p className="text-sm text-gray-600 break-all">
              {trabajo.archivoOriginal}
            </p>
          </div>

          {/* Errores Detallados - Solo mostrar si existen */}
          {trabajo.errores && trabajo.errores.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">Errores Detallados</h4>
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showErrors ? 'Ocultar' : 'Mostrar'} ({trabajo.errores.length})
                </button>
              </div>
              
              {showErrors && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {trabajo.errores.map((error, index) => {
                    // Verificar si el error es un string o un objeto ErrorImportacion
                    if (typeof error === 'string') {
                      return (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800">
                                Error del sistema
                              </p>
                              <p className="text-sm text-red-600">{error}</p>
                            </div>
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              sistema
                            </Badge>
                          </div>
                        </div>
                      )
                    } else {
                      // Es un objeto ErrorImportacion
                      return (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800">
                                Fila {error.fila} - {error.columna}
                              </p>
                              <p className="text-sm text-red-600">{error.mensaje}</p>
                              {error.valor && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Valor: {error.valor}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              {error.tipo}
                            </Badge>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
            )}
            
            {onCancel && trabajo.estado === 'procesando' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="flex items-center gap-2 text-red-600 hover:text-red-800"
              >
                <XCircle className="w-4 h-4" />
                Cancelar
              </Button>
            )}
            
            {onDownloadErrors && trabajo.registrosConError > 0 && (
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 