'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeft,
  Download,
  X,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  FileText,
  Trash2
} from 'lucide-react'
import { useImportacionSafe } from '@/hooks/useImportacionSafe'
import { TrabajoImportacion } from '@/lib/api/importacion'

interface TrabajosListProps {
  trabajos: TrabajoImportacion[]
  onClose: () => void
}

const tipoConfig = {
  productos: {
    title: 'Productos',
    icon: '📦',
    color: 'bg-blue-500'
  },
  proveedores: {
    title: 'Proveedores',
    icon: '🏢',
    color: 'bg-orange-500'
  },
  movimientos: {
    title: 'Movimientos',
    icon: '📊',
    color: 'bg-purple-500'
  }
}

export default function TrabajosList({ trabajos, onClose }: TrabajosListProps) {
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState<TrabajoImportacion | null>(null)
  const { cancelarTrabajo, descargarReporteErrores } = useImportacionSafe()

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
        return 'Procesando'
      case 'pendiente':
        return 'Pendiente'
      case 'cancelado':
        return 'Cancelado'
      default:
        return estado
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCancelarTrabajo = async (trabajoId: string) => {
    if (confirm('¿Estás seguro de que quieres cancelar este trabajo?')) {
      await cancelarTrabajo(trabajoId)
    }
  }

  const handleDescargarErrores = async (trabajoId: string) => {
    await descargarReporteErrores(trabajoId)
  }

  if (trabajoSeleccionado) {
    const config = tipoConfig[trabajoSeleccionado.tipo]
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTrabajoSeleccionado(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xl">{config.icon}</span>
                <div>
                  <CardTitle className="text-lg">Detalles del trabajo</CardTitle>
                  <p className="text-sm text-gray-600">{config.title}</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Archivo</p>
                <p className="text-sm text-gray-900">{trabajoSeleccionado.archivoOriginal}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Estado</p>
                <div className="flex items-center gap-2">
                  {getEstadoIcon(trabajoSeleccionado.estado)}
                  <Badge className={getEstadoColor(trabajoSeleccionado.estado)}>
                    {getEstadoText(trabajoSeleccionado.estado)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Fecha de creación</p>
                <p className="text-sm text-gray-900">{formatDate(trabajoSeleccionado.fechaCreacion)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Última actualización</p>
                <p className="text-sm text-gray-900">{formatDate(trabajoSeleccionado.fechaActualizacion)}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Progreso</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progreso general:</span>
                  <span>{trabajoSeleccionado.progreso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${trabajoSeleccionado.progreso}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total registros</p>
                    <p className="font-medium">{trabajoSeleccionado.totalRegistros}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Procesados</p>
                    <p className="font-medium">{trabajoSeleccionado.registrosProcesados}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Exitosos</p>
                    <p className="font-medium text-green-600">{trabajoSeleccionado.registrosExitosos}</p>
                  </div>
                </div>
                {trabajoSeleccionado.registrosConError > 0 && (
                  <div>
                    <p className="text-gray-600 text-sm">Con errores</p>
                    <p className="font-medium text-red-600">{trabajoSeleccionado.registrosConError}</p>
                  </div>
                )}
              </div>
            </div>

            {trabajoSeleccionado.mensaje && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">{trabajoSeleccionado.mensaje}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              {(trabajoSeleccionado.estado === 'pendiente' || trabajoSeleccionado.estado === 'procesando') && (
                <Button
                  variant="outline"
                  onClick={() => handleCancelarTrabajo(trabajoSeleccionado.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar trabajo
                </Button>
              )}
              
              {trabajoSeleccionado.estado === 'error' && trabajoSeleccionado.registrosConError > 0 && (
                <Button
                  variant="outline"
                  onClick={() => handleDescargarErrores(trabajoSeleccionado.id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar errores
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Trabajos de importación
              </CardTitle>
              <p className="text-sm text-gray-600">
                {trabajos.length} trabajo(s) encontrado(s)
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {trabajos.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No hay trabajos de importación</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trabajos.map((trabajo) => {
              const config = tipoConfig[trabajo.tipo]
              
              return (
                <div
                  key={trabajo.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => setTrabajoSeleccionado(trabajo)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color} text-white`}>
                        <span className="text-lg">{config.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{config.title}</p>
                          {getEstadoIcon(trabajo.estado)}
                          <Badge className={getEstadoColor(trabajo.estado)}>
                            {getEstadoText(trabajo.estado)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{trabajo.archivoOriginal}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(trabajo.fechaCreacion)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {trabajo.registrosExitosos}/{trabajo.totalRegistros}
                      </div>
                      <div className="text-xs text-gray-500">
                        {trabajo.progreso}% completado
                      </div>
                    </div>
                  </div>
                  
                  {(trabajo.estado === 'pendiente' || trabajo.estado === 'procesando') && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${trabajo.progreso}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 