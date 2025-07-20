'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { ApiClient } from '@/lib/api'
import { 
  DailyMovementsFilters, 
  FilterOption, 
  FilterOptionsResponse,
  FilterPreset,
  DEFAULT_FILTER_PRESETS 
} from '@/types/filters'
import { AppError } from '@/lib/errorHandler'

const api = new ApiClient()

interface UseDailyMovementsFiltersOptions {
  initialFilters?: Partial<DailyMovementsFilters>
  autoLoadOptions?: boolean
  onFiltersChange?: (filters: DailyMovementsFilters) => void
}

interface UseDailyMovementsFiltersReturn {
  // Estado de filtros
  filters: DailyMovementsFilters
  appliedFilters: Record<string, any>
  
  // Opciones de filtro
  filterOptions: FilterOptionsResponse | null
  isLoadingOptions: boolean
  optionsError: AppError | null
  
  // Presets
  presets: FilterPreset[]
  activePreset: FilterPreset | null
  
  // Acciones
  updateFilters: (updates: Partial<DailyMovementsFilters>) => void
  resetFilters: () => void
  applyPreset: (presetId: string) => void
  savePreset: (name: string, description?: string) => void
  deletePreset: (presetId: string) => void
  
  // Utilidades
  hasActiveFilters: boolean
  getFilterSummary: () => string
  exportFilters: () => string
  importFilters: (filtersString: string) => void
}

