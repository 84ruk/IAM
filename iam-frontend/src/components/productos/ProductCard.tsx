import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  RotateCcw
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { pluralizarUnidad, formatearCantidadConUnidad } from '@/lib/pluralization'
import { Producto } from '@/types/producto'
import ProductTypeIcon from '@/components/ui/ProductTypeIcon'
import EtiquetaTag from '@/components/ui/EtiquetaTag'

interface ProductCardProps {
  producto: Producto
  onEliminar: (id: number) => void
  onActivar: (id: number) => void
  onMostrarStock: (producto: Producto) => void
  onFiltrarPorEtiqueta: (etiqueta: string) => void
  filtroEtiqueta: string
  eliminandoId: number | null
}

export default function ProductCard({
  producto,
  onEliminar,
  onActivar,
  onMostrarStock,
  onFiltrarPorEtiqueta,
  filtroEtiqueta,
  eliminandoId
}: ProductCardProps) {
  const router = useRouter()

  const getStockStatus = (producto: Producto) => {
    if (producto.stock <= 0) {
      return {
        color: "bg-red-100 text-red-700",
        icon: Package
      }
    } else if (producto.stock <= producto.stockMinimo) {
      return {
        color: "bg-yellow-100 text-yellow-700",
        icon: Package
      }
    } else {
      return {
        color: "bg-green-100 text-green-700",
        icon: Package
      }
    }
  }

  const getMargen = (producto: Producto) => {
    if (producto.precioCompra === 0) return 0
    return ((producto.precioVenta - producto.precioCompra) / producto.precioCompra) * 100
  }

  const getCodigoBarras = (producto: Producto) => {
    return producto.codigoBarras || producto.sku || producto.rfid || 'Sin código'
  }

  const stockStatus = getStockStatus(producto)
  const StockIcon = stockStatus.icon
  const margen = getMargen(producto)

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full"
      onClick={() => router.push(`/dashboard/productos/${producto.id}`)}
    >
      <CardContent className="p-6 relative flex flex-col h-full">
        {/* Icono de tipo de producto en esquina superior derecha */}
        <div className="absolute top-4 right-4">
          <ProductTypeIcon 
            tipoProducto={producto.tipoProducto} 
            size="sm"
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 pr-12">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">
              {producto.nombre}
            </h3>
            {/* Etiquetas debajo del nombre */}
            {producto.etiquetas && producto.etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 mt-1">
                {producto.etiquetas.map((etiqueta) => (
                  <div key={etiqueta} onClick={e => e.stopPropagation()}>
                    <EtiquetaTag
                      etiqueta={etiqueta}
                      onClick={onFiltrarPorEtiqueta}
                      isActive={filtroEtiqueta === etiqueta}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
                producto.estado === 'ACTIVO' 
                  ? "bg-green-100 text-green-700" 
                  : "bg-gray-100 text-gray-600"
              )}>
                {producto.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-2 mb-4">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
            stockStatus.color
          )}>
            <StockIcon className="w-3 h-3" />
            {formatearCantidadConUnidad(producto.stock, producto.unidad.toLowerCase())}
          </span>
        </div>

        {/* Precios */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Precio compra:</span>
            <span className="font-medium">${producto.precioCompra.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Precio venta:</span>
            <span className="font-medium">${producto.precioVenta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Margen:</span>
            <span className={cn(
              "font-medium",
              margen > 50 ? "text-green-600" : margen > 20 ? "text-yellow-600" : "text-red-600"
            )}>
              {margen.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-auto flex flex-col items-center gap-2 w-full">
          {/* Primera fila: Editar y Eliminar/Activar */}
          <div className="flex items-center justify-center gap-6 w-full">
            <Link
              href={`/dashboard/productos/${producto.id}/editar`}
              className="flex items-center gap-1 text-sm text-[#8E94F2] hover:text-[#7278e0] hover:underline transition-colors"
              title="Editar producto"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>
            {producto.estado === 'ACTIVO' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEliminar(producto.id)
                }}
                disabled={eliminandoId === producto.id}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 hover:underline transition-colors disabled:opacity-50"
                title="Eliminar producto"
              >
                <Trash2 className="w-4 h-4" />
                {eliminandoId === producto.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onActivar(producto.id)
                }}
                disabled={eliminandoId === producto.id}
                className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline transition-colors disabled:opacity-50"
                title="Activar producto"
              >
                <RotateCcw className="w-4 h-4" />
                {eliminandoId === producto.id ? 'Activando...' : 'Activar'}
              </button>
            )}
          </div>
          {/* Segunda fila: Stock y Flyer */}
          <div className="flex items-center justify-center gap-6 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMostrarStock(producto)
              }}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              title="Ver información de stock"
            >
              <Package className="w-4 h-4" />
              Stock
            </button>
            <Link
              href={`/dashboard/productos/${producto.id}/flyer`}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
              title="Ver flyer"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="w-4 h-4" />
              Flyer
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 