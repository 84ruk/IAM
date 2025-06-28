import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Package, AlertTriangle, TrendingUp, DollarSign, Calendar, CheckCircle, XCircle, Tag, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Producto } from '@/types/producto'
import { TipoProductoConfig } from '@/types/enums'
import ProductTypeIcon from '@/components/ui/ProductTypeIcon'
import EtiquetaTag from '@/components/ui/EtiquetaTag'
import StockInfoModal from '@/components/ui/StockInfoModal'
import VolverAtras from '@/components/ui/VolverAtras'
import Link from 'next/link'
import { requireAuth } from '@/lib/ssrAuth'

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

export default async function DetalleProductoPage() {
  const user = await requireAuth()
  if (!user) return null

  const params = useParams()
  const router = useRouter()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    const cargarProducto = async () => {
      try {
        setIsLoading(true)
        const data = await fetcher(`/productos/${params.id}`)
        setProducto(data)
      } catch (err) {
        setError('Error al cargar el producto')
        console.error('Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      cargarProducto()
    }
  }, [params.id])

  const eliminarProducto = async () => {
    if (!producto || !confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción lo ocultará del inventario pero podrás restaurarlo desde la papelera.')) {
      return
    }

    try {
      setEliminando(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${producto.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el producto')
      }

      router.push('/dashboard/productos')
    } catch (error) {
      setError('Error al eliminar el producto')
    } finally {
      setEliminando(false)
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

  if (error || !producto) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar el producto</h2>
            <p className="text-gray-600 mb-4">{error || 'Producto no encontrado'}</p>
            <VolverAtras href="/dashboard/productos" label="Volver a productos" />
          </div>
        </div>
      </div>
    )
  }

  const stockStatus = getStockStatus(producto)
  const margen = getMargen(producto)

  return (
    <div className="p-6 bg-[#F8F9FB] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <VolverAtras href="/dashboard/productos" label="Volver a productos" />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imagen del producto */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <ProductTypeIcon tipoProducto={producto.tipoProducto} size="lg" />
            </div>
          </div>

          {/* Información del producto */}
          <div className="space-y-6">
            {/* Título y etiqueta */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-800">{producto.nombre}</h1>
                {producto.etiqueta && <EtiquetaTag etiqueta={producto.etiqueta} />}
              </div>
              <p className="text-gray-600">{producto.descripcion}</p>
            </div>

            {/* Estado del stock */}
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.badge}`}>
                <stockStatus.icon className="w-4 h-4 inline mr-1" />
                {stockStatus.text}
              </div>
              <span className="text-gray-600">
                {producto.stock} {producto.unidad}
              </span>
            </div>

            {/* Información de precios */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Precio de venta</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">${producto.precioVenta}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Precio de compra</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">${producto.precioCompra}</p>
                </CardContent>
              </Card>
            </div>

            {/* Margen de ganancia */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Margen de ganancia</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{margen.toFixed(1)}%</p>
              </CardContent>
            </Card>

            {/* Información adicional */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="w-4 h-4" />
                <span>SKU: {producto.sku || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="w-4 h-4" />
                <span>Stock mínimo: {producto.stockMinimo} {producto.unidad}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Creado: {new Date(producto.creadoEn).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón flotante de editar */}
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href={`/dashboard/productos/${params.id}/editar`}
            className="flex items-center gap-2 px-6 py-3 bg-[#8E94F2] text-white rounded-full shadow-lg hover:bg-[#7278e0] transition-all duration-200 hover:shadow-xl"
          >
            <Edit className="w-5 h-5" />
            Editar
          </Link>
        </div>

        {/* Modal de información de stock */}
        <StockInfoModal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          producto={{
            nombre: producto.nombre,
            stock: producto.stock,
            stockMinimo: producto.stockMinimo,
            unidad: producto.unidad
          }}
        />
      </div>
    </div>
  )
} 