'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Package,
  Plus,
  Search,
  RefreshCw,
  Eye,
  MoreHorizontal,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Proveedor } from '@/types/proveedor'
import { Producto } from '@/types/producto'

import ProveedorFormModal from '@/components/ui/ProveedorFormModal'
import Pagination from '@/components/ui/Pagination'
import VolverAtras from '@/components/ui/VolverAtras'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((res) => {
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
    return res.json()
  })

export default function ProveedorDetalleClient() {
  const params = useParams()
  const router = useRouter()
  
  // Estados del proveedor
  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados de productos
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosLoading, setProductosLoading] = useState(true)
  const [paginaProductos, setPaginaProductos] = useState(1)
  const [filtroProductos, setFiltroProductos] = useState('')
  const [totalProductos, setTotalProductos] = useState(0)
  
  // Estados de UI
  const [showEditModal, setShowEditModal] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [proveedorEdit, setProveedorEdit] = useState<Proveedor | null>(null)

  const itemsPorPagina = 8

  // Función para mostrar errores
  const mostrarError = (mensaje: string) => {
    setError(mensaje)
    setTimeout(() => setError(null), 5000)
  }

  // Cargar proveedor
  useEffect(() => {
    const fetchProveedor = async () => {
      if (!params.id) return
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores/${params.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Proveedor no encontrado')
        }

        const data = await response.json()
        setProveedor(data)
      } catch (error) {
        console.error('Error al cargar el proveedor:', error)
        mostrarError('Error al cargar el proveedor')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProveedor()
  }, [params.id])

  // Cargar productos del proveedor
  useEffect(() => {
    const fetchProductos = async () => {
      if (!params.id) return
      
      try {
        setProductosLoading(true)
        const searchParams = new URLSearchParams()
        searchParams.set('proveedorId', params.id as string)
        searchParams.set('page', paginaProductos.toString())
        searchParams.set('limit', itemsPorPagina.toString())
        if (filtroProductos) searchParams.set('search', filtroProductos)
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos?${searchParams.toString()}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProductos(data.productos || [])
          setTotalProductos(data.total || 0)
        }
      } catch (error) {
        console.error('Error al cargar productos:', error)
        mostrarError('Error al cargar productos del proveedor')
      } finally {
        setProductosLoading(false)
      }
    }

    fetchProductos()
  }, [params.id, paginaProductos, filtroProductos])

  // Eliminar proveedor
  const eliminarProveedor = async () => {
    if (!proveedor) return
    
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor? Esta acción lo ocultará del sistema pero podrás restaurarlo desde la papelera.')) {
      return
    }

    try {
      setEliminando(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores/${proveedor.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al eliminar')
      }

      mostrarError('Proveedor eliminado exitosamente. Redirigiendo...')
      setTimeout(() => {
        router.push('/dashboard/proveedores')
      }, 2000)
    } catch (error) {
      console.error('Error al eliminar:', error)
      mostrarError('Error al eliminar el proveedor')
    } finally {
      setEliminando(false)
    }
  }

  // Manejar éxito de edición
  const handleEditSuccess = () => {
    setShowEditModal(false)
    setProveedorEdit(null)
    // Recargar proveedor
    window.location.reload()
  }

  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return {
          color: "bg-green-100 text-green-700",
          icon: CheckCircle,
          text: 'Activo'
        }
      case 'INACTIVO':
        return {
          color: "bg-yellow-100 text-yellow-700",
          icon: AlertTriangle,
          text: 'Inactivo'
        }
      case 'ELIMINADO':
        return {
          color: "bg-red-100 text-red-700",
          icon: XCircle,
          text: 'Eliminado'
        }
      default:
        return {
          color: "bg-gray-100 text-gray-700",
          icon: AlertTriangle,
          text: 'Desconocido'
        }
    }
  }

  const getStockStatus = (producto: Producto) => {
    if (producto.stock === 0) return { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Agotado' }
    if (producto.stock <= producto.stockMinimo) return { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle, text: 'Crítico' }
    if (producto.stock > producto.stockMinimo * 3) return { color: 'bg-yellow-100 text-yellow-700', icon: TrendingUp, text: 'Alto' }
    return { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Normal' }
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !proveedor) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar el proveedor</h2>
            <p className="text-gray-600 mb-4">{error || 'Proveedor no encontrado'}</p>
            <VolverAtras href="/dashboard/proveedores" label="Volver a proveedores" />
          </div>
        </div>
      </div>
    )
  }

  const estadoInfo = getEstadoInfo(proveedor.estado)
  const EstadoIcon = estadoInfo.icon

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <VolverAtras href="/dashboard/proveedores" label="Volver a proveedores" />
        </div>

        {/* Mostrar errores */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del proveedor */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-800">{proveedor.nombre}</h1>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${estadoInfo.color}`}>
                    <EstadoIcon className="w-4 h-4 inline mr-1" />
                    {estadoInfo.text}
                  </div>
                </div>

                <div className="space-y-4">
                  {proveedor.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{proveedor.email}</span>
                    </div>
                  )}
                  
                  {proveedor.telefono && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{proveedor.telefono}</span>
                    </div>
                  )}

                  {(proveedor as any).direccion && (
                    <div className="flex items-start gap-3">
                      <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">{(proveedor as any).direccion}</span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setProveedorEdit(proveedor)
                      setShowEditModal(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={eliminarProveedor}
                    disabled={eliminando}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {eliminando ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Productos del proveedor */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Productos de este proveedor</h2>
                  <Link
                    href="/dashboard/productos/nuevo"
                    className="flex items-center gap-2 px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar producto
                  </Link>
                </div>

                {/* Filtros */}
                <div className="mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        label=""
                        name="filtroProductos"
                        type="text"
                        placeholder="Buscar productos..."
                        value={filtroProductos}
                        onChange={(e) => setFiltroProductos(e.target.value)}
                        className="pl-9 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Lista de productos */}
                {productosLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : productos.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay productos</h3>
                    <p className="text-gray-500 mb-4">Este proveedor no tiene productos registrados.</p>
                    <Link
                      href="/dashboard/productos/nuevo"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar primer producto
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {productos.map((producto) => {
                        const stockStatus = getStockStatus(producto)
                        const StockIcon = stockStatus.icon

                        return (
                          <Card key={producto.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-gray-800 line-clamp-2">{producto.nombre}</h3>
                                <Link
                                  href={`/dashboard/productos/${producto.id}`}
                                  className="text-[#8E94F2] hover:text-[#7278e0] transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${stockStatus.color}`}>
                                  <StockIcon className="w-3 h-3" />
                                  {producto.stock} {producto.unidad}
                                </span>
                              </div>
                              
                              <div className="flex justify-between text-sm text-gray-600">
                                <span>Precio: ${producto.precioVenta}</span>
                                <span>Stock min: {producto.stockMinimo}</span>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    {/* Paginación */}
                    {totalProductos > itemsPorPagina && (
                      <Pagination
                        pagina={paginaProductos}
                        totalPaginas={Math.ceil(totalProductos / itemsPorPagina)}
                        onPageChange={setPaginaProductos}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      <ProveedorFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setProveedorEdit(null)
        }}
        proveedor={proveedorEdit}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
} 