import React from 'react'
import { Building2, Plus } from 'lucide-react'

interface EmptyStateProps {
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
  onAgregarProveedor: () => void
}

export default function EmptyState({
  hayFiltrosActivos,
  onLimpiarFiltros,
  onAgregarProveedor
}: EmptyStateProps) {
  return (
    <div className="p-12">
      <div className="text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {hayFiltrosActivos ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
        </h3>
        <p className="text-gray-600 mb-6">
          {hayFiltrosActivos 
            ? 'Intenta ajustar los filtros de búsqueda para encontrar proveedores.'
            : 'Comienza agregando tu primer proveedor al sistema.'
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
          <>
          </>
        )}
      </div>
    </div>
  )
} 