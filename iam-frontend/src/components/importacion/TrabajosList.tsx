'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  Download,
  X,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  FileText,
  Trash2,
  Package,
  ShoppingCart,
  Activity
} from 'lucide-react'
import { TrabajoImportacion } from '@/lib/api/importacion'
import ProgressBar from './ProgressBar'

interface TrabajosListProps {
  trabajos: TrabajoImportacion[]
  showProgress?: boolean
  showActions?: boolean
}

const tipoConfig = {
  productos: {
    title: 'Productos',
    icon: Package,
    color: 'bg-blue-500'
  },
  proveedores: {
    title: 'Proveedores',
    icon: ShoppingCart,
    color: 'bg-orange-500'
  },
  movimientos: {
    title: 'Movimientos',
    icon: Activity,
    color: 'bg-purple-500'
  },
  auto: {
    title: 'Automático',
    icon: FileText,
    color: 'bg-green-500'
  }
}

export default function TrabajosList({ trabajos, showProgress = false, showActions = true }: TrabajosListProps) {
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'procesando':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case 'pendiente':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'cancelado':
        return <X className="w-4 h-4 text-gray-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'procesando':
        return 'bg-blue-100 text-blue-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelado':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'Completado'
      case 'error':
        return 'Error'
      case 'procesando':
        return 'En Proceso'
      case 'pendiente':
        return 'Pendiente'
      case 'cancelado':
        return 'Cancelado'
      default:
        return estado
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCancelarTrabajo = async (trabajoId: string) => {
    // Implementar cancelación de trabajo
    console.log('Cancelar trabajo:', trabajoId)
  }

  const handleDescargarErrores = async (trabajoId: string) => {
    // Implementar descarga de errores
    console.log('Descargar errores:', trabajoId)
  }

  if (trabajos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No hay trabajos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trabajos.map((trabajo) => {
        const tipo = tipoConfig[trabajo.tipo as keyof typeof tipoConfig] || tipoConfig.auto
        const IconComponent = tipo.icon

        return (
          <div
            key={trabajo.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {/* Icono del tipo */}
              <div className={`p-2 rounded-lg ${tipo.color}`}>
                <IconComponent className="w-4 h-4 text-white" />
              </div>

              {/* Información del trabajo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {trabajo.archivoOriginal}
                  </h4>
                  <Badge className={getEstadoColor(trabajo.estado)}>
                    {getEstadoIcon(trabajo.estado)}
                    <span className="ml-1">{getEstadoText(trabajo.estado)}</span>
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{tipo.title}</span>
                  <span>•</span>
                  <span>{formatDate(trabajo.fechaCreacion)}</span>
                  {trabajo.fechaActualizacion && trabajo.fechaActualizacion !== trabajo.fechaCreacion && (
                    <>
                      <span>•</span>
                      <span>Actualizado: {formatDate(trabajo.fechaActualizacion)}</span>
                    </>
                  )}
                </div>

                {/* Progreso */}
                {showProgress && (trabajo.estado === 'procesando' || trabajo.estado === 'pendiente') && (
                  <div className="mt-2">
                    <ProgressBar 
                      progreso={trabajo.progreso || 0}
                      estado={trabajo.estado}
                    />
                  </div>
                )}

                {/* Estadísticas */}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Total: {trabajo.totalRegistros}</span>
                  <span>Procesados: {trabajo.registrosProcesados}</span>
                  <span>Exitosos: {trabajo.registrosExitosos}</span>
                  {trabajo.registrosConError > 0 && (
                    <span>Errores: {trabajo.registrosConError}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones */}
            {showActions && (
              <div className="flex items-center gap-2">
                {trabajo.estado === 'procesando' || trabajo.estado === 'pendiente' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelarTrabajo(trabajo.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                ) : trabajo.estado === 'error' && trabajo.registrosConError ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDescargarErrores(trabajo.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
} 