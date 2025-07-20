'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectAdvanced'
import { Badge } from '@/components/ui/Badge'
import { 
  Filter, 
  X, 
  Save, 
  Download, 
  Upload, 
  RefreshCw,
  Calendar,
  Package,
  Truck,
  Activity,
  DollarSign,
  Users,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useDailyMovementsFilters } from '@/hooks/useDailyMovementsFilters'
import { DailyMovementsFilters as FiltersType, FilterPreset } from '@/types/filters'

interface DailyMovementsFiltersProps {
  className?: string
  onFiltersChange?: (filters: FiltersType) => void
  showAdvanced?: boolean
  collapsible?: boolean
}

export default function DailyMovementsFilters({
  className = '',
  onFiltersChange,
  showAdvanced = false,
  collapsible = true
}: DailyMovementsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible)
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetDescription, setPresetDescription] = useState('')

  const {
    filters,
    filterOptions,
    isLoadingOptions,
    presets,
    activePreset,
    hasActiveFilters,
    getFilterSummary,
    updateFilters,
    resetFilters,
    applyPreset,
    savePreset,
    deletePreset,
    exportFilters,
    importFilters
  } = useDailyMovementsFilters({
    onFiltersChange
  })

  // Manejar cambio de filtros
  const handleFilterChange = (key: keyof FiltersType, value: any) => {
    // Validación básica de tipos
    if (value === undefined || value === null) {
      updateFilters({ [key]: undefined })
      return
    }

    // Validación específica por tipo
    switch (key) {
      case 'period':
        if (typeof value === 'string' && ['7d', '15d', '30d', '60d', '90d', 'custom'].includes(value)) {
          updateFilters({ [key]: value as '7d' | '15d' | '30d' | '60d' | '90d' | 'custom' })
        }
        break
      case 'chartType':
        if (typeof value === 'string' && ['line', 'bar', 'area', 'combined'].includes(value)) {
          updateFilters({ [key]: value as 'line' | 'bar' | 'area' | 'combined' })
        }
        break
      case 'productIds':
      case 'supplierIds':
      case 'userIds':
        if (Array.isArray(value) && value.every(v => typeof v === 'number')) {
          updateFilters({ [key]: value as number[] })
        }
        break
      case 'movementTypes':
        if (Array.isArray(value) && value.every(v => ['ENTRADA', 'SALIDA'].includes(v))) {
          updateFilters({ [key]: value as ('ENTRADA' | 'SALIDA')[] })
        }
        break
      case 'minValue':
      case 'maxValue':
      case 'minQuantity':
      case 'maxQuantity':
        if (typeof value === 'number' && isFinite(value)) {
          updateFilters({ [key]: value as number })
        }
        break
      default:
        updateFilters({ [key]: value })
    }
  }

  // Manejar guardar preset
  const handleSavePreset = () => {
    if (presetName.trim()) {
      savePreset(presetName.trim(), presetDescription.trim())
      setPresetName('')
      setPresetDescription('')
      setShowSavePreset(false)
    }
  }

  // Manejar importar filtros
  const handleImportFilters = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        importFilters(content)
      }
      reader.readAsText(file)
    }
  }

  // Renderizar filtros básicos
  const renderBasicFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Período */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Período
        </label>
        <Select
          value={filters.period}
          onValueChange={(value) => handleFilterChange('period', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="15d">Últimos 15 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="60d">Últimos 60 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tipo de Gráfica */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Gráfica
        </label>
        <Select
          value={filters.chartType}
          onValueChange={(value) => handleFilterChange('chartType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Líneas</SelectItem>
            <SelectItem value="bar">Barras</SelectItem>
            <SelectItem value="area">Áreas</SelectItem>
            <SelectItem value="combined">Combinada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agrupar por */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Agrupar por
        </label>
        <Select
          value={filters.groupBy}
          onValueChange={(value) => handleFilterChange('groupBy', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Día</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mes</SelectItem>
            <SelectItem value="product">Producto</SelectItem>
            <SelectItem value="supplier">Proveedor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ordenar por */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ordenar por
        </label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => handleFilterChange('sortBy', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Fecha</SelectItem>
            <SelectItem value="quantity">Cantidad</SelectItem>
            <SelectItem value="value">Valor</SelectItem>
            <SelectItem value="product">Producto</SelectItem>
            <SelectItem value="supplier">Proveedor</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  // Renderizar filtros avanzados
  const renderAdvancedFilters = () => (
    <div className="space-y-6">
      {/* Filtros de Producto */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Productos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Productos específicos
            </label>
            <Select
              value=""
              onValueChange={(value) => {
                const currentIds = filters.productIds || []
                if (!currentIds.includes(parseInt(value))) {
                  handleFilterChange('productIds', [...currentIds, parseInt(value)])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.products.map((product) => (
                  <SelectItem key={product.value} value={product.value.toString()}>
                    {product.label} ({product.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Productos seleccionados */}
            {filters.productIds && filters.productIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.productIds.map((id) => {
                  const product = filterOptions?.products.find(p => p.value === id)
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {product?.label || `Producto ${id}`}
                      <button
                        onClick={() => {
                          const newIds = filters.productIds?.filter(pid => pid !== id) || []
                          handleFilterChange('productIds', newIds)
                        }}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorías
            </label>
            <Select
              value=""
              onValueChange={(value) => {
                const currentCategories = filters.productCategories || []
                if (!currentCategories.includes(value)) {
                  handleFilterChange('productCategories', [...currentCategories, value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.categories.map((category) => (
                  <SelectItem key={category.value} value={category.value.toString()}>
                    {category.label} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filtros de Proveedor */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Proveedores
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedores específicos
            </label>
            <Select
              value=""
              onValueChange={(value) => {
                const currentIds = filters.supplierIds || []
                if (!currentIds.includes(parseInt(value))) {
                  handleFilterChange('supplierIds', [...currentIds, parseInt(value)])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.suppliers.map((supplier) => (
                  <SelectItem key={supplier.value} value={supplier.value.toString()}>
                    {supplier.label} ({supplier.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filtros de Movimiento */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Tipos de Movimiento
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <div className="space-y-2">
              {['ENTRADA', 'SALIDA'].map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.movementTypes?.includes(type as 'ENTRADA' | 'SALIDA') || false}
                    onChange={(e) => {
                      const currentTypes = filters.movementTypes || []
                      if (e.target.checked) {
                        handleFilterChange('movementTypes', [...currentTypes, type as 'ENTRADA' | 'SALIDA'])
                      } else {
                        handleFilterChange('movementTypes', currentTypes.filter(t => t !== type))
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivos
            </label>
            <Select
              value=""
              onValueChange={(value) => {
                const currentReasons = filters.movementReasons || []
                if (!currentReasons.includes(value)) {
                  handleFilterChange('movementReasons', [...currentReasons, value])
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.reasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value.toString()}>
                    {reason.label} ({reason.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filtros de Valor */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Rango de Valores
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor mínimo
            </label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minValue || ''}
              onChange={(e) => handleFilterChange('minValue', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor máximo
            </label>
            <Input
              type="number"
              placeholder="1000000"
              value={filters.maxValue || ''}
              onChange={(e) => handleFilterChange('maxValue', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad mínima
            </label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minQuantity || ''}
              onChange={(e) => handleFilterChange('minQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad máxima
            </label>
            <Input
              type="number"
              placeholder="1000"
              value={filters.maxQuantity || ''}
              onChange={(e) => handleFilterChange('maxQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros Avanzados
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {getFilterSummary()}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Presets */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Presets Rápidos</h4>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={activePreset?.id === preset.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(preset.id)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtros básicos */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Configuración Básica</h4>
            {renderBasicFilters()}
          </div>

          {/* Filtros avanzados */}
          {showAdvanced && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Filtros Avanzados</h4>
              {isLoadingOptions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  <span>Cargando opciones...</span>
                </div>
              ) : (
                renderAdvancedFilters()
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavePreset(true)}
              >
                <Save className="w-4 h-4 mr-1" />
                Guardar Preset
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const dataStr = exportFilters()
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `filtros-movimientos-${new Date().toISOString().split('T')[0]}.json`
                  link.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFilters}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  Importar
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {hasActiveFilters ? `${getFilterSummary()}` : 'Sin filtros aplicados'}
            </div>
          </div>

          {/* Modal para guardar preset */}
          {showSavePreset && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">Guardar Preset</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del preset
                    </label>
                    <Input
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Mi preset personalizado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (opcional)
                    </label>
                    <Input
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      placeholder="Descripción del preset"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowSavePreset(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
} 