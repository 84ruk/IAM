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
  Eye,
  TrendingUp,
  X,
  UserPlus
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
  const [showAddProductsModal, setShowAddProductsModal] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [proveedorEdit, setProveedorEdit] = useState<Proveedor | null>(null)
  const [asignandoProductos, setAsignandoProductos] = useState<number[]>([])
  const [filtroProductosSinProveedor, setFiltroProductosSinProveedor] = useState('')

  const itemsPorPagina = 8

  // Obtener productos sin proveedor
  const { data: productosSinProveedor, mutate: mutateProductosSinProveedor } = useSWR<Producto[]>('/productos/sin-proveedor', fetcher)

  // Productos sin proveedor filtrados
  const productosSinProveedorFiltrados = useMemo(() => {
    if (!productosSinProveedor) return []
    
    if (filtroProductosSinProveedor) {
      return productosSinProveedor.filter(producto =>
        producto.nombre.toLowerCase().includes(filtroProductosSinProveedor.toLowerCase()) ||
        producto.etiquetas?.some(etiqueta => etiqueta.toLowerCase().includes(filtroProductosSinProveedor.toLowerCase()))
      )
    }
    
    return productosSinProveedor
  }, [productosSinProveedor, filtroProductosSinProveedor])

  // Función para mostrar errores
  const mostrarError = (mensaje: string) => {
    setError(mensaje)
    setTimeout(() => setError(null), 5000)
  }

  // Cargar proveedor
  useEffect(() => {
    const fetchProveedor = async () => {
      if (!params?.id) return
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proveedores/${params?.id}`, {
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
  }, [params?.id])

  // Cargar productos del proveedor
  useEffect(() => {
    const fetchProductos = async () => {
      if (!params?.id) return
      
      try {
        setProductosLoading(true)
        const searchParams = new URLSearchParams()
        searchParams.set('proveedorId', params?.id as string)
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
  }, [params?.id, paginaProductos, filtroProductos])

  // Asignar productos al proveedor
  const asignarProductos = async () => {
    if (asignandoProductos.length === 0) return
    
    try {
      const promises = asignandoProductos.map(productoId =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${productoId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            proveedorId: parseInt(params?.id as string)
          })
        })
      )

      await Promise.all(promises)
      
      mostrarError('Productos asignados exitosamente')
      setShowAddProductsModal(false)
      setAsignandoProductos([])
      
      // Recargar datos
      mutateProductosSinProveedor()
      window.location.reload() // Recargar productos del proveedor
    } catch (error) {
      console.error('Error al asignar productos:', error)
      mostrarError('Error al asignar productos')
    }
  }

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
    if (producto.stockMinimo && producto.stock <= producto.stockMinimo) return { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle, text: 'Crítico' }
    if (producto.stockMinimo && producto.stock > producto.stockMinimo * 3) return { color: 'bg-yellow-100 text-yellow-700', icon: TrendingUp, text: 'Alto' }
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

                  {(proveedor as { direccion?: string }).direccion && (
                    <div className="flex items-start gap-3">
                      <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">{(proveedor as { direccion?: string }).direccion}</span>
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
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowAddProductsModal(true)}
                      className="text-gray-700 font-semibold bg-transparent border-none shadow-none px-0 py-0 hover:underline hover:text-[#8E94F2] transition-colors"
                      style={{ minWidth: 'unset' }}
                    >
                      <UserPlus className="w-4 h-4 inline-block mr-1 align-text-bottom" />
                      Asignar productos
                    </button>
                    <Link
                      href="/dashboard/productos/nuevo"
                      className="flex items-center gap-2 px-4 py-2 bg-[#8E94F2] text-white font-semibold rounded-xl shadow-sm hover:bg-[#7278e0] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar producto
                    </Link>
                  </div>
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
                        currentPage={paginaProductos}
                        totalPages={Math.ceil(totalProductos / itemsPorPagina)}
                        totalItems={totalProductos}
                        itemsPerPage={itemsPorPagina}
                        startIndex={(paginaProductos - 1) * itemsPorPagina}
                        endIndex={Math.min(paginaProductos * itemsPorPagina, totalProductos)}
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

      {/* Modal para asignar productos */}
      {showAddProductsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Asignar productos a {proveedor.nombre}</h2>
                <p className="text-sm text-gray-600 mt-1">Selecciona los productos que deseas asignar a este proveedor</p>
              </div>
              <button
                onClick={() => {
                  setShowAddProductsModal(false)
                  setAsignandoProductos([])
                  setFiltroProductosSinProveedor('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Búsqueda */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar productos sin proveedor..."
                    value={filtroProductosSinProveedor}
                    onChange={(e) => setFiltroProductosSinProveedor(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Lista de productos sin proveedor */}
              <div className="max-h-96 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {productosSinProveedorFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 col-span-full">
                    <Package className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {filtroProductosSinProveedor 
                        ? 'No se encontraron productos' 
                        : 'No hay productos sin proveedor'
                      }
                    </h3>
                    <p className="text-gray-600 text-center">
                      {filtroProductosSinProveedor 
                        ? 'Intenta con otros términos de búsqueda' 
                        : 'Todos los productos ya tienen un proveedor asignado'
                      }
                    </p>
                  </div>
                ) : (
                  productosSinProveedorFiltrados.map((producto) => {
                    const stockStatus = getStockStatus(producto)
                    const StockIcon = stockStatus.icon
                    const isSelected = asignandoProductos.includes(producto.id)

                    return (
                      <div
                        key={producto.id}
                        className={`bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2 border transition-all duration-200 cursor-pointer ${
                          isSelected ? 'ring-2 ring-[#8E94F2] border-[#8E94F2] bg-[#F5F7FF]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setAsignandoProductos(prev => prev.filter(id => id !== producto.id))
                          } else {
                            setAsignandoProductos(prev => [...prev, producto.id])
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 text-base line-clamp-1">{producto.nombre}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${stockStatus.color}`}>
                            <StockIcon className="w-3 h-3" />
                            {stockStatus.text}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Stock: <span className="font-medium text-gray-900">{producto.stock} {producto.unidad}</span></span>
                          <span>Precio: <span className="font-medium text-gray-900">${producto.precioVenta}</span></span>
                        </div>
                        {producto.etiquetas && producto.etiquetas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {producto.etiquetas.map((etiqueta, index) => (
                              <span 
                                key={index}
                                className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200"
                              >
                                {etiqueta}
                              </span>
                            ))}
                          </div>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-1 mt-2 text-[#8E94F2] font-medium text-xs">
                            <CheckCircle className="w-4 h-4" /> Seleccionado
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {asignandoProductos.length > 0 
                  ? `${asignandoProductos.length} producto(s) seleccionado(s)`
                  : 'Selecciona productos para asignar'
                }
              </div>
              <div className="flex gap-6">
                <button
                  onClick={() => {
                    setShowAddProductsModal(false)
                    setAsignandoProductos([])
                    setFiltroProductosSinProveedor('')
                  }}
                  className="text-gray-600 hover:text-gray-800 hover:underline transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={asignarProductos}
                  disabled={asignandoProductos.length === 0}
                  className="text-[#8E94F2] hover:text-[#7278e0] hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Asignar {asignandoProductos.length > 0 && `(${asignandoProductos.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de proveedor */}
      {showEditModal && proveedorEdit && (
        <ProveedorFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setProveedorEdit(null)
          }}
          proveedor={proveedorEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
} 