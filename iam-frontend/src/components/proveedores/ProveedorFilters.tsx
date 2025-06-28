import React from 'react'
import { Search, Filter, X } from 'lucide-react'

interface ProveedorFiltersProps {
  filtroTexto: string
  setFiltroTexto: (value: string) => void
  filtroEstado: 'ACTIVO' | 'INACTIVO' | ''
  setFiltroEstado: (value: 'ACTIVO' | 'INACTIVO' | '') => void
  mostrarFiltros: boolean
  setMostrarFiltros: (value: boolean) => void
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
}

export default function ProveedorFilters({
  filtroTexto,
  setFiltroTexto,
  filtroEstado,
  setFiltroEstado,
  mostrarFiltros,
  setMostrarFiltros,
  hayFiltrosActivos,
  onLimpiarFiltros
}: ProveedorFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Filtros de búsqueda</h2>
        <div className="flex items-center gap-2">
          {hayFiltrosActivos && (
            <button
              onClick={onLimpiarFiltros}
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition-colors"
            >
              Limpiar filtros
            </button>
          )}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            {mostrarFiltros ? 'Ocultar' : 'Mostrar'} filtros
          </button>
        </div>
      </div>

      {/* Barra de búsqueda siempre visible */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
        />
        {filtroTexto && (
          <button
            onClick={() => setFiltroTexto('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros avanzados colapsables */}
      {mostrarFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'ACTIVO' | 'INACTIVO' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
} 