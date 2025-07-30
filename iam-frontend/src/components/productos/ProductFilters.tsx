import React from 'react'
import { Search, Filter, X, Loader2 } from 'lucide-react'
import Select from '@/components/ui/Select'
import { TipoProductoConfig, TipoProducto } from '@/types/enums'

interface ProductFiltersProps {
  filtroTexto: string
  setFiltroTexto: (value: string) => void
  filtroEtiqueta: string
  setFiltroEtiqueta: (value: string) => void
  filtroTipoProducto: string
  setFiltroTipoProducto: (value: string) => void
  filtroEstado: 'ACTIVO' | 'INACTIVO' | 'ELIMINADO' | ''
  setFiltroEstado: (value: 'ACTIVO' | 'INACTIVO' | 'ELIMINADO' | '') => void
  mostrarAgotados: boolean
  setMostrarAgotados: (value: boolean) => void
  mostrarFiltros: boolean
  setMostrarFiltros: (value: boolean) => void
  etiquetasUnicas: string[]
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
  isSearching?: boolean // Nuevo prop para indicar si está buscando
}

export default function ProductFilters({
  filtroTexto,
  setFiltroTexto,
  filtroEtiqueta,
  setFiltroEtiqueta,
  filtroTipoProducto,
  setFiltroTipoProducto,
  filtroEstado,
  setFiltroEstado,
  mostrarAgotados,
  setMostrarAgotados,
  mostrarFiltros,
  setMostrarFiltros,
  etiquetasUnicas,
  hayFiltrosActivos,
  onLimpiarFiltros,
  isSearching = false
}: ProductFiltersProps) {
  const tiposProducto = Object.values(TipoProducto)

  return (
    <div>
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

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isSearching && (
            <Loader2 className="w-4 h-4 text-[#8E94F2] animate-spin" />
          )}
          {filtroTexto && !isSearching && (
            <button
              onClick={() => setFiltroTexto('')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Indicador de búsqueda en progreso */}
      {isSearching && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Buscando productos...</span>
          </div>
        </div>
      )}

      {/* Filtros avanzados colapsables */}
      {mostrarFiltros && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por etiqueta */}
          <div>
            <Select
              label="Etiqueta"
              value={filtroEtiqueta}
              onChange={(e) => setFiltroEtiqueta(e.target.value)}
              options={[
                { value: '', label: 'Todas las etiquetas' },
                ...etiquetasUnicas.map(etiqueta => ({
                  value: etiqueta,
                  label: etiqueta
                }))
              ]}
              className="mb-0"
            />
          </div>

          {/* Filtro por tipo de producto */}
          <div>
            <Select
              label="Tipo de producto"
              value={filtroTipoProducto}
              onChange={(e) => setFiltroTipoProducto(e.target.value)}
              options={[
                { value: '', label: 'Todos los tipos' },
                ...tiposProducto.map(tipo => ({
                  value: tipo,
                  label: TipoProductoConfig[tipo as keyof typeof TipoProductoConfig]?.label || tipo
                }))
              ]}
              className="mb-0"
            />
          </div>

          {/* Filtro por estado */}
          <div>
            <Select
              label="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'ACTIVO' | 'INACTIVO' | 'ELIMINADO' | '')}
              options={[
                { value: 'ACTIVO', label: 'Activos' },
                { value: 'INACTIVO', label: 'Inactivos' },
                { value: 'ELIMINADO', label: 'Eliminados' },
                { value: '', label: 'Todos los estados' }
              ]}
              className="mb-0"
            />
          </div>

          {/* Filtro por productos agotados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="agotados"
                checked={mostrarAgotados}
                onChange={(e) => setMostrarAgotados(e.target.checked)}
                className="w-4 h-4 text-[#8E94F2] border-gray-300 rounded focus:ring-[#8E94F2] focus:ring-2"
              />
              <label htmlFor="agotados" className="ml-2 text-sm text-gray-700">
                Solo productos agotados
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 