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
    <div className="p-12">
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
          null
        )}
      </div>
    </div>
  )
} 