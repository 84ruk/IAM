import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import Select from '@/components/ui/Select'
import { TipoProductoConfig } from '@/types/enums'

interface ProductFiltersProps {
  filtroTexto: string
  setFiltroTexto: (value: string) => void
  filtroEtiqueta: string
  setFiltroEtiqueta: (value: string) => void
  filtroTipoProducto: string
  setFiltroTipoProducto: (value: string) => void
  filtroEstado: 'ACTIVO' | 'INACTIVO' | ''
  setFiltroEstado: (value: 'ACTIVO' | 'INACTIVO' | '') => void
  mostrarAgotados: boolean
  setMostrarAgotados: (value: boolean) => void
  mostrarFiltros: boolean
  setMostrarFiltros: (value: boolean) => void
  etiquetasUnicas: string[]
  hayFiltrosActivos: boolean
  onLimpiarFiltros: () => void
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
  onLimpiarFiltros
}: ProductFiltersProps) {
  const tiposProducto = ['GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO']

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
              onChange={(e) => setFiltroEstado(e.target.value as 'ACTIVO' | 'INACTIVO' | '')}
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'ACTIVO', label: 'Activos' },
                { value: 'INACTIVO', label: 'Inactivos' }
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