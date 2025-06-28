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
  Plus
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { formatearCantidadConUnidad } from '@/lib/pluralization'
import ProductFormModal from '@/components/ui/ProductFormModal'
import FormularioProducto from '@/components/productos/FormularioProducto'
import VolverAtras from '@/components/ui/VolverAtras'

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
  estado: 'ELIMINADO'
  empresaId: number
  proveedorId?: number
  createdAt: string
  updatedAt: string
  codigoBarras?: string
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
              p.etiqueta?.toLowerCase().includes(filtro.toLowerCase())
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
      {/* ... el resto del render igual que antes ... */}
    </div>
  )
} 