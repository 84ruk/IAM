'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import FormularioProducto from '@/components/productos/FormularioProducto'
import StockInfoModal from '@/components/ui/StockInfoModal'
import { Producto } from '@/types/producto'
import VolverAtras from '@/components/ui/VolverAtras'
import Link from 'next/link'
import { Eye } from 'lucide-react'

export default function EditarProductoClient() {
  const params = useParams()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducto = async () => {
      if (!params.id) return
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${params.id}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProducto(data)
          
          // Mostrar modal automáticamente si el stock está bajo
          if (data.stock <= data.stockMinimo) {
            setShowStockModal(true)
          }
        }
      } catch (error) {
        console.error('Error al cargar el producto:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducto()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <VolverAtras href={`/dashboard/productos/${params.id}`} label="Volver a detalles" />
        <Link
          href={`/dashboard/productos/${params.id}`}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#8E94F2] hover:border-[#8E94F2] transition-colors text-sm shadow-sm"
          title="Ver detalles del producto"
        >
          <Eye className="w-4 h-4" />
          Ver detalles
        </Link>
      </div>

      
      <FormularioProducto />
      
      {/* Modal de información de stock */}
      <StockInfoModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        producto={producto ? {
          nombre: producto.nombre,
          stock: producto.stock,
          stockMinimo: producto.stockMinimo,
          unidad: producto.unidad
        } : null}
      />
    </div>
  )
} 