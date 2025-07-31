'use client'

import React, { useState } from 'react'
import { RegistroExitoso, CorreccionImportacion } from '@/types/importacion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Tag, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportacionSuccessDetailsProps {
  registrosExitosos: RegistroExitoso[]
}

export default function ImportacionSuccessDetails({ 
  registrosExitosos
}: ImportacionSuccessDetailsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  // Helper function to check if a value exists and is not empty
  const hasValue = (value: unknown): boolean => {
    return value !== null && value !== undefined && String(value).trim() !== ''
  }

  const toggleExpanded = (fila: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(fila)) {
      newExpanded.delete(fila)
    } else {
      newExpanded.add(fila)
    }
    setExpandedItems(newExpanded)
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'productos':
        return <Package className="w-4 h-4" />
      case 'proveedores':
        return <Truck className="w-4 h-4" />
      case 'movimientos':
        return <Tag className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'productos':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'proveedores':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'movimientos':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatValue = (key: string, value: unknown) => {
    if (value === null || value === undefined) return '-'
    
    switch (key) {
      case 'precioCompra':
      case 'precioVenta':
        return `$${Number(value).toFixed(2)}`
      case 'stock':
      case 'stockMinimo':
      case 'cantidad':
        return Number(value).toLocaleString()
      case 'fecha':
        if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
          return new Date(value).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
        return String(value)
      case 'etiquetas':
        return Array.isArray(value) ? value.join(', ') : String(value)
      default:
        return String(value)
    }
  }

  const renderCorrecciones = (correcciones: CorreccionImportacion[]) => {
    if (!correcciones || correcciones.length === 0) return null

    return (
      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            Correcciones aplicadas automáticamente
          </span>
        </div>
        <div className="space-y-2">
          {correcciones.map((correccion, index) => (
            <div key={index} className="text-sm">
              <span className="font-medium text-yellow-700">{correccion.campo}:</span>
              <span className="text-yellow-600 ml-1">
                &quot;{correccion.valorOriginal}&quot; → &quot;{correccion.valorCorregido}&quot;
              </span>
              <Badge variant="outline" className="ml-2 text-xs">
                {correccion.tipo}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDetallesProducto = (datos: Record<string, unknown>) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
      <div>
        <span className="font-medium text-gray-600">Stock:</span>
        <span className="ml-2">{formatValue('stock', datos.stock)} {String(datos.unidad || '')}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Precio Compra:</span>
        <span className="ml-2">{formatValue('precioCompra', datos.precioCompra)}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Precio Venta:</span>
        <span className="ml-2">{formatValue('precioVenta', datos.precioVenta)}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Stock Mínimo:</span>
        <span className="ml-2">{formatValue('stockMinimo', datos.stockMinimo)} {String(datos.unidad || '')}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Tipo:</span>
        <span className="ml-2">{String(datos.tipoProducto || '')}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Estado:</span>
        <Badge variant="outline" className="ml-2">
          {String(datos.estado || '')}
        </Badge>
      </div>
      {hasValue(datos.codigoBarras) && (
        <div>
          <span className="font-medium text-gray-600">Código Barras:</span>
          <span className="ml-2 font-mono text-xs">{String(datos.codigoBarras)}</span>
        </div>
      )}
      {hasValue(datos.sku) && (
        <div>
          <span className="font-medium text-gray-600">SKU:</span>
          <span className="ml-2 font-mono text-xs">{String(datos.sku)}</span>
        </div>
      )}
      {Array.isArray(datos.etiquetas) && (datos.etiquetas as string[]).length > 0 ? (
        <div className="col-span-2 md:col-span-3">
          <span className="font-medium text-gray-600">Etiquetas:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {(datos.etiquetas as string[]).map((etiqueta, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {etiqueta}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )

  const renderDetallesProveedor = (datos: Record<string, unknown>) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
      <div>
        <span className="font-medium text-gray-600">Email:</span>
        <span className="ml-2">{String(datos.email || '-')}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Teléfono:</span>
        <span className="ml-2">{String(datos.telefono || '-')}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Estado:</span>
        <Badge variant="outline" className="ml-2">
          {String(datos.estado || '')}
        </Badge>
      </div>
      <div>
        <span className="font-medium text-gray-600">Empresa ID:</span>
        <span className="ml-2">{String(datos.empresaId || '')}</span>
      </div>
    </div>
  )

  const renderDetallesMovimiento = (datos: Record<string, unknown>) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
      <div>
        <span className="font-medium text-gray-600">Tipo:</span>
        <Badge 
          variant={String(datos.tipo) === 'ENTRADA' ? 'default' : 'destructive'}
          className="ml-2"
        >
          {String(datos.tipo || '')}
        </Badge>
      </div>
      <div>
        <span className="font-medium text-gray-600">Cantidad:</span>
        <span className="ml-2">{formatValue('cantidad', datos.cantidad)}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Fecha:</span>
        <span className="ml-2">{formatValue('fecha', datos.fecha)}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Producto:</span>
        <span className="ml-2">{String(datos.productoNombre || '')}</span>
      </div>
      <div>
        <span className="font-medium text-gray-600">Estado:</span>
        <Badge variant="outline" className="ml-2">
          {String(datos.estado || '')}
        </Badge>
      </div>
      {hasValue(datos.descripcion) && (
        <div className="col-span-2 md:col-span-3">
          <span className="font-medium text-gray-600">Descripción:</span>
          <span className="ml-2">{String(datos.descripcion)}</span>
        </div>
      )}
    </div>
  )

  const renderDetalles = (registro: RegistroExitoso) => {
    switch (registro.tipo) {
      case 'productos':
        return renderDetallesProducto(registro.datos)
      case 'proveedores':
        return renderDetallesProveedor(registro.datos)
      case 'movimientos':
        return renderDetallesMovimiento(registro.datos)
      default:
        return (
          <div className="text-sm text-gray-600">
            <pre className="whitespace-pre-wrap">{JSON.stringify(registro.datos, null, 2)}</pre>
          </div>
        )
    }
  }

  if (!registrosExitosos || registrosExitosos.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Registros Importados Exitosamente ({registrosExitosos.length})
        </h3>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {registrosExitosos.map((registro, index) => (
          <Card key={`${registro.fila}-${index}`} className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTipoIcon(registro.tipo)}
                  <div>
                    <CardTitle className="text-base font-medium text-gray-800">
                      {registro.identificador}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn("text-xs", getTipoColor(registro.tipo))}>
                        Fila {registro.fila}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ID: {String(registro.datos.id)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(registro.timestamp).toLocaleTimeString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(registro.fila)}
                  className="h-8 w-8 p-0"
                >
                  {expandedItems.has(registro.fila) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {expandedItems.has(registro.fila) && (
              <CardContent className="pt-0">
                <div className="border-t pt-4">
                  {renderDetalles(registro)}
                  {registro.correccionesAplicadas && renderCorrecciones(registro.correccionesAplicadas)}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
} 