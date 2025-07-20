# 🔧 Filtros Avanzados - Movimientos de Inventario Diarios

## 🎯 Descripción

Sistema completo de filtros avanzados para el análisis de movimientos de inventario diarios, que permite a los usuarios personalizar completamente la visualización y análisis de datos según sus necesidades específicas.

## 📁 Estructura de Archivos

```
src/
├── types/
│   └── filters.ts                           # Tipos para filtros avanzados
├── hooks/
│   └── useDailyMovementsFilters.ts          # Hook para manejo de filtros
├── components/dashboard/
│   └── DailyMovementsFilters.tsx            # Componente de filtros
└── app/(dashboard)/
    └── daily-movements-advanced/
        └── page.tsx                         # Página avanzada con filtros
```

## 🔧 Tipos de Filtros Implementados

### 1. Filtros de Período
```typescript
period: '7d' | '15d' | '30d' | '60d' | '90d' | 'custom'
startDate?: string  // Para períodos personalizados
endDate?: string    // Para períodos personalizados
```

### 2. Filtros de Producto
```typescript
productIds?: number[]           // Productos específicos
productCategories?: string[]    // Categorías de productos
productTags?: string[]          // Etiquetas de productos
```

### 3. Filtros de Proveedor
```typescript
supplierIds?: number[]          // Proveedores específicos
```

### 4. Filtros de Movimiento
```typescript
movementTypes?: ('ENTRADA' | 'SALIDA')[]  // Tipos de movimiento
movementReasons?: string[]                // Motivos de movimiento
```

### 5. Filtros de Valor
```typescript
minValue?: number               // Valor mínimo
maxValue?: number               // Valor máximo
minQuantity?: number            // Cantidad mínima
maxQuantity?: number            // Cantidad máxima
```

### 6. Filtros de Usuario
```typescript
userIds?: number[]              // Usuarios específicos
```

### 7. Configuración de Visualización
```typescript
chartType?: 'line' | 'bar' | 'area' | 'combined'
groupBy?: 'day' | 'week' | 'month' | 'product' | 'supplier'
sortBy?: 'date' | 'quantity' | 'value' | 'product' | 'supplier'
sortOrder?: 'asc' | 'desc'
```

## 🎨 Componente de Filtros

### Características Principales

#### 1. **Interfaz Colapsible**
- Filtros se pueden mostrar/ocultar
- Estado persistente en localStorage
- Animaciones suaves

#### 2. **Presets Predefinidos**
```typescript
const DEFAULT_FILTER_PRESETS = [
  {
    id: 'last-7-days',
    name: 'Últimos 7 días',
    description: 'Movimientos de la última semana',
    filters: { period: '7d' },
    isDefault: true
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
  // ... más presets
]
```

#### 3. **Presets Personalizables**
- Guardar configuraciones personalizadas
- Persistencia en localStorage
- Compartir configuraciones

#### 4. **Filtros Dinámicos**
- Carga automática de opciones desde el backend
- Filtros con conteo de resultados
- Búsqueda en tiempo real

### Uso del Componente

```tsx
import DailyMovementsFilters from '@/components/dashboard/DailyMovementsFilters'

function MyPage() {
  const handleFiltersChange = (filters) => {
    console.log('Filtros actualizados:', filters)
  }

  return (
    <DailyMovementsFilters
      onFiltersChange={handleFiltersChange}
      showAdvanced={true}
      collapsible={true}
    />
  )
}
```

## 🔄 Hook de Filtros

### Funcionalidades del Hook

#### 1. **Gestión de Estado**
```typescript
const {
  filters,           // Estado actual de filtros
  appliedFilters,    // Filtros aplicados para API
  updateFilters,     // Actualizar filtros
  resetFilters,      // Resetear a valores por defecto
} = useDailyMovementsFilters()
```

#### 2. **Presets**
```typescript
const {
  presets,           // Lista de presets disponibles
  activePreset,      // Preset activo actual
  applyPreset,       // Aplicar un preset
  savePreset,        // Guardar nuevo preset
  deletePreset,      // Eliminar preset
} = useDailyMovementsFilters()
```

#### 3. **Utilidades**
```typescript
const {
  hasActiveFilters,  // Verificar si hay filtros activos
  getFilterSummary,  // Obtener resumen de filtros
  exportFilters,     // Exportar configuración
  importFilters,     // Importar configuración
} = useDailyMovementsFilters()
```

### Ejemplo de Uso Completo

```tsx
import { useDailyMovementsFilters } from '@/hooks/useDailyMovementsFilters'

function AdvancedDashboard() {
  const {
    filters,
    filterOptions,
    presets,
    activePreset,
    hasActiveFilters,
    updateFilters,
    applyPreset,
    savePreset
  } = useDailyMovementsFilters({
    initialFilters: {
      period: '30d',
      chartType: 'combined'
    },
    onFiltersChange: (filters) => {
      // Actualizar visualización
      updateChart(filters)
    }
  })

  return (
    <div>
      {/* Mostrar resumen de filtros */}
      {hasActiveFilters && (
        <div>Filtros activos: {getFilterSummary()}</div>
      )}

      {/* Aplicar presets */}
      <div>
        {presets.map(preset => (
          <button key={preset.id} onClick={() => applyPreset(preset.id)}>
            {preset.name}
          </button>
        ))}
      </div>

      {/* Configurar filtros */}
      <div>
        <select 
          value={filters.period} 
          onChange={(e) => updateFilters({ period: e.target.value })}
        >
          <option value="7d">7 días</option>
          <option value="30d">30 días</option>
        </select>
      </div>
    </div>
  )
}
```

