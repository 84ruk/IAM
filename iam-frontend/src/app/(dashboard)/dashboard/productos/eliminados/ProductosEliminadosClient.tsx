'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  ArrowLeft,
  Search,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Package,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Trash2,
  Plus,
  Eye,
  Edit,
  Building2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { formatearCantidadConUnidad } from '@/lib/pluralization'
import ProductFormModal from '@/components/ui/ProductFormModal'
import FormularioProducto from '@/components/productos/FormularioProducto'
import VolverAtras from '@/components/ui/VolverAtras'
import ProductTypeIcon from '@/components/ui/ProductTypeIcon'
import EtiquetaTag from '@/components/ui/EtiquetaTag'

// Tipo para los productos eliminados
interface ProductoEliminado {
  id: number
  nombre: string
  descripcion?: string
  precioCompra: number
  precioVenta: number
  stock: number
  stockMinimo: number
  unidad: string
      etiqueta?: string
  etiquetas?: string[]
  estado: 'ELIMINADO'
  empresaId: number
  proveedorId?: number
  createdAt: string
  updatedAt: string
  codigoBarras?: string
  tipoProducto?: string
  proveedor?: {
    nombre: string
  }
}

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }).then(res => {
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`)
    }
    return res.json()
  })

export default function ProductosEliminadosClient() {
  const { data: productosEliminados, isLoading, error: errorBackend, mutate } = useSWR<ProductoEliminado[]>('/productos/eliminados', fetcher)
  
  const [filtro, setFiltro] = useState('')
  const [restaurandoId, setRestaurandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showProductFormModal, setShowProductFormModal] = useState(false)

  const productosFiltrados = useMemo(() => {
    if (!productosEliminados) return []
    
    return productosEliminados.filter((p) =>
      p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      p.etiquetas?.some(etiqueta => etiqueta.toLowerCase().includes(filtro.toLowerCase()))
    )
  }, [productosEliminados, filtro])

  const mostrarError = (mensaje: string) => {
    setError(mensaje)
    setTimeout(() => setError(null), 5000)
  }

  const manejarErrorBackend = async (response: Response, accion: string) => {
    try {
      const errorData = await response.json()
      
      if (errorData.message === 'El producto no está eliminado') {
        mostrarError('Este producto no está eliminado o ya fue restaurado.')
        return
      }
      
      if (errorData.details?.code === 'PRODUCT_NOT_FOUND') {
        mostrarError('El producto no fue encontrado.')
        return
      }
      
      if (errorData.details?.code === 'INSUFFICIENT_PERMISSIONS') {
        mostrarError('No tienes permisos para realizar esta acción.')
        return
      }
      
      mostrarError(errorData.message || `Error al ${accion}: ${response.status} ${response.statusText}`)
    } catch (parseError) {
      mostrarError(`Error al ${accion}: ${response.status} ${response.statusText}`)
    }
  }

  const restaurarProducto = async (id: number) => {
    const confirmar = confirm('¿Deseas restaurar este producto? Volverá a estar disponible en el inventario.')
    if (!confirmar) return

    try {
      setRestaurandoId(id)
      setError(null)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${id}/restaurar`, {
        method: 'PATCH',
        credentials: 'include',
      })
      
      if (!res.ok) {
        await manejarErrorBackend(res, 'restaurar producto')
        return
      }
      
      // Revalidar la lista
      mutate()
      mostrarError('Producto restaurado exitosamente')
      setTimeout(() => setError(null), 3000)
    } catch (e) {
      console.error('Error de red:', e)
      mostrarError('Error de conexión. Verifica tu conexión a internet.')
    } finally {
      setRestaurandoId(null)
    }
  }

  const getStockStatus = (producto: ProductoEliminado) => {
    if (producto.stock === 0) return { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Agotado' }
    if (producto.stock <= producto.stockMinimo) return { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle, text: 'Crítico' }
    if (producto.stock > producto.stockMinimo * 3) return { color: 'bg-yellow-100 text-yellow-700', icon: TrendingUp, text: 'Alto' }
    return { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Normal' }
  }

  const getMargen = (producto: ProductoEliminado) => {
    if (producto.precioCompra <= 0) return 0
    return ((producto.precioVenta - producto.precioCompra) / producto.precioCompra) * 100
  }

  const handleProductFormSuccess = () => {
    setShowProductFormModal(false)
    mutate() // Recargar datos
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <VolverAtras href="/dashboard/productos" label="Volver a productos" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (errorBackend) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <VolverAtras href="/dashboard/productos" label="Volver a productos" />
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar productos eliminados</h2>
          <p className="text-gray-600 mb-4">No se pudieron cargar los productos eliminados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <VolverAtras href="/dashboard/productos" label="Volver a productos" />
      </div>

      {/* Título y estadísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Papelera de Productos</h1>
          <p className="text-gray-600 mt-1">
            Productos eliminados que puedes restaurar
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/productos"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Productos
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Eliminados</p>
                <p className="text-2xl font-bold text-gray-900">{productosEliminados?.length || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disponibles para Restaurar</p>
                <p className="text-2xl font-bold text-gray-900">{productosFiltrados.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <RotateCcw className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar productos eliminados..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent"
          />
        </div>
      </div>

      {/* Mostrar mensajes */}
      {error && (
        <div className={cn(
          "mb-6 border rounded-lg p-4",
          error.includes('exitosamente') 
            ? "bg-green-50 border-green-200" 
            : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-start gap-3">
            {error.includes('exitosamente') ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn(
                "text-sm",
                error.includes('exitosamente') ? "text-green-700" : "text-red-700"
              )}>{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className={cn(
                "transition-colors",
                error.includes('exitosamente') 
                  ? "text-green-400 hover:text-green-600" 
                  : "text-red-400 hover:text-red-600"
              )}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de productos eliminados */}
      {productosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Trash2 className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filtro ? 'No se encontraron productos' : 'No hay productos eliminados'}
          </h3>
          <p className="text-gray-600 text-center">
            {filtro 
              ? 'Intenta con otros términos de búsqueda' 
              : 'Los productos que elimines aparecerán aquí para que puedas restaurarlos'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosFiltrados.map((producto) => {
            const stockStatus = getStockStatus(producto)
            const StockIcon = stockStatus.icon
            const margen = getMargen(producto)
            
            return (
              <Card key={producto.id} className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
                <CardContent className="p-6 relative flex flex-col h-full">
                  {/* Icono de tipo de producto en esquina superior derecha */}
                  <div className="absolute top-4 right-4">
                    <ProductTypeIcon 
                      tipoProducto={producto.tipoProducto as any || 'GENERICO'} 
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
                            <div key={etiqueta}>
                              <EtiquetaTag
                                etiqueta={etiqueta}
                                onClick={() => {}} // No filtrar en papelera
                                isActive={false}
                                size="sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                          Eliminado
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

                  {/* Información adicional */}
                  <div className="space-y-2 mb-4">
                    {producto.proveedor && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Proveedor:</span>
                        <span className="font-medium truncate ml-2">{producto.proveedor.nombre}</span>
                      </div>
                    )}
                    {producto.codigoBarras && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Código:</span>
                        <span className="font-medium text-xs">{producto.codigoBarras}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="mt-auto flex flex-col items-center gap-2 w-full">
                    {/* Primera fila: Ver y Restaurar */}
                    <div className="flex items-center justify-center gap-6 w-full">
                      <Link
                        href={`/dashboard/productos/${producto.id}`}
                        className="flex items-center gap-1 text-sm text-[#8E94F2] hover:text-[#7278e0] hover:underline transition-colors"
                        title="Ver producto"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Link>
                      <button
                        onClick={() => restaurarProducto(producto.id)}
                        disabled={restaurandoId === producto.id}
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline transition-colors disabled:opacity-50"
                        title="Restaurar producto"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {restaurandoId === producto.id ? 'Restaurando...' : 'Restaurar'}
                      </button>
                    </div>
                    {/* Segunda fila: Información adicional */}
                    <div className="flex items-center justify-center gap-6 w-full">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Package className="w-4 h-4" />
                        {producto.stock} {producto.unidad}
                      </span>
                      {producto.proveedor && (
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Building2 className="w-4 h-4" />
                          {producto.proveedor.nombre}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal para crear producto */}
      {showProductFormModal && (
        <ProductFormModal
          isOpen={showProductFormModal}
          onClose={() => setShowProductFormModal(false)}
          title="Nuevo Producto"
        >
          <FormularioProducto
            onSuccess={handleProductFormSuccess}
          />
        </ProductFormModal>
      )}
    </div>
  )
} 