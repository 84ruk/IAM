'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { useSearchDebounce } from '@/hooks/useDebounce'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  RotateCcw,
  X
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Producto } from '@/types/producto'
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



export default function ProductosClient() {
  const router = useRouter()
  
  // Estados de filtros avanzados
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('')
  const [filtroTipoProducto, setFiltroTipoProducto] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVO' | 'INACTIVO' | 'ELIMINADO' | ''>('ACTIVO') // Activos por defecto
  const [mostrarAgotados, setMostrarAgotados] = useState(false)
  
  // Estados de UI
  const [pagina, setPagina] = useState(1)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [vista, setVista] = useState<'tabla' | 'tarjetas'>('tarjetas')
  const [error, setError] = useState<string | null>(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [showProductFormModal, setShowProductFormModal] = useState(false)
  const [isChangingPage, setIsChangingPage] = useState(false)
  const [itemsPorPagina, setItemsPorPagina] = useState(50) // Aumentado para mejor escalabilidad


  // Aplicar debounce al filtro de texto (500ms)
  const { debouncedValue: debouncedFiltroTexto, isSearching } = useSearchDebounce(filtroTexto, 500)

  // Estado local para mantener datos durante la búsqueda
  const [localProductos, setLocalProductos] = useState<Producto[]>([])
  const [localTotal, setLocalTotal] = useState(0)
  const [hasInitialData, setHasInitialData] = useState(false)

  // Construir URL con filtros (usando el valor debounced)
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (debouncedFiltroTexto) params.set('search', debouncedFiltroTexto)
    if (filtroEtiqueta) params.set('etiqueta', filtroEtiqueta)
    if (filtroTipoProducto) params.set('tipoProducto', filtroTipoProducto)
    if (filtroEstado) params.set('estado', filtroEstado)
    if (mostrarAgotados) params.set('agotados', 'true')
    
    // Agregar parámetros de paginación
    params.set('page', pagina.toString())
    params.set('limit', itemsPorPagina.toString()) // Usar límite dinámico para escalabilidad
    
    // Solo enviar filtro de estado si se especifica explícitamente
    if (filtroEstado) {
      params.set('estado', filtroEstado)
    }
    
    const queryString = params.toString()
    const url = `/productos${queryString ? `?${queryString}` : ''}`
    
    // Debug: mostrar la URL que se está construyendo (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 URL construida:', url)
      console.log('🔍 Filtro estado:', filtroEstado)
    }
    
    return url
  }, [debouncedFiltroTexto, filtroEtiqueta, filtroTipoProducto, filtroEstado, mostrarAgotados, pagina, itemsPorPagina])

  // Obtener productos con filtros aplicados en el backend
  const { data: productosData, error: errorProductos, mutate } = useSWR(buildUrl(), fetcher, {
    // Configuración optimizada para evitar recargas innecesarias
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 1000, // Evitar requests duplicados en 1 segundo
    errorRetryCount: 2,
    errorRetryInterval: 3000,
  })

  // Actualizar datos locales cuando lleguen nuevos datos del servidor
  useEffect(() => {
    if (productosData) {
      setLocalProductos(productosData.productos || [])
      setLocalTotal(productosData.total || 0)
      setHasInitialData(true)
    }
  }, [productosData])

  // Resetear página cuando cambien los filtros (excepto cuando se cambia manualmente la página)
  useEffect(() => {
    if (hasInitialData) {
      setPagina(1)
    }
  }, [debouncedFiltroTexto, filtroEtiqueta, filtroTipoProducto, filtroEstado, mostrarAgotados, hasInitialData])

  // Resetear página cuando cambie la vista para evitar problemas de paginación
  useEffect(() => {
    if (hasInitialData) {
      setPagina(1)
    }
  }, [vista, hasInitialData])

  // Resetear página cuando cambie el límite de items por página
  useEffect(() => {
    if (hasInitialData) {
      setPagina(1)
    }
  }, [itemsPorPagina, hasInitialData])

  // Estado de carga personalizado - solo mostrar loading si no hay datos iniciales
  const isLoading = !hasInitialData && !isSearching

  // Usar datos locales para evitar skeleton screens durante la búsqueda
  const productos = localProductos
  const totalProductos = localTotal
  
  // Usar el límite real que viene del backend
  const limiteBackend = productosData?.limit || itemsPorPagina

  const productosFiltrados = productos // ya viene paginado del backend

  // Usar la paginación que viene del backend
  const totalPaginas = productosData?.totalPages || 1
  const paginaActual = productosData?.page || 1

  // Obtener etiquetas únicas para el filtro
  const etiquetasUnicas = useMemo(() => {
    const etiquetas = productos?.flatMap((p: Producto) => p.etiquetas || []).filter(Boolean) as string[] || []
    return [...new Set(etiquetas)]
  }, [productos])

  // Función para manejar cambio de página
  const handlePageChange = useCallback((nuevaPagina: number) => {
    setIsChangingPage(true)
    setPagina(nuevaPagina)
    // Scroll hacia arriba para mejor UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Resetear indicador de carga cuando lleguen nuevos datos
  useEffect(() => {
    if (productosData) {
      setIsChangingPage(false)
    }
  }, [productosData])

  // Función para limpiar filtros
  const limpiarFiltros = useCallback(() => {
    setFiltroTexto('')
    setFiltroEtiqueta('')
    setFiltroTipoProducto('')
    setFiltroEstado('')
    setMostrarAgotados(false)
    setPagina(1)
    setHasInitialData(false) // Forzar recarga de datos
  }, [])

  // Verificar si hay filtros activos
  const hayFiltrosActivos = Boolean(debouncedFiltroTexto || filtroEtiqueta || filtroTipoProducto || filtroEstado || mostrarAgotados)

  // Función para filtrar por etiqueta al hacer clic en etiqueta
  const filtrarPorEtiqueta = useCallback((etiqueta: string) => {
    if (filtroEtiqueta === etiqueta) {
      setFiltroEtiqueta('') // Si ya está activo, lo desactivamos
    } else {
      setFiltroEtiqueta(etiqueta)
      setMostrarFiltros(true) // Mostrar filtros para que el usuario vea el filtro activo
    }
    setPagina(1)
  }, [filtroEtiqueta])

  // Función para mostrar errores
  const mostrarError = useCallback((mensaje: string) => {
    setError(mensaje)
    setTimeout(() => setError(null), 5000)
  }, [])

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
    } catch {
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

      // Actualizar la lista de productos
      await mutate()
      mostrarError('Producto eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      mostrarError('Error de conexión al eliminar el producto')
    } finally {
      setEliminandoId(null)
    }
  }

  const activarProducto = async (id: number) => {
    try {
      setEliminandoId(id)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${id}/activar`, {
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

      // Actualizar la lista de productos
      await mutate()
      mostrarError('Producto activado exitosamente')
    } catch (error) {
      console.error('Error al activar producto:', error)
      mostrarError('Error de conexión al activar el producto')
    } finally {
      setEliminandoId(null)
    }
  }

  const getStockStatus = (producto: Producto) => {
    if (producto.stock === 0) return { status: 'agotado', color: 'text-red-600', bg: 'bg-red-50' }
    if (producto.stockMinimo && producto.stock <= producto.stockMinimo) return { status: 'crítico', color: 'text-orange-600', bg: 'bg-orange-50' }
    if (producto.stockMinimo && producto.stock <= producto.stockMinimo * 2) return { status: 'bajo', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { status: 'normal', color: 'text-green-600', bg: 'bg-green-50' }
  }

  const getMargen = (producto: Producto) => {
    if (!producto.precioCompra || producto.precioCompra <= 0) return null
    return ((producto.precioVenta - producto.precioCompra) / producto.precioCompra * 100).toFixed(1)
  }



  const handleProductFormSuccess = () => {
    setShowProductFormModal(false)
    mutate()
  }



  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (errorProductos) {
    return (
      <div className="min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error al cargar productos</div>
            <p className="text-red-500 text-sm mb-4">{errorProductos.message}</p>
            <button
              onClick={() => mutate()}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
            <p className="text-gray-600 mt-1">
              Gestiona tu catálogo de productos
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
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#8E94F2] text-white rounded-xl hover:bg-[#7278e0] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nuevo Producto</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productos.filter((p: { estado: string }) => p.estado === 'ACTIVO').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Crítico</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productos.filter((p: { stock: number; stockMinimo?: number }) => p.stockMinimo && p.stock <= p.stockMinimo && p.stock > 0).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y etiquetas unificados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          {/* Sección: Filtros de búsqueda */}
          <div className="p-6 border-b border-gray-100">
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
          hayFiltrosActivos={hayFiltrosActivos}
          onLimpiarFiltros={limpiarFiltros}
          etiquetasUnicas={etiquetasUnicas}
          isSearching={isSearching}
        />
          </div>

          {/* Sección: Etiquetas populares */}
        {etiquetasUnicas.length > 0 && (
            <div className="p-6">
          <PopularTags
            etiquetasUnicas={etiquetasUnicas}
            filtroEtiqueta={filtroEtiqueta}
            onFiltrarPorEtiqueta={filtrarPorEtiqueta}
          />
            </div>
        )}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:bg-red-100 rounded"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {/* Lista de productos */}
        {productosFiltrados.length === 0 ? (
          <EmptyState
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiarFiltros={limpiarFiltros}
            onAgregarProducto={() => setShowProductFormModal(true)}
            totalProductos={totalProductos}
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
          />
        ) : (
          <>
            {/* Controles de vista */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVista('tarjetas')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      vista === 'tarjetas' 
                        ? "bg-[#8E94F2] text-white" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <div className="grid grid-cols-2 gap-1 w-4 h-4">
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                    </div>
                  </button>
                  <button
                    onClick={() => setVista('tabla')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      vista === 'tabla' 
                        ? "bg-[#8E94F2] text-white" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <div className="space-y-1 w-4 h-4">
                      <div className="bg-current rounded-sm h-0.5"></div>
                      <div className="bg-current rounded-sm h-0.5"></div>
                      <div className="bg-current rounded-sm h-0.5"></div>
                    </div>
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  {productosFiltrados.length} de {totalProductos} productos
                </span>
              </div>
            </div>

            {/* Vista de tarjetas */}
            {vista === 'tarjetas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {isChangingPage && (
                  <div className="col-span-full flex justify-center py-8">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8E94F2]"></div>
                      <span className="text-gray-600">Cargando productos...</span>
                    </div>
                  </div>
                )}
                {productosFiltrados.map((producto: Producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    onEliminar={eliminarProducto}
                    onActivar={activarProducto}
                    onMostrarStock={(producto) => {
                      setSelectedProducto(producto)
                      setShowStockModal(true)
                    }}
                    onFiltrarPorEtiqueta={filtrarPorEtiqueta}
                    filtroEtiqueta={filtroEtiqueta}
                    eliminandoId={eliminandoId}
                  />
                ))}
              </div>
            )}

            {/* Vista de tabla */}
            {vista === 'tabla' && (
              <Card className="mb-8">
                <CardContent className="p-0">
                  {isChangingPage && (
                    <div className="flex justify-center py-8">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8E94F2]"></div>
                        <span className="text-gray-600">Cargando productos...</span>
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Producto</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Stock</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Precio</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productosFiltrados.map((producto: Producto) => {
                          const stockStatus = getStockStatus(producto)
                          return (
                            <tr key={producto.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{producto.nombre}</p>
                                  {producto.etiquetas && producto.etiquetas.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {producto.etiquetas.map((etiqueta) => (
                                        <span key={etiqueta} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                          {etiqueta}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`font-medium ${stockStatus.color}`}>
                                  {producto.stock} {producto.unidad}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-gray-900">${producto.precioVenta}</p>
                                {getMargen(producto) && (
                                  <p className="text-xs text-green-600">{getMargen(producto)}% margen</p>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  producto.estado === 'ACTIVO' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {producto.estado}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => router.push(`/dashboard/productos/${producto.id}`)}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => router.push(`/dashboard/productos/${producto.id}/editar`)}
                                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  {producto.estado === 'ACTIVO' ? (
                                    <button
                                      onClick={() => eliminarProducto(producto.id)}
                                      disabled={eliminandoId === producto.id}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                    >
                                      {eliminandoId === producto.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => activarProducto(producto.id)}
                                      disabled={eliminandoId === producto.id}
                                      className="p-1 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                                    >
                                      {eliminandoId === producto.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <RotateCcw className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <Pagination
                currentPage={paginaActual}
                totalPages={totalPaginas}
                totalItems={totalProductos}
                itemsPerPage={limiteBackend}
                startIndex={((paginaActual - 1) * limiteBackend)}
                endIndex={Math.min(paginaActual * limiteBackend, totalProductos)}
                onPageChange={handlePageChange}
                isChangingPage={isChangingPage}
                showItemsPerPage={true}
                onItemsPerPageChange={setItemsPorPagina}
              />
            )}
          </>
        )}

        {/* Modales */}
        <StockInfoModal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          producto={selectedProducto ? {
            nombre: selectedProducto.nombre,
            stock: selectedProducto.stock,
            stockMinimo: selectedProducto.stockMinimo || 0,
            unidad: selectedProducto.unidad || 'unidades'
          } : null}
        />

        <ProductFormModal
          isOpen={showProductFormModal}
          onClose={() => setShowProductFormModal(false)}
        >
          <FormularioProducto onSuccess={handleProductFormSuccess} />
        </ProductFormModal>
      </div>
    </div>
  )
} 