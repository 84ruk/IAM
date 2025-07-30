'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Edit, Trash2, Package, AlertTriangle, TrendingUp, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Producto } from '@/types/producto'
import ProductTypeIcon from '@/components/ui/ProductTypeIcon'
import EtiquetaTag from '@/components/ui/EtiquetaTag'
import VolverAtras from '@/components/ui/VolverAtras'

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

export default function ProductoDetalleClient() {
  const params = useParams()
  const router = useRouter()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    const cargarProducto = async () => {
      try {
        setIsLoading(true)
        const data = await fetcher(`/productos/${params?.id}`)
        setProducto(data)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (params?.id) {
      cargarProducto()
    }
  }, [params?.id])

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
      console.error('Error al eliminar el producto:', error)
    } finally {
      setEliminando(false)
    }
  }

  const getStockStatus = (producto: Producto) => {
    if (producto.stock === 0) return { color: 'bg-red-100 text-red-700', badge: 'bg-red-100 text-red-700', icon: XCircle, text: 'Agotado' }
    if (producto.stockMinimo && producto.stock <= producto.stockMinimo) return { color: 'bg-orange-100 text-orange-700', badge: 'bg-orange-100 text-orange-700', icon: AlertTriangle, text: 'Crítico' }
    if (producto.stockMinimo && producto.stock > producto.stockMinimo * 3) return { color: 'bg-yellow-100 text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', icon: TrendingUp, text: 'Alto' }
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

  if (!producto) {
    return (
      <div className="p-6 bg-[#F8F9FB] min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Producto no encontrado</h2>
            <p className="text-gray-600 mb-4">El producto que buscas no existe o ha sido eliminado.</p>
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
                {producto.etiquetas && producto.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {producto.etiquetas.map((etiqueta, index) => (
                      <EtiquetaTag key={index} etiqueta={etiqueta} />
                    ))}
                  </div>
                )}
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

            {/* Acciones */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => router.push(`/dashboard/productos/${producto.id}/editar`)}
                className="flex items-center gap-2 px-4 py-2 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={eliminarProducto}
                disabled={eliminando}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 