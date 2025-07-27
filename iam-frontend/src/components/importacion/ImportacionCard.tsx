'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Upload, 
  Download, 
  FileText, 
  Package, 
  ShoppingCart, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { useImportacionSafe } from '@/hooks/useImportacionSafe'
import { TipoImportacion } from '@/hooks/useImportacion'
import ImportacionForm from './ImportacionForm'
import TrabajosList from './TrabajosList'
import ImportacionResponse from './ImportacionResponse'

interface ImportacionCardProps {
  className?: string
}

const tipoConfig = {
  productos: {
    title: 'Productos',
    description: 'Importa tu catálogo de productos desde Excel, Numbers o CSV',
    icon: Package,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  proveedores: {
    title: 'Proveedores',
    description: 'Importa tu lista de proveedores desde Excel, Numbers o CSV',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  movimientos: {
    title: 'Movimientos',
    description: 'Importa movimientos de inventario desde Excel, Numbers o CSV',
    icon: Activity,
    color: 'bg-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  auto: {
    title: 'Importación Automática',
    description: 'Detecta automáticamente el tipo de datos desde Excel, Numbers o CSV',
    icon: FileText,
    color: 'bg-green-500',
    badgeColor: 'bg-green-100 text-green-800'
  }
}

export default function ImportacionCard({ className }: ImportacionCardProps) {
  const [selectedTipo, setSelectedTipo] = useState<TipoImportacion | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showTrabajos, setShowTrabajos] = useState(false)
  
  const {
    isImporting,
    currentTrabajo,
    trabajos,
    error,
    success,
    validationErrors,
    descargarPlantilla,
    clearError,
    clearSuccess,
    clearValidationErrors
  } = useImportacionSafe()

  const handleTipoSelect = (tipo: TipoImportacion) => {
    setSelectedTipo(tipo)
    setShowForm(true)
    setShowTrabajos(false)
  }

  const handleDescargarPlantilla = async (tipo: TipoImportacion) => {
    await descargarPlantilla(tipo)
  }

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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const trabajosRecientes = trabajos.slice(0, 3)
  const trabajosActivos = trabajos.filter(t => t.estado === 'pendiente' || t.estado === 'procesando')

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Importación de Datos
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Importa productos, proveedores y movimientos desde archivos Excel, Numbers o CSV
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTrabajos(!showTrabajos)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Trabajos ({trabajos.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* ImportacionResponse Component */}
          <ImportacionResponse
            isImporting={isImporting}
            currentTrabajo={currentTrabajo}
            error={error}
            success={success}
            validationErrors={validationErrors}
            onClearError={clearError}
            onClearSuccess={clearSuccess}
            onClearValidationErrors={clearValidationErrors}
            onRefresh={() => {
              // Refresh logic can be added here
            }}
          />

          {showTrabajos ? (
            <TrabajosList 
              trabajos={trabajos}
              onClose={() => setShowTrabajos(false)}
            />
          ) : showForm && selectedTipo ? (
            <ImportacionForm
              tipo={selectedTipo}
              onClose={() => {
                setShowForm(false)
                setSelectedTipo(null)
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(tipoConfig) as TipoImportacion[]).map((tipo) => {
                  const config = tipoConfig[tipo]
                  const Icon = config.icon
                  
                  return (
                    <div
                      key={tipo}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                      onClick={() => handleTipoSelect(tipo)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${config.color} text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{config.title}</h3>
                          <p className="text-sm text-gray-600">{config.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTipoSelect(tipo)
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Importar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDescargarPlantilla(tipo)
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {trabajosRecientes.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Trabajos Recientes</h4>
                  <div className="space-y-2">
                    {trabajosRecientes.map((trabajo) => (
                      <div
                        key={trabajo.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getEstadoIcon(trabajo.estado)}
                          <div>
                            <p className="font-medium text-sm">
                              {tipoConfig[trabajo.tipo].title}
                            </p>
                            <p className="text-xs text-gray-600">
                              {trabajo.archivoOriginal}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getEstadoColor(trabajo.estado)}>
                            {trabajo.estado}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(trabajo.fechaCreacion).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trabajosActivos.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">
                      {trabajosActivos.length} trabajo(s) en proceso
                    </span>
                  </div>
                  <p className="text-sm text-yellow-800">
                    Tienes importaciones ejecutándose en segundo plano. 
                    Puedes ver el progreso en la sección de trabajos.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 