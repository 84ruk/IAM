// dashboard/productos/page.tsx
'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  RotateCcw,
  X,
  Tag
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { pluralizarUnidad, formatearCantidadConUnidad } from '@/lib/pluralization'
import { Producto } from '@/types/producto'
import { TipoProductoConfig } from '@/types/enums'
import ProductTypeIcon from '@/components/ui/ProductTypeIcon'
import EtiquetaTag from '@/components/ui/EtiquetaTag'
import StockInfoModal from '@/components/ui/StockInfoModal'
import ProductFormModal from '@/components/ui/ProductFormModal'
import FormularioProducto from '@/components/productos/FormularioProducto'
import ProductCard from '@/components/productos/ProductCard'
import ProductFilters from '@/components/productos/ProductFilters'
import PopularTags from '@/components/productos/PopularTags'
import EmptyState from '@/components/productos/EmptyState'
import Pagination from '@/components/ui/Pagination'

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

export default function ProductosPage() {
  const router = useRouter()
  
  // Estados de filtros avanzados
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('')
  const [filtroTipoProducto, setFiltroTipoProducto] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVO' | 'INACTIVO' | ''>('')
  const [mostrarAgotados, setMostrarAgotados] = useState(false)
  
  // Estados de UI
  const [orden, setOrden] = useState<'asc' | 'desc'>('asc')
  const [columnaOrden, setColumnaOrden] = useState<keyof Producto>('nombre')
  const [pagina, setPagina] = useState(1)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [vista, setVista] = useState<'tabla' | 'tarjetas'>('tarjetas')
  const [error, setError] = useState<string | null>(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [showProductFormModal, setShowProductFormModal] = useState(false)

  // Construir URL con filtros
  const buildUrl = () => {
    const params = new URLSearchParams()
    if (filtroTexto) params.set('search', filtroTexto)
    if (filtroEtiqueta) params.set('etiqueta', filtroEtiqueta)
    if (filtroTipoProducto) params.set('tipoProducto', filtroTipoProducto)
    if (filtroEstado) params.set('estado', filtroEstado)
    if (mostrarAgotados) params.set('agotados', 'true')
    
    const queryString = params.toString()
    return `/productos${queryString ? `?${queryString}` : ''}`
  }

  // Obtener productos con filtros aplicados en el backend
  const { data: productosData, isLoading, error: errorProductos, mutate } = useSWR(buildUrl(), fetcher)

  const productos = productosData?.productos || []
  const totalProductos = productosData?.total || 0
  const itemsPorPagina = 12

  const productosFiltrados = productos // ya viene paginado

  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(totalProductos / itemsPorPagina))
  }, [totalProductos])

  // Obtener etiquetas únicas para el filtro
  const etiquetasUnicas = useMemo(() => {
    const etiquetas = productos?.map((p: Producto) => p.etiqueta).filter(Boolean) as string[] || []
    return [...new Set(etiquetas)]
  }, [productos])

  // Tipos de producto únicos
  const tiposProducto = ['GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO']

  const cambiarOrden = (columna: keyof Producto) => {
    if (columna === columnaOrden) {
      setOrden(orden === 'asc' ? 'desc' : 'asc')
    } else {
      setColumnaOrden(columna)
      setOrden('asc')
    }
  }

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroTexto('')
    setFiltroEtiqueta('')
    setFiltroTipoProducto('')
    setFiltroEstado('')
    setMostrarAgotados(false)
    setPagina(1)
  }

  // Verificar si hay filtros activos
  const hayFiltrosActivos = Boolean(filtroTexto || filtroEtiqueta || filtroTipoProducto || filtroEstado || mostrarAgotados)

  // Función para filtrar por etiqueta al hacer clic en etiqueta
  const filtrarPorEtiqueta = (etiqueta: string) => {
    if (filtroEtiqueta === etiqueta) {
      setFiltroEtiqueta('') // Si ya está activo, lo desactivamos
    } else {
      setFiltroEtiqueta(etiqueta)
      setMostrarFiltros(true) // Mostrar filtros para que el usuario vea el filtro activo
    }
    setPagina(1)
  }

  // Función para mostrar errores
  const mostrarError = (mensaje: string) => {
    setError(mensaje)
    setTimeout(() => setError(null), 5000)
  }

  // Función para manejar errores de respuesta del backend
  const manejarErrorBackend = async (response: Response, accion: string) => {
    try {
      const errorData = await response.json()
      
      if (errorData.message === 'El producto ya está inactivo') {
        mostrarError('Este producto ya está inactivo. No es necesario eliminarlo nuevamente.')
        return
      }
      
      if (errorData.message === 'El producto ya está activo') {
        mostrarError('Este producto ya está activo.')
        return
      }
      
      if (errorData.message === 'El producto ya está activo y no puede ser reactivado') {
        mostrarError('Este producto ya está activo y no necesita ser reactivado.')
        return
      }
      
      // Error genérico
      mostrarError(`Error al ${accion}: ${errorData.message || 'Error desconocido'}`)
    } catch (parseError) {
      // Si no se puede parsear la respuesta, mostrar error genérico
      mostrarError(`Error al ${accion}. Código de estado: ${response.status}`)
    }
  }

  const eliminarProducto = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción lo ocultará del inventario pero podrás restaurarlo desde la papelera.')) {
      return
    }

    try {
      setEliminandoId(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        await manejarErrorBackend(response, 'eliminar')
        return
      }

      mostrarError('Producto eliminado correctamente. Puedes restaurarlo desde la papelera.')
      mutate() // Recargar datos
    } catch (error) {
      mostrarError('Error al eliminar el producto. Intenta nuevamente.')
    } finally {
      setEliminandoId(null)
    }
  }

  const activarProducto = async (id: number) => {
    try {
      setEliminandoId(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${id}/reactivar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        await manejarErrorBackend(response, 'activar')
        return
      }

      mostrarError('Producto activado correctamente.')
      mutate() // Recargar datos
    } catch (error) {
      mostrarError('Error al activar el producto. Intenta nuevamente.')
    } finally {
      setEliminandoId(null)
    }
  }

  const getStockStatus = (producto: Producto) => {
    if (producto.stock === 0) return { color: 'bg-red-100 text-red-700', badge: 'bg-red-100 text-red-700', icon: XCircle, text: 'Agotado' }
    if (producto.stock <= producto.stockMinimo) return { color: 'bg-orange-100 text-orange-700', badge: 'bg-orange-100 text-orange-700', icon: AlertTriangle, text: 'Crítico' }
    if (producto.stock > producto.stockMinimo * 3) return { color: 'bg-yellow-100 text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', icon: TrendingUp, text: 'Alto' }
    return { color: 'bg-green-100 text-green-700', badge: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Normal' }
  }

  const getMargen = (producto: Producto) => {
    if (producto.precioCompra <= 0) return 0
    return ((producto.precioVenta - producto.precioCompra) / producto.precioCompra) * 100
  }

  const getCodigoBarras = (producto: Producto) => {
    return producto.codigoBarras || producto.rfid || producto.sku || 'Sin código'
  }

  const mostrarStockInfo = (producto: Producto) => {
    setSelectedProducto(producto)
    setShowStockModal(true)
  }

  const handleProductFormSuccess = () => {
    setShowProductFormModal(false)
    mutate() 
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (errorProductos) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar productos</h2>
            <p className="text-gray-600 mb-4">{errorProductos.message}</p>
            <button
              onClick={() => mutate()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
              <p className="text-gray-600 mt-1">
                Gestiona tu inventario de productos ({totalProductos} productos)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/productos/eliminados"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-all duration-200 border border-gray-200"
              >
                <Trash2 className="w-4 h-4" />
                Papelera
              </Link>
              <button
                onClick={() => setShowProductFormModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#8E94F2] text-white rounded-xl hover:bg-[#7278e0] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Nuevo producto
              </button>
            </div>
          </div>

          {/* Alerta de error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Etiquetas populares */}
          <PopularTags
            etiquetasUnicas={etiquetasUnicas}
            filtroEtiqueta={filtroEtiqueta}
            onFiltrarPorEtiqueta={filtrarPorEtiqueta}
          />

          {/* Filtros */}
          <ProductFilters
            filtroTexto={filtroTexto}
            setFiltroTexto={setFiltroTexto}
            filtroEtiqueta={filtroEtiqueta}
            setFiltroEtiqueta={setFiltroEtiqueta}
            filtroTipoProducto={filtroTipoProducto}
            setFiltroTipoProducto={setFiltroTipoProducto}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            mostrarAgotados={mostrarAgotados}
            setMostrarAgotados={setMostrarAgotados}
            mostrarFiltros={mostrarFiltros}
            setMostrarFiltros={setMostrarFiltros}
            etiquetasUnicas={etiquetasUnicas}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiarFiltros={limpiarFiltros}
          />
        </div>

        {/* Contenido principal */}
        {!productos || productos.length === 0 ? (
          <EmptyState
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiarFiltros={limpiarFiltros}
            onAgregarProducto={() => setShowProductFormModal(true)}
          />
        ) : (
          <>
            {/* Vista de tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {productosFiltrados.map((producto: Producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onEliminar={eliminarProducto}
                  onActivar={activarProducto}
                  onMostrarStock={mostrarStockInfo}
                  onFiltrarPorEtiqueta={filtrarPorEtiqueta}
                  filtroEtiqueta={filtroEtiqueta}
                  eliminandoId={eliminandoId}
                />
              ))}
            </div>

            {/* Paginación */}
            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              onPageChange={setPagina}
            />
          </>
        )}
      </div>
      
      {/* Modal de información de stock */}
      <StockInfoModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        producto={selectedProducto ? {
          nombre: selectedProducto.nombre,
          stock: selectedProducto.stock,
          stockMinimo: selectedProducto.stockMinimo,
          unidad: selectedProducto.unidad
        } : null}
      />

      {/* Modal del formulario de productos */}
      <ProductFormModal
        isOpen={showProductFormModal}
        onClose={() => setShowProductFormModal(false)}
        title="Nuevo Producto"
        subtitle="Agrega un nuevo producto al inventario"
      >
        <div className="p-6">
          <FormularioProducto onSuccess={handleProductFormSuccess} />
        </div>
      </ProductFormModal>
    </div>
  )
}
