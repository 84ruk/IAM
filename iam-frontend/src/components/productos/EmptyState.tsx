import React from 'react'
import { Package, Plus } from 'lucide-react'

interface EmptyStateProps {
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
  onAgregarProducto: () => void
}

export default function EmptyState({
  hayFiltrosActivos,
  onLimpiarFiltros,
  onAgregarProducto
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
      <div className="text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {hayFiltrosActivos ? 'No se encontraron productos' : 'No hay productos registrados'}
        </h3>
        <p className="text-gray-600 mb-6">
          {hayFiltrosActivos 
            ? 'Intenta ajustar los filtros de búsqueda para encontrar productos.'
            : 'Comienza agregando tu primer producto al inventario.'
          }
        </p>
        {hayFiltrosActivos ? (
          <button
            onClick={onLimpiarFiltros}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpiar filtros
          </button>
        ) : (
          <button
            onClick={onAgregarProducto}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar primer producto
          </button>
        )}
      </div>
    </div>
  )
} 