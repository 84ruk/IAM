'use client'

import React, { useState } from 'react'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Package, 
  ShoppingCart, 
  Activity, 
  Brain, 
  Download,
  X
} from 'lucide-react'
import { TipoImportacion } from '@/types/importacion'
import { useToast } from '@/components/ui/Toast'

interface TipoImportacionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTipo: (tipo: TipoImportacion) => void
  onDownloadTemplate: (tipo: TipoImportacion) => Promise<void>
}

const tiposImportacion = [
  {
    tipo: 'productos' as TipoImportacion,
    nombre: 'Productos',
    descripcion: 'Importar catálogo de productos con información detallada',
    icono: Package,
    color: 'blue',
    campos: ['nombre', 'descripcion', 'precio', 'stock', 'categoria', 'proveedor'],
    ejemplo: 'Laptop HP, Electrónicos, 1200.00, 10, Computadoras, HP Inc.'
  },
  {
    tipo: 'proveedores' as TipoImportacion,
    nombre: 'Proveedores',
    descripcion: 'Importar información de proveedores y contactos',
    icono: ShoppingCart,
    color: 'orange',
    campos: ['nombre', 'email', 'telefono', 'direccion', 'rfc'],
    ejemplo: 'Distribuidora ABC, contacto@abc.com, 555-1234, CDMX, ABC123456789'
  },
  {
    tipo: 'movimientos' as TipoImportacion,
    nombre: 'Movimientos',
    descripcion: 'Importar movimientos de inventario y transacciones',
    icono: Activity,
    color: 'purple',
    campos: ['producto', 'tipo', 'cantidad', 'fecha', 'motivo'],
    ejemplo: 'Laptop HP, entrada, 5, 2024-01-15, Compra'
  },
  {
    tipo: 'auto' as TipoImportacion,
    nombre: 'Detección Automática',
    descripcion: 'El sistema detecta automáticamente el tipo de datos',
    icono: Brain,
    color: 'green',
    campos: ['automático'],
    ejemplo: 'El sistema analiza las columnas y determina el tipo'
  }
]

export default function TipoImportacionModal({
  isOpen,
  onClose,
  onSelectTipo,
  onDownloadTemplate
}: TipoImportacionModalProps) {
  const [selectedTipo, setSelectedTipo] = useState<TipoImportacion | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const { addToast } = useToast()

  const handleTipoSelect = (tipo: TipoImportacion) => {
    setSelectedTipo(tipo)
  }

  const handleConfirm = () => {
    if (selectedTipo) {
      onSelectTipo(selectedTipo)
      onClose()
    }
  }

  const handleDownloadTemplate = async (tipo: TipoImportacion) => {
    if (tipo === 'auto') {
      addToast({
        type: 'info',
        title: 'Información',
        message: 'La detección automática no requiere plantilla'
      })
      return
    }

    try {
      setIsDownloading(true)
      await onDownloadTemplate(tipo)
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo descargar la plantilla'
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'orange': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'purple': return 'bg-purple-50 border-purple-200 text-purple-800'
      case 'green': return 'bg-green-50 border-green-200 text-green-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600'
      case 'orange': return 'text-orange-600'
      case 'purple': return 'text-purple-600'
      case 'green': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Seleccionar Tipo de Importación
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Elige el tipo de datos que vas a importar o deja que el sistema lo detecte automáticamente
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-white/60 transition-all duration-200 rounded-full"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiposImportacion.map((tipo) => {
              const IconComponent = tipo.icono
              const isSelected = selectedTipo === tipo.tipo
              const colorClasses = getColorClasses(tipo.color)
              const iconColor = getIconColor(tipo.color)

              return (
                <div
                  key={tipo.tipo}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isSelected 
                      ? `${colorClasses} border-current` 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTipoSelect(tipo.tipo)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${isSelected ? 'bg-white/80' : 'bg-gray-100'}`}>
                        <IconComponent className={`w-6 h-6 ${iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{tipo.nombre}</h3>
                        <Badge variant={tipo.tipo === 'auto' ? 'default' : 'secondary'} className="mt-1">
                          {tipo.tipo === 'auto' ? 'Inteligente' : 'Específico'}
                        </Badge>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-current rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{tipo.descripcion}</p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Campos esperados:</h4>
                      <div className="flex flex-wrap gap-1">
                        {tipo.campos.map((campo, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {campo}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Ejemplo:</h4>
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {tipo.ejemplo}
                      </p>
                    </div>

                    {tipo.tipo !== 'auto' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadTemplate(tipo.tipo)
                        }}
                        disabled={isDownloading}
                        className="w-full"
                      >
                        {isDownloading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            Descargando...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Descargar Plantilla
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Recomendación</h4>
                <p className="text-sm text-blue-700">
                  Si no estás seguro del tipo de datos, selecciona &quot;Detección Automática&quot;. 
                  El sistema analizará tu archivo y determinará automáticamente el tipo más apropiado.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedTipo}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar con {selectedTipo ? tiposImportacion.find(t => t.tipo === selectedTipo)?.nombre : 'Tipo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 