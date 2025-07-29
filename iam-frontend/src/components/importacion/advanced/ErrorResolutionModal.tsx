'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { 
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  AlertCircle,
  Info,
  FileText,
  Edit3,
  Zap,
  Shield,
  Clock
} from 'lucide-react'
import { ImportacionValidationError } from '@/lib/api/importacion'

interface ErrorResolution {
  error: ImportacionValidationError
  resuelto: boolean
  valorCorregido?: string
  sugerencia?: string
  accion: 'corregido' | 'sugerido' | 'ignorado' | 'requiere_intervencion'
  confianza: number
}

interface ErrorResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  errors: ImportacionValidationError[]
  onResolve: (resolutions: ErrorResolution[]) => Promise<void>
  tipoImportacion: 'productos' | 'proveedores' | 'movimientos'
  totalRegistros: number
  registrosConError: number
}

export default function ErrorResolutionModal({
  isOpen,
  onClose,
  errors,
  onResolve,
  tipoImportacion,
  totalRegistros,
  registrosConError
}: ErrorResolutionModalProps) {
  const [resolutions, setResolutions] = useState<ErrorResolution[]>([])
  const [isResolving, setIsResolving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedError, setSelectedError] = useState<ImportacionValidationError | null>(null)
  const [autoResolveMode, setAutoResolveMode] = useState(false)

  // Inicializar resoluciones cuando se abren los errores
  React.useEffect(() => {
    if (isOpen && errors.length > 0) {
      const initialResolutions: ErrorResolution[] = errors.map(error => ({
        error,
        resuelto: false,
        accion: 'requiere_intervencion',
        confianza: 0
      }))
      setResolutions(initialResolutions)
    }
  }, [isOpen, errors])

  // Resolución automática inteligente
  const autoResolveErrors = useCallback(() => {
    const autoResolutions = resolutions.map(resolution => {
      const { error } = resolution
      
      // Lógica de resolución automática basada en el tipo de error
      switch (error.tipo) {
        case 'formato':
          return {
            ...resolution,
            valorCorregido: getFormattedValue(error.valor, error.columna),
            sugerencia: `Formato corregido automáticamente`,
            accion: 'corregido' as const,
            confianza: 85,
            resuelto: true
          }
        
        case 'validacion':
          return {
            ...resolution,
            valorCorregido: getDefaultValue(error.columna, tipoImportacion),
            sugerencia: `Valor por defecto aplicado`,
            accion: 'sugerido' as const,
            confianza: 70,
            resuelto: true
          }
        
        case 'referencia':
          if (tipoImportacion === 'movimientos' && error.columna === 'productoNombre') {
            return {
              ...resolution,
              valorCorregido: error.valor,
              sugerencia: `Producto será creado automáticamente`,
              accion: 'corregido' as const,
              confianza: 90,
              resuelto: true
            }
          }
          return resolution
        
        default:
          return resolution
      }
    })
    
    setResolutions(autoResolutions)
  }, [resolutions, tipoImportacion])

  // Obtener valor formateado
  const getFormattedValue = (valor: string, columna: string): string => {
    const value = String(valor).trim()
    
    switch (columna.toLowerCase()) {
      case 'email':
        return value.toLowerCase()
      case 'telefono':
        return value.replace(/[^\d\s\-\(\)\+]/g, '')
      case 'precio':
      case 'preciocompra':
      case 'precioventa':
        return value.replace(/[^\d.,]/g, '').replace(',', '.')
      case 'stock':
      case 'cantidad':
        return value.replace(/[^\d]/g, '')
      case 'fecha':
        const date = new Date(value)
        return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0]
      default:
        return value
    }
  }

  // Obtener valor por defecto
  const getDefaultValue = (columna: string, tipo: string): string => {
    switch (columna.toLowerCase()) {
      case 'email':
        return 'sin-email@empresa.com'
      case 'telefono':
        return 'Sin teléfono'
      case 'direccion':
        return 'Sin dirección'
      case 'descripcion':
        return 'Sin descripción'
      case 'motivo':
        return 'Importación automática'
      case 'stock':
      case 'cantidad':
        return '0'
      case 'precio':
      case 'preciocompra':
      case 'precioventa':
        return '0'
      case 'stockminimo':
        return '0'
      default:
        return 'Sin especificar'
    }
  }

  // Actualizar resolución individual
  const updateResolution = useCallback((index: number, updates: Partial<ErrorResolution>) => {
    setResolutions(prev => prev.map((resolution, i) => 
      i === index ? { ...resolution, ...updates } : resolution
    ))
  }, [])

  // Aplicar resolución a todos los errores similares
  const applyToSimilarErrors = useCallback((resolution: ErrorResolution) => {
    setResolutions(prev => prev.map(r => {
      if (r.error.tipo === resolution.error.tipo && 
          r.error.columna === resolution.error.columna &&
          r.error.valor === resolution.error.valor) {
        return {
          ...r,
          valorCorregido: resolution.valorCorregido,
          sugerencia: resolution.sugerencia,
          accion: resolution.accion,
          confianza: resolution.confianza,
          resuelto: resolution.resuelto
        }
      }
      return r
    }))
  }, [])

  // Manejar resolución final
  const handleResolve = useCallback(async () => {
    setIsResolving(true)
    try {
      const resolvedErrors = resolutions.filter(r => r.resuelto)
      await onResolve(resolvedErrors)
      onClose()
    } catch (error) {
      console.error('Error al resolver errores:', error)
    } finally {
      setIsResolving(false)
    }
  }, [resolutions, onResolve, onClose])

  // Estadísticas
  const stats = useMemo(() => {
    const resueltos = resolutions.filter(r => r.resuelto).length
    const pendientes = resolutions.length - resueltos
    const porcentajeResuelto = resolutions.length > 0 ? (resueltos / resolutions.length) * 100 : 0
    
    return { resueltos, pendientes, porcentajeResuelto }
  }, [resolutions])

  // Agrupar errores por tipo
  const groupedErrors = useMemo(() => {
    const groups: Record<string, ErrorResolution[]> = {}
    resolutions.forEach(resolution => {
      const key = `${resolution.error.tipo}-${resolution.error.columna}`
      if (!groups[key]) groups[key] = []
      groups[key].push(resolution)
    })
    return groups
  }, [resolutions])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle className="text-xl text-red-800">
                  Resolución de Errores de Importación
                </CardTitle>
                <p className="text-sm text-red-600 mt-1">
                  {registrosConError} errores encontrados en {totalRegistros} registros
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Barra de progreso y estadísticas */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progreso de resolución
              </span>
              <span className="text-sm text-gray-600">
                {stats.resueltos} / {resolutions.length} resueltos
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.porcentajeResuelto}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Pendientes: {stats.pendientes}</span>
              <span>{stats.porcentajeResuelto.toFixed(1)}% completado</span>
            </div>
          </div>

          {/* Controles de resolución automática */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={autoResolveErrors}
                disabled={autoResolveMode}
                className="flex items-center space-x-2"
              >
                <Zap className="h-4 w-4" />
                <span>Resolución Automática</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>Preview</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-resolve-mode"
                checked={autoResolveMode}
                onCheckedChange={setAutoResolveMode}
              />
              <Label htmlFor="auto-resolve-mode" className="text-sm">
                Modo automático
              </Label>
            </div>
          </div>

          {/* Lista de errores agrupados */}
          <div className="space-y-4">
            {Object.entries(groupedErrors).map(([key, groupResolutions]) => {
              const firstResolution = groupResolutions[0]
              const error = firstResolution.error
              
              return (
                <Card key={key} className="border-l-4 border-red-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant={error.tipo === 'formato' ? 'default' : 'destructive'}>
                          {error.tipo.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-gray-900">
                          Columna: {error.columna}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({groupResolutions.length} errores similares)
                        </span>
                      </div>
                      
                      {firstResolution.resuelto && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Resuelto</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {groupResolutions.map((resolution, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Fila {resolution.error.fila}:
                              </span>
                              <span className="text-sm text-gray-600">
                                "{resolution.error.valor}"
                              </span>
                            </div>
                            
                            <div className="text-sm text-red-600 mb-2">
                              {resolution.error.mensaje}
                            </div>

                            {resolution.resuelto && (
                              <div className="flex items-center space-x-2 text-green-600">
                                <span className="text-sm">
                                  → "{resolution.valorCorregido}"
                                </span>
                                {resolution.sugerencia && (
                                  <span className="text-xs text-gray-500">
                                    ({resolution.sugerencia})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {!resolution.resuelto && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedError(resolution.error)}
                                className="flex items-center space-x-1"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>Editar</span>
                              </Button>
                            )}
                            
                            {groupResolutions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => applyToSimilarErrors(resolution)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Aplicar a similares
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>

        {/* Footer con acciones */}
        <div className="border-t bg-gray-50 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Confianza promedio: {stats.porcentajeResuelto.toFixed(1)}%</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Tiempo estimado: {Math.ceil(stats.pendientes / 2)} min</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isResolving}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleResolve}
              disabled={isResolving || stats.resueltos === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isResolving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resolviendo...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Aplicar Resoluciones ({stats.resueltos})
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
} 