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
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Proveedor } from '@/types/proveedor'
import { Producto } from '@/types/producto'
import { useUser } from '@/lib/useUser'
import { cn } from '@/lib/utils'
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

export default function DetalleProveedorPage() {
  const params = useParams()
  const router = useRouter()
  const { data: user } = useUser()
  
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
          icon: XCircle,
          text: 'Desconocido'
        }
    }
  }

  const getStockStatus = (producto: Producto) => {
    if (producto.stock === 0) return { color: 'bg-red-100 text-red-700', text: 'Agotado' }
    if (producto.stock <= producto.stockMinimo) return { color: 'bg-orange-100 text-orange-700', text: 'Crítico' }
    return { color: 'bg-green-100 text-green-700', text: 'Disponible' }
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!proveedor) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Proveedor no encontrado</h2>
            <p className="text-gray-600 mb-6">El proveedor que buscas no existe o ha sido eliminado.</p>
            <VolverAtras href="/dashboard/proveedores" label="Volver a proveedores" />
          </div>
        </div>
      </div>
    )
  }

  const estadoInfo = getEstadoInfo(proveedor.estado)
  const EstadoIcon = estadoInfo.icon
  const isAdmin = user?.rol === 'ADMIN' || user?.rol === 'SUPERADMIN'

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Mensajes de error */}
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
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <VolverAtras href="/dashboard/proveedores" label="Volver a proveedores" />
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{proveedor.nombre}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full font-medium",
                  estadoInfo.color
                )}>
                  <EstadoIcon className="w-4 h-4" />
                  {estadoInfo.text}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isAdmin && proveedor.estado !== 'ELIMINADO' && (
                <button
                  onClick={eliminarProveedor}
                  disabled={eliminando}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
              )}
              <button
                onClick={() => {
                  setProveedorEdit(proveedor)
                  setShowEditModal(true)
                }}
                className="flex items-center gap-2 px-6 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            </div>
          </div>
        </div>

        {/* Información del proveedor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Información de contacto</h2>
              <div className="space-y-4">
                {proveedor.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{proveedor.email}</p>
                    </div>
                  </div>
                )}
                {proveedor.telefono && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">{proveedor.telefono}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Estadísticas</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Productos asociados</p>
                    <p className="font-medium text-2xl">{totalProductos}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Productos del proveedor */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Productos asociados</h2>
              <Link
                href="/dashboard/productos/nuevo"
                className="flex items-center gap-2 px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Nuevo producto
              </Link>
            </div>

            {/* Filtros */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={filtroProductos}
                  onChange={(e) => setFiltroProductos(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Lista de productos */}
            {productosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay productos asociados</h3>
                <p className="text-gray-500 mb-6">Este proveedor no tiene productos registrados.</p>
                <Link
                  href="/dashboard/productos/nuevo"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Agregar primer producto
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {productos.map((producto) => {
                    const stockStatus = getStockStatus(producto)
                    return (
                      <Card 
                        key={producto.id} 
                        className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm"
                        onClick={() => router.push(`/dashboard/productos/${producto.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-gray-800 line-clamp-2 flex-1 pr-2">{producto.nombre}</h3>
                            <Link
                              href={`/dashboard/productos/${producto.id}`}
                              className="flex items-center gap-1 text-sm text-[#8E94F2] hover:text-[#7278e0] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Link>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Stock:</span>
                              <span className={cn(
                                "px-2 py-1 text-xs rounded-full font-medium",
                                stockStatus.color
                              )}>
                                {producto.stock} {producto.unidad}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Precio venta:</span>
                              <span className="font-medium">${producto.precioVenta.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Estado:</span>
                              <span className={cn(
                                "px-2 py-1 text-xs rounded-full font-medium",
                                producto.estado === 'ACTIVO' 
                                  ? "bg-green-100 text-green-700" 
                                  : producto.estado === 'INACTIVO'
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              )}>
                                {producto.estado === 'ACTIVO' ? 'Activo' : producto.estado === 'INACTIVO' ? 'Inactivo' : 'Eliminado'}
                              </span>
                            </div>
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

        {/* Modal de edición */}
        <ProveedorFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setProveedorEdit(null)
          }}
          onSuccess={handleEditSuccess}
          proveedor={proveedorEdit}
        />
      </div>
    </div>
  )
} 