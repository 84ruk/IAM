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
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react'

interface DailyMovementsFiltersProps {
  onFiltersChange: (filters: Record<string, unknown>) => void
  onReset: () => void
  className?: string
}

export default function DailyMovementsFilters({
  onReset,
  className = ''
}: DailyMovementsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    days: '7',
    chartType: 'combined',
    showDetails: false,
    minValue: '',
    maxValue: '',
    trend: 'all',
    sortBy: 'fecha',
    sortOrder: 'desc'
  })

  const handleFilterChange = (filterName: string, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }



  const handleReset = () => {
    const defaultFilters = {
      days: '7',
      chartType: 'combined',
      showDetails: false,
      minValue: '',
      maxValue: '',
      trend: 'all',
      sortBy: 'fecha',
      sortOrder: 'desc'
    }
    setFilters(defaultFilters)
    onReset()
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '7' && value !== 'combined' && value !== false && value !== 'all' && value !== 'fecha' && value !== 'desc' && value !== ''
  ).length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros Avanzados
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              size="sm"
            >
              {isExpanded ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </Button>

            {activeFiltersCount > 0 && (
              <Button onClick={handleReset} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Análisis
              </label>
              <Select value={filters.days} onValueChange={(value) => handleFilterChange('days', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="15">Últimos 15 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="60">Últimos 60 días</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Gráfica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Gráfica
              </label>
              <Select value={filters.chartType} onValueChange={(value) => handleFilterChange('chartType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combinada</SelectItem>
                  <SelectItem value="line">Líneas</SelectItem>
                  <SelectItem value="bar">Barras</SelectItem>
                  <SelectItem value="area">Áreas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tendencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Tendencia
              </label>
              <Select value={filters.trend} onValueChange={(value) => handleFilterChange('trend', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tendencias</SelectItem>
                  <SelectItem value="CRECIENTE">Solo crecientes</SelectItem>
                  <SelectItem value="DECRECIENTE">Solo decrecientes</SelectItem>
                  <SelectItem value="ESTABLE">Solo estables</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mínimo
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.minValue}
                  onChange={(e) => handleFilterChange('minValue', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Valor Máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Máximo
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="number"
                  placeholder="999999.99"
                  value={filters.maxValue}
                  onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fecha">Fecha</SelectItem>
                  <SelectItem value="entradas">Entradas</SelectItem>
                  <SelectItem value="salidas">Salidas</SelectItem>
                  <SelectItem value="neto">Neto</SelectItem>
                  <SelectItem value="valorEntradas">Valor Entradas</SelectItem>
                  <SelectItem value="valorSalidas">Valor Salidas</SelectItem>
                  <SelectItem value="valorNeto">Valor Neto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orden */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden
              </label>
              <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descendente</SelectItem>
                  <SelectItem value="asc">Ascendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mostrar Detalles */}
            <div className="flex items-center">
              <Button
                onClick={() => handleFilterChange('showDetails', !filters.showDetails)}
                variant={filters.showDetails ? "default" : "outline"}
                size="sm"
                className="w-full"
              >
                {filters.showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {filters.showDetails ? 'Ocultar Detalles' : 'Mostrar Detalles'}
              </Button>
            </div>
          </div>

          {/* Filtros Activos */}
          {activeFiltersCount > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Filtros Activos:</h4>
              <div className="flex flex-wrap gap-2">
                {filters.days !== '7' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {filters.days} días
                  </Badge>
                )}
                {filters.chartType !== 'combined' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {filters.chartType}
                  </Badge>
                )}
                {filters.trend !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.trend === 'CRECIENTE' ? <TrendingUp className="w-3 h-3" /> :
                     filters.trend === 'DECRECIENTE' ? <TrendingDown className="w-3 h-3" /> :
                     <Minus className="w-3 h-3" />}
                    {filters.trend}
                  </Badge>
                )}
                {filters.minValue && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Min: ${filters.minValue}
                  </Badge>
                )}
                {filters.maxValue && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Max: ${filters.maxValue}
                  </Badge>
                )}
                {filters.sortBy !== 'fecha' && (
                  <Badge variant="secondary">
                    Orden: {filters.sortBy}
                  </Badge>
                )}
                {filters.sortOrder !== 'desc' && (
                  <Badge variant="secondary">
                    {filters.sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
} 