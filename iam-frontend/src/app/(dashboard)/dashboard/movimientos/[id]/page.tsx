'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  Hash,
  User,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Tag,
  Eye,
  FileText,
  MessageCircle,
  RotateCcw
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { MovimientoDetalle } from '@/types/movimiento'
import { useUser } from '@/lib/useUser'
import { cn } from '@/lib/utils'
import VolverAtras from '@/components/ui/VolverAtras'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }).then((res) => {
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
    return res.json()
  })

export default function DetalleMovimientoPage() {
  const params = useParams()
  const router = useRouter()
  const { data: user } = useUser()
  
  const [movimiento, setMovimiento] = useState<MovimientoDetalle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    const cargarMovimiento = async () => {
      if (!params.id) return
      
      try {
        setIsLoading(true)
        const data = await fetcher(`${process.env.NEXT_PUBLIC_API_URL}/movimientos/${params.id}`)
        setMovimiento(data)
      } catch (error) {
        console.error('Error al cargar el movimiento:', error)
        setError('Error al cargar el movimiento')
      } finally {
        setIsLoading(false)
      }
    }

    cargarMovimiento()
  }, [params.id])

  const eliminarMovimiento = async () => {
    if (!movimiento || !confirm('¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setEliminando(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movimientos/${movimiento.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el movimiento')
      }

      router.push('/dashboard/movimientos')
    } catch (error) {
      console.error('Error al eliminar:', error)
      setError('Error al eliminar el movimiento')
    } finally {
      setEliminando(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es })
  }

  const getTipoInfo = (tipo: 'ENTRADA' | 'SALIDA') => {
    return tipo === 'ENTRADA' 
      ? { 
          color: 'bg-green-100 text-green-700', 
          icon: TrendingUp, 
          text: 'Entrada',
          bgColor: 'bg-green-50 border-green-200'
        }
      : { 
          color: 'bg-red-100 text-red-700', 
          icon: TrendingDown, 
          text: 'Salida',
          bgColor: 'bg-red-50 border-red-200'
        }
  }

  const getStockStatus = (stock: number, stockMinimo: number) => {
    if (stock === 0) return { color: 'bg-red-100 text-red-700', text: 'Agotado' }
    if (stock <= stockMinimo) return { color: 'bg-orange-100 text-orange-700', text: 'Crítico' }
    return { color: 'bg-green-100 text-green-700', text: 'Disponible' }
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
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

  if (error || !movimiento) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar el movimiento</h2>
            <p className="text-gray-600 mb-4">{error || 'Movimiento no encontrado'}</p>
            <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
          </div>
        </div>
      </div>
    )
  }

  const tipoInfo = getTipoInfo(movimiento.tipo)
  const TipoIcon = tipoInfo.icon
  const stockStatus = getStockStatus(movimiento.producto.stock, movimiento.producto.stockMinimo)
  const isAdmin = user?.rol === 'ADMIN' || user?.rol === 'SUPERADMIN'

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <VolverAtras href="/dashboard/movimientos" label="Volver a movimientos" />
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Movimiento #{movimiento.id}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full font-medium",
                  tipoInfo.color
                )}>
                  <TipoIcon className="w-4 h-4" />
                  {tipoInfo.text}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">{formatearFecha(movimiento.fecha)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={eliminarMovimiento}
                  disabled={eliminando}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
              )}
              <Link
                href={`/dashboard/movimientos/${movimiento.id}/editar`}
                className="flex items-center gap-2 px-6 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Link>
            </div>
          </div>
        </div>

        {/* Información principal del movimiento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Detalles del movimiento */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalles del Movimiento</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cantidad</p>
                    <p className="font-medium text-lg">{movimiento.cantidad} {movimiento.producto.unidad}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha y hora</p>
                    <p className="font-medium">{formatearFecha(movimiento.fecha)}</p>
                  </div>
                </div>

                {movimiento.motivo && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Motivo</p>
                      <p className="font-medium">{movimiento.motivo}</p>
                    </div>
                  </div>
                )}

                {movimiento.descripcion && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Descripción</p>
                      <p className="font-medium italic">{movimiento.descripcion}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información del producto */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Producto</h2>
                <Link
                  href={`/dashboard/productos/${movimiento.producto.id}`}
                  className="flex items-center gap-1 text-sm text-[#8E94F2] hover:text-[#7278e0] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver detalles
                </Link>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">{movimiento.producto.nombre}</h3>
                  {movimiento.producto.descripcion && (
                    <p className="text-gray-600 text-sm mb-3">{movimiento.producto.descripcion}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Stock actual</p>
                    <span className={cn(
                      "inline-flex px-2 py-1 text-xs rounded-full font-medium",
                      stockStatus.color
                    )}>
                      {movimiento.producto.stock} {movimiento.producto.unidad}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stock mínimo</p>
                    <p className="font-medium">{movimiento.producto.stockMinimo} {movimiento.producto.unidad}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Precio compra</p>
                    <p className="font-medium">${movimiento.producto.precioCompra.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precio venta</p>
                    <p className="font-medium">${movimiento.producto.precioVenta.toFixed(2)}</p>
                  </div>
                </div>

                {movimiento.producto.etiqueta && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Etiqueta</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium border border-blue-200">
                      {movimiento.producto.etiqueta}
                    </span>
                  </div>
                )}

                {movimiento.producto.codigoBarras && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Código de barras</p>
                    <p className="font-mono text-sm">{movimiento.producto.codigoBarras}</p>
                  </div>
                )}

                {movimiento.producto.sku && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">SKU</p>
                    <p className="font-mono text-sm">{movimiento.producto.sku}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información del proveedor */}
        {movimiento.producto.proveedor && (
          <Card className="border-0 shadow-sm mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Proveedor</h2>
                <Link
                  href={`/dashboard/proveedores/${movimiento.producto.proveedor.id}`}
                  className="flex items-center gap-1 text-sm text-[#8E94F2] hover:text-[#7278e0] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver detalles
                </Link>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">{movimiento.producto.proveedor.nombre}</h3>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium",
                    movimiento.producto.proveedor.estado === 'ACTIVO' 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {movimiento.producto.proveedor.estado === 'ACTIVO' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {movimiento.producto.proveedor.estado}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {movimiento.producto.proveedor.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{movimiento.producto.proveedor.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {movimiento.producto.proveedor.telefono && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Teléfono</p>
                        <p className="font-medium">{movimiento.producto.proveedor.telefono}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones rápidas */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href={`/dashboard/productos/${movimiento.producto.id}`}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#8E94F2] hover:shadow-md transition-all duration-200"
              >
                <Package className="w-5 h-5 text-[#8E94F2]" />
                <div>
                  <p className="font-medium text-gray-800">Ver Producto</p>
                  <p className="text-sm text-gray-600">Detalles completos</p>
                </div>
              </Link>

              {movimiento.producto.proveedor && (
                <Link
                  href={`/dashboard/proveedores/${movimiento.producto.proveedor.id}`}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#8E94F2] hover:shadow-md transition-all duration-200"
                >
                  <User className="w-5 h-5 text-[#8E94F2]" />
                  <div>
                    <p className="font-medium text-gray-800">Ver Proveedor</p>
                    <p className="text-sm text-gray-600">Información de contacto</p>
                  </div>
                </Link>
              )}

              <Link
                href={`/dashboard/movimientos/nuevo${movimiento.producto.proveedor ? `?proveedorId=${movimiento.producto.proveedor.id}` : ''}`}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#8E94F2] hover:shadow-md transition-all duration-200"
              >
                <RotateCcw className="w-5 h-5 text-[#8E94F2]" />
                <div>
                  <p className="font-medium text-gray-800">Nuevo Movimiento</p>
                  <p className="text-sm text-gray-600">
                    {movimiento.producto.proveedor ? 'Con mismo proveedor' : 'Registrar otro'}
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 