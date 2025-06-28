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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
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
          <button
            onClick={onAgregarProveedor}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E94F2] text-white rounded-lg hover:bg-[#7278e0] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar primer proveedor
          </button>
        )}
      </div>
    </div>
  )
} 