## 📊 Integración con Backend

### Endpoint de Opciones de Filtro
```typescript
// GET /dashboard-cqrs/filter-options
interface FilterOptionsResponse {
  products: FilterOption[]      // Productos disponibles
  suppliers: FilterOption[]     // Proveedores disponibles
  categories: FilterOption[]    // Categorías disponibles
  tags: FilterOption[]          // Etiquetas disponibles
  reasons: FilterOption[]       // Motivos disponibles
  users: FilterOption[]         // Usuarios disponibles
  dateRanges: FilterOption[]    // Rangos de fecha sugeridos
}
```

### Endpoint de Movimientos Filtrados
```typescript
// GET /dashboard-cqrs/daily-movements?[filters]
// Los filtros se envían como query parameters
const params = new URLSearchParams({
  period: '30d',
  productIds: '1,2,3',
  movementTypes: 'ENTRADA,SALIDA',
  minValue: '1000',
  maxValue: '50000',
  chartType: 'combined',
  groupBy: 'day',
  sortBy: 'date',
  sortOrder: 'desc'
})
```

## 🎨 Características de UI/UX

### 1. **Diseño Responsive**
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Controles adaptativos

### 2. **Estados de Carga**
- Loading states para opciones
- Skeleton loaders
- Error states con reintentos

### 3. **Accesibilidad**
- ARIA labels completos
- Navegación por teclado
- Contraste adecuado
- Screen reader friendly

### 4. **Feedback Visual**
- Badges para filtros activos
- Resumen de configuración
- Indicadores de estado
- Animaciones suaves

## 🔧 Configuración Avanzada

### Personalización de Presets

```typescript
// Crear presets personalizados
const customPresets = [
  {
    id: 'my-custom-preset',
    name: 'Mi Análisis',
    description: 'Configuración personalizada para análisis mensual',
    filters: {
      period: '30d',
      chartType: 'combined',
      groupBy: 'week',
      movementTypes: ['SALIDA'],
      minValue: 5000
    }
  }
]
```

### Exportación/Importación

```typescript
// Exportar configuración
const exportData = {
  filters: currentFilters,
  activePreset: activePreset?.id,
  timestamp: new Date().toISOString()
}

// Importar configuración
const importData = JSON.parse(importedString)
if (importData.filters) {
  updateFilters(importData.filters)
}
```

### Integración con Otros Componentes

```tsx
// Integrar con gráfica
<DailyMovementsChart 
  chartType={filters.chartType}
  // ... otros props
/>

// Integrar con tabla
<DailyMovementsTable 
  sortBy={filters.sortBy}
  sortOrder={filters.sortOrder}
  // ... otros props
/>
```

## 🚀 Casos de Uso

### 1. **Análisis de Productos Específicos**
```typescript
const productAnalysis = {
  period: '30d',
  productIds: [1, 2, 3],
  chartType: 'line',
  groupBy: 'day'
}
```

### 2. **Análisis de Proveedores**
```typescript
const supplierAnalysis = {
  period: '60d',
  supplierIds: [1, 2],
  movementTypes: ['ENTRADA'],
  groupBy: 'supplier',
  sortBy: 'value'
}
```

### 3. **Análisis de Alto Valor**
```typescript
const highValueAnalysis = {
  period: '90d',
  minValue: 10000,
  chartType: 'bar',
  groupBy: 'month'
}
```

### 4. **Análisis de Stock Crítico**
```typescript
const criticalStockAnalysis = {
  period: '30d',
  movementTypes: ['SALIDA'],
  productCategories: ['medicamentos'],
  chartType: 'area'
}
```

## 📈 Métricas de Rendimiento

### Optimizaciones Implementadas

1. **Debouncing**: Filtros con delay para evitar requests excesivos
2. **Memoización**: Cache de opciones de filtro
3. **Lazy Loading**: Carga progresiva de opciones
4. **AbortController**: Cancelación de requests pendientes

### Tiempos de Respuesta Esperados

- **Carga inicial**: < 1 segundo
- **Aplicación de filtros**: < 200ms
- **Carga de opciones**: < 500ms
- **Exportación**: < 100ms

## 🔮 Próximas Mejoras

### Funcionalidades Planificadas

1. **Filtros Temporales**
   - Comparación de períodos
   - Análisis año anterior
   - Tendencias estacionales

2. **Filtros Avanzados**
   - Filtros por ubicación
   - Filtros por estado de producto
   - Filtros por prioridad

3. **Visualizaciones Adicionales**
   - Heatmaps
   - Gráficas de dispersión
   - Análisis de correlación

4. **Automatización**
   - Alertas automáticas
   - Reportes programados
   - Dashboards automáticos

### Optimizaciones Técnicas

1. **WebSocket**: Actualizaciones en tiempo real
2. **Service Worker**: Cache offline
3. **Virtual Scrolling**: Para listas grandes
4. **Progressive Loading**: Carga incremental

## 📚 Recursos Adicionales

### Enlaces Útiles
- [Documentación del Backend](./DAILY_MOVEMENTS_API.md)
- [Guía de Componentes](./DAILY_MOVEMENTS_FRONTEND.md)
- [Tipos TypeScript](./src/types/filters.ts)

### Dependencias
- **React**: Hooks y componentes
- **TypeScript**: Tipado fuerte
- **Tailwind CSS**: Estilos
- **Lucide React**: Iconos
- **date-fns**: Manipulación de fechas 