export function useDailyMovementsFilters(options: UseDailyMovementsFiltersOptions = {}): UseDailyMovementsFiltersReturn {
  const {
    initialFilters = {},
    autoLoadOptions = true,
    onFiltersChange
  } = options

  // Estado de filtros
  const [filters, setFilters] = useState<DailyMovementsFilters>({
    period: '7d',
    chartType: 'combined',
    groupBy: 'day',
    sortBy: 'date',
    sortOrder: 'desc',
    ...initialFilters
  })

  // Estado de opciones de filtro
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [optionsError, setOptionsError] = useState<AppError | null>(null)

  // Estado de presets
  const [presets, setPresets] = useState<FilterPreset[]>(DEFAULT_FILTER_PRESETS)
  const [activePreset, setActivePreset] = useState<FilterPreset | null>(
    DEFAULT_FILTER_PRESETS.find(p => p.isDefault) || null
  )

  // Cargar opciones de filtro
  const loadFilterOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setOptionsError(null)
    
    try {
      const response = await api.get<FilterOptionsResponse>('/dashboard-cqrs/filter-options')
      setFilterOptions(response)
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError('Error cargando opciones de filtro', 500)
      setOptionsError(appError)
    } finally {
      setIsLoadingOptions(false)
    }
  }, [])

  // Actualizar filtros
  const updateFilters = useCallback((updates: Partial<DailyMovementsFilters>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
    
    // Actualizar preset activo
    const matchingPreset = presets.find(preset => 
      JSON.stringify(preset.filters) === JSON.stringify(newFilters)
    )
    setActivePreset(matchingPreset || null)
  }, [filters, onFiltersChange, presets])

  // Resetear filtros
  const resetFilters = useCallback(() => {
    const defaultFilters: DailyMovementsFilters = {
      period: '7d',
      chartType: 'combined',
      groupBy: 'day',
      sortBy: 'date',
      sortOrder: 'desc'
    }
    setFilters(defaultFilters)
    setActivePreset(DEFAULT_FILTER_PRESETS.find(p => p.isDefault) || null)
    onFiltersChange?.(defaultFilters)
  }, [onFiltersChange])

  // Aplicar preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setFilters(preset.filters)
      setActivePreset(preset)
      onFiltersChange?.(preset.filters)
    }
  }, [presets, onFiltersChange])

  // Guardar preset
  const savePreset = useCallback((name: string, description?: string) => {
    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name,
      description: description || `Preset personalizado: ${name}`,
      filters: { ...filters }
    }
    
    setPresets(prev => [...prev, newPreset])
    setActivePreset(newPreset)
    
    // Guardar en localStorage
    const savedPresets = JSON.parse(localStorage.getItem('daily-movements-presets') || '[]')
    savedPresets.push(newPreset)
    localStorage.setItem('daily-movements-presets', JSON.stringify(savedPresets))
  }, [filters])

  // Eliminar preset
  const deletePreset = useCallback((presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId))
    
    if (activePreset?.id === presetId) {
      setActivePreset(null)
    }
    
    // Actualizar localStorage
    const savedPresets = JSON.parse(localStorage.getItem('daily-movements-presets') || '[]')
    const updatedPresets = savedPresets.filter((p: FilterPreset) => p.id !== presetId)
    localStorage.setItem('daily-movements-presets', JSON.stringify(updatedPresets))
  }, [activePreset])

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    const {
      period,
      productIds,
      supplierIds,
      movementTypes,
      movementReasons,
      minValue,
      maxValue,
      minQuantity,
      maxQuantity,
      userIds
    } = filters

    return !(
      period === '7d' &&
      (!productIds || productIds.length === 0) &&
      (!supplierIds || supplierIds.length === 0) &&
      (!movementTypes || movementTypes.length === 0) &&
      (!movementReasons || movementReasons.length === 0) &&
      !minValue &&
      !maxValue &&
      !minQuantity &&
      !maxQuantity &&
      (!userIds || userIds.length === 0)
    )
  }, [filters])

  // Obtener resumen de filtros
  const getFilterSummary = useCallback(() => {
    const parts: string[] = []
    
    // Período
    const periodMap: Record<string, string> = {
      '7d': '7 días',
      '15d': '15 días',
      '30d': '30 días',
      '60d': '60 días',
      '90d': '90 días',
      'custom': 'Período personalizado'
    }
    parts.push(periodMap[filters.period] || filters.period)
    
    // Tipos de movimiento
    if (filters.movementTypes?.length === 1) {
      parts.push(filters.movementTypes[0] === 'ENTRADA' ? 'solo entradas' : 'solo salidas')
    }
    
    // Productos
    if (filters.productIds?.length) {
      parts.push(`${filters.productIds.length} producto(s)`)
    }
    
    // Proveedores
    if (filters.supplierIds?.length) {
      parts.push(`${filters.supplierIds.length} proveedor(es)`)
    }
    
    // Valor
    if (filters.minValue || filters.maxValue) {
      const valueRange = []
      if (filters.minValue) valueRange.push(`>$${filters.minValue.toLocaleString()}`)
      if (filters.maxValue) valueRange.push(`<$${filters.maxValue.toLocaleString()}`)
      parts.push(`valor ${valueRange.join(' y ')}`)
    }
    
    return parts.join(', ')
  }, [filters])

  // Exportar filtros
  const exportFilters = useCallback(() => {
    return JSON.stringify({
      filters,
      activePreset: activePreset?.id,
      timestamp: new Date().toISOString()
    })
  }, [filters, activePreset])

  // Importar filtros
  const importFilters = useCallback((filtersString: string) => {
    try {
      const data = JSON.parse(filtersString)
      if (data.filters) {
        setFilters(data.filters)
        if (data.activePreset) {
          const preset = presets.find(p => p.id === data.activePreset)
          setActivePreset(preset || null)
        }
        onFiltersChange?.(data.filters)
      }
    } catch (error) {
      console.error('Error importing filters:', error)
    }
  }, [presets, onFiltersChange])

  // Cargar presets guardados al inicializar
  useEffect(() => {
    try {
      const savedPresets = JSON.parse(localStorage.getItem('daily-movements-presets') || '[]')
      if (savedPresets.length > 0) {
        setPresets(prev => [...DEFAULT_FILTER_PRESETS, ...savedPresets])
      }
    } catch (error) {
      console.error('Error loading saved presets:', error)
    }
  }, [])

  // Cargar opciones automáticamente
  useEffect(() => {
    if (autoLoadOptions) {
      loadFilterOptions()
    }
  }, [autoLoadOptions, loadFilterOptions])

  // Filtros aplicados para la API
  const appliedFilters = useMemo(() => {
    const applied: Record<string, any> = {}
    
    // Solo incluir filtros que tengan valor
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          applied[key] = value
        } else if (!Array.isArray(value)) {
          applied[key] = value
        }
      }
    })
    
    return applied
  }, [filters])

  return {
    // Estado
    filters,
    appliedFilters,
    
    // Opciones
    filterOptions,
    isLoadingOptions,
    optionsError,
    
    // Presets
    presets,
    activePreset,
    
    // Acciones
    updateFilters,
    resetFilters,
    applyPreset,
    savePreset,
    deletePreset,
    
    // Utilidades
    hasActiveFilters,
    getFilterSummary,
    exportFilters,
    importFilters
  }
} 