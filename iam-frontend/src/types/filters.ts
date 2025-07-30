// Tipos para filtros avanzados de movimientos diarios

export interface DailyMovementsFilters {
  // Filtros de período
  period: '7d' | '15d' | '30d' | '60d' | '90d' | 'custom'
  startDate?: string
  endDate?: string
  
  // Filtros de producto
  productIds?: number[]
  productCategories?: string[]
  productTags?: string[]
  
  // Filtros de proveedor
  supplierIds?: number[]
  
  // Filtros de movimiento
  movementTypes?: ('ENTRADA' | 'SALIDA')[]
  movementReasons?: string[]
  
  // Filtros de valor
  minValue?: number
  maxValue?: number
  minQuantity?: number
  maxQuantity?: number
  
  // Filtros de usuario
  userIds?: number[]
  
  // Filtros de empresa
  empresaId?: number
  
  // Configuración de visualización
  chartType?: 'line' | 'bar' | 'area' | 'combined'
  groupBy?: 'day' | 'week' | 'month' | 'product' | 'supplier'
  sortBy?: 'date' | 'quantity' | 'value' | 'product' | 'supplier'
  sortOrder?: 'asc' | 'desc'
  
  // Configuración de exportación
  includeDetails?: boolean
  exportFormat?: 'csv' | 'excel' | 'pdf'
}

export interface FilterOption {
  value: string | number
  label: string
  count?: number
  color?: string
}

export interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  multiple?: boolean
  searchable?: boolean
}

export interface AppliedFilters {
  [key: string]: unknown
}

export interface FilterPreset {
  id: string
  name: string
  description: string
  filters: DailyMovementsFilters
  isDefault?: boolean
}

// configuraciones predefinidas
export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'last-7-days',
    name: 'Últimos 7 días',
    description: 'Movimientos de la última semana',
    filters: { period: '7d' },
    isDefault: true
  },
  {
    id: 'last-30-days',
    name: 'Últimos 30 días',
    description: 'Movimientos del último mes',
    filters: { period: '30d' }
  },
  {
    id: 'entradas-only',
    name: 'Solo Entradas',
    description: 'Solo movimientos de entrada de inventario',
    filters: { 
      period: '30d',
      movementTypes: ['ENTRADA']
    }
  },
  {
    id: 'salidas-only',
    name: 'Solo Salidas',
    description: 'Solo movimientos de salida de inventario',
    filters: { 
      period: '30d',
      movementTypes: ['SALIDA']
    }
  },
  {
    id: 'high-value',
    name: 'Alto Valor',
    description: 'Movimientos con valor superior a $10,000',
    filters: { 
      period: '30d',
      minValue: 10000
    }
  },
  {
    id: 'stock-critical',
    name: 'Stock Crítico',
    description: 'Movimientos de productos con stock bajo',
    filters: { 
      period: '30d',
      movementTypes: ['SALIDA']
    }
  }
]

// Tipos para respuestas filtradas
export interface FilteredDailyMovementsResponse {
  data: unknown[]
  summary: {
    totalMovements: number
    totalValue: number
    avgDailyMovements: number
    avgDailyValue: number
    trend: 'CRECIENTE' | 'DECRECIENTE' | 'ESTABLE'
    topProducts: Array<{
      id: number
      name: string
      movements: number
      value: number
    }>
    topSuppliers: Array<{
      id: number
      name: string
      movements: number
      value: number
    }>
  }
  filters: AppliedFilters
  meta: {
    appliedFilters: string[]
    totalRecords: number
    processingTime: number
  }
}

// Tipos para opciones de filtro dinámicas
export interface FilterOptionsResponse {
  products: FilterOption[]
  suppliers: FilterOption[]
  categories: FilterOption[]
  tags: FilterOption[]
  reasons: FilterOption[]
  users: FilterOption[]
  dateRanges: FilterOption[]
} 