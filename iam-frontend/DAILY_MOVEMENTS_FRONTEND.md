# 📊 Frontend - Movimientos de Inventario Diarios

## 🎯 Descripción

Implementación completa del frontend para el KPI de "Movimientos de Inventario Diarios" con componentes React, hooks personalizados y múltiples tipos de visualización.

## 📁 Estructura de Archivos

```
src/
├── types/
│   └── kpis.ts                    # Tipos TypeScript para movimientos diarios
├── hooks/
│   └── useDailyMovements.ts       # Hook personalizado para datos
├── components/dashboard/
│   ├── DailyMovementsChart.tsx    # Componente de gráficas
│   └── DailyMovementsTable.tsx    # Componente de tabla
└── app/(dashboard)/
    └── daily-movements/
        └── page.tsx               # Página de ejemplo
```

## 🔧 Componentes Implementados

### 1. Hook Personalizado: `useDailyMovements`

**Características:**
- ✅ Auto-refresh cada 5 minutos
- ✅ Cache inteligente
- ✅ Manejo de errores
- ✅ AbortController para cancelar peticiones
- ✅ Parámetros configurables

**Uso básico:**
```tsx
import { useDailyMovements } from '@/hooks/useDailyMovements'

function MyComponent() {
  const { data, isLoading, error, refetch, forceRefresh } = useDailyMovements({
    days: 7,
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000
  })

  if (isLoading) return <div>Cargando...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Movimientos de {data?.meta.daysRequested} días</h2>
      {/* Renderizar datos */}
    </div>
  )
}
```

**Opciones disponibles:**
```tsx
interface UseDailyMovementsOptions {
  days?: number                    // Días a consultar (default: 7)
  autoRefresh?: boolean           // Auto-refresh (default: true)
  refreshInterval?: number        // Intervalo en ms (default: 5 min)
  onSuccess?: (data) => void      // Callback de éxito
  onError?: (error) => void       // Callback de error
}
```

### 2. Componente de Gráficas: `DailyMovementsChart`

**Características:**
- ✅ 4 tipos de gráfica: líneas, barras, áreas, combinada
- ✅ Controles de período y tipo de gráfica
- ✅ Resumen estadístico
- ✅ Auto-refresh
- ✅ Manejo de estados de carga y error

**Uso básico:**
```tsx
import DailyMovementsChart from '@/components/dashboard/DailyMovementsChart'

function Dashboard() {
  return (
    <DailyMovementsChart 
      initialDays={7}
      showControls={true}
      showSummary={true}
      chartType="combined"
      height={400}
    />
  )
}
```

**Props disponibles:**
```tsx
interface DailyMovementsChartProps {
  className?: string              // Clases CSS adicionales
  initialDays?: number           // Días iniciales (default: 7)
  showControls?: boolean         // Mostrar controles (default: true)
  showSummary?: boolean          // Mostrar resumen (default: true)
  chartType?: 'line' | 'bar' | 'area' | 'combined'  // Tipo de gráfica
  height?: number                // Altura de la gráfica (default: 400)
}
```

**Tipos de gráfica:**

1. **Líneas (`line`)**: Entradas y salidas como líneas separadas
2. **Barras (`bar`)**: Entradas y salidas como barras
3. **Áreas (`area`)**: Entradas y salidas como áreas apiladas
4. **Combinada (`combined`)**: Cantidades y valores en ejes separados

### 3. Componente de Tabla: `DailyMovementsTable`

**Características:**
- ✅ Ordenamiento por columnas
- ✅ Búsqueda en tiempo real
- ✅ Exportación a CSV
- ✅ Paginación automática
- ✅ Formateo de moneda y números

**Uso básico:**
```tsx
import DailyMovementsTable from '@/components/dashboard/DailyMovementsTable'

function DataView() {
  return (
    <DailyMovementsTable 
      initialDays={7}
      showSearch={true}
      showExport={true}
      maxRows={50}
    />
  )
}
```

**Props disponibles:**
```tsx
interface DailyMovementsTableProps {
  className?: string              // Clases CSS adicionales
  initialDays?: number           // Días iniciales (default: 7)
  showSearch?: boolean           // Mostrar búsqueda (default: true)
  showExport?: boolean           // Mostrar exportación (default: true)
  maxRows?: number               // Máximo de filas (default: 50)
}
```

## 📊 Tipos de Datos

### Estructura de Respuesta
```tsx
interface DailyMovementsResponse {
  data: DailyMovementData[]       // Datos diarios
  summary: DailyMovementsSummary  // Resumen estadístico
  meta: {                         // Metadatos
    empresaId: number
    source: string
    generatedAt: string
    daysRequested: number
    totalDays: number
  }
}

interface DailyMovementData {
  fecha: string                   // YYYY-MM-DD
  entradas: number               // Cantidad de entradas
  salidas: number                // Cantidad de salidas
  neto: number                   // Diferencia neta
  valorEntradas: number          // Valor monetario entradas
  valorSalidas: number           // Valor monetario salidas
  valorNeto: number              // Valor neto monetario
}

interface DailyMovementsSummary {
  avgEntradasDiarias: number     // Promedio entradas por día
  avgSalidasDiarias: number      // Promedio salidas por día
  diaMaxActividad: string        // Fecha con mayor actividad
  totalMovimientos: number       // Total de movimientos
  tendencia: 'CRECIENTE' | 'DECRECIENTE' | 'ESTABLE'
}
```

## 🎨 Características de UI/UX

### Estados de Carga
- **Loading**: Spinner animado con mensaje
- **Error**: Mensaje de error con botón de reintento
- **Empty**: Estado vacío con icono y mensaje explicativo

### Responsive Design
- ✅ Mobile-first approach
- ✅ Breakpoints: sm, md, lg, xl
- ✅ Gráficas responsivas con Recharts
- ✅ Tabla con scroll horizontal en móviles

### Accesibilidad
- ✅ ARIA labels en controles
- ✅ Navegación por teclado
- ✅ Contraste de colores adecuado
- ✅ Textos alternativos en iconos

### Internacionalización
- ✅ Formateo de fechas en español
- ✅ Formateo de moneda en pesos mexicanos
- ✅ Formateo de números con separadores de miles

## 🔄 Auto-refresh y Cache

### Configuración de Cache
- **TTL**: 5 minutos (configurable)
- **Invalidación**: Automática con `forceRefresh`
- **Clave**: `daily-movements:{empresaId}:{days}:{userRole}`

### Auto-refresh
```tsx
// Configuración por defecto
const { data } = useDailyMovements({
  autoRefresh: true,              // Habilitar auto-refresh
  refreshInterval: 5 * 60 * 1000  // 5 minutos
})

// Deshabilitar auto-refresh
const { data } = useDailyMovements({
  autoRefresh: false
})
```

## 🛡️ Manejo de Errores

### Tipos de Error
1. **Errores de red**: Reintentos automáticos
2. **Errores de autenticación**: Redirección a login
3. **Errores de autorización**: Mensaje de acceso denegado
4. **Errores de validación**: Mensajes específicos

### Callbacks de Error
```tsx
const { data, error } = useDailyMovements({
  onError: (error) => {
    console.error('Error en movimientos diarios:', error)
    // Mostrar notificación, log, etc.
  }
})
```

## 📱 Página de Ejemplo

### Ruta: `/daily-movements`

**Características:**
- ✅ Múltiples configuraciones de gráficas
- ✅ Tabla de datos completa
- ✅ Información explicativa del KPI
- ✅ KPIs rápidos de resumen

**Estructura:**
1. **Header**: Título y descripción
2. **Información**: Explicación del KPI
3. **Gráfica Principal**: Configuración completa
4. **Gráficas Especializadas**: Diferentes tipos y períodos
5. **Tabla de Datos**: Vista tabular con controles
6. **KPIs Rápidos**: Resumen visual

## 🚀 Casos de Uso

### 1. Dashboard Principal
```tsx
// Gráfica simple para dashboard
<DailyMovementsChart 
  initialDays={7}
  showControls={false}
  showSummary={true}
  chartType="line"
  height={250}
/>
```

### 2. Análisis Detallado
```tsx
// Página de análisis completo
<DailyMovementsChart 
  initialDays={30}
  showControls={true}
  showSummary={true}
  chartType="combined"
  height={400}
/>
```

### 3. Reportes
```tsx
// Tabla para reportes
<DailyMovementsTable 
  initialDays={60}
  showSearch={true}
  showExport={true}
  maxRows={100}
/>
```

### 4. Widget Personalizado
```tsx
// Widget minimalista
<DailyMovementsChart 
  initialDays={7}
  showControls={false}
  showSummary={false}
  chartType="area"
  height={200}
/>
```

## 🔧 Configuración Avanzada

### Personalización de Colores
```tsx
// Los colores están definidos en el componente
const colors = {
  entradas: '#10B981',    // Verde
  salidas: '#EF4444',     // Rojo
  valorEntradas: '#3B82F6', // Azul
  valorSalidas: '#F59E0B'   // Amarillo
}
```

### Personalización de Formateo
```tsx
// Formateo de moneda (configurable)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value)
}

// Formateo de fechas (configurable)
const formatDate = (date: string) => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es })
}
```

## 📈 Métricas de Rendimiento

### Optimizaciones Implementadas
- ✅ **Memoización**: `useMemo` para procesamiento de datos
- ✅ **Debouncing**: Búsqueda con delay
- ✅ **Lazy Loading**: Suspense para componentes pesados
- ✅ **AbortController**: Cancelación de peticiones
- ✅ **Virtual Scrolling**: Para tablas grandes (futuro)

### Tiempos de Respuesta Esperados
- **Primera carga**: < 2 segundos
- **Cache hit**: < 200ms
- **Auto-refresh**: < 1 segundo
- **Búsqueda**: < 100ms

## 🔮 Próximas Mejoras

### Funcionalidades Planificadas
1. **Filtros avanzados**: Por producto, proveedor, motivo
2. **Comparación de períodos**: Año anterior, mes anterior
3. **Alertas**: Notificaciones de anomalías
4. **Drill-down**: Navegación a detalles de productos
5. **Exportación avanzada**: PDF, Excel, múltiples formatos

### Optimizaciones Técnicas
1. **WebSocket**: Actualizaciones en tiempo real
2. **Service Worker**: Cache offline
3. **Virtual Scrolling**: Para datasets grandes
4. **Progressive Loading**: Carga incremental de datos

## 📚 Recursos Adicionales

### Dependencias Utilizadas
- **Recharts**: Gráficas interactivas
- **date-fns**: Manipulación de fechas
- **Lucide React**: Iconos
- **Tailwind CSS**: Estilos

### Enlaces Útiles
- [Documentación de Recharts](https://recharts.org/)
- [Guía de date-fns](https://date-fns.org/)
- [Iconos de Lucide](https://lucide.dev/)
- [Documentación del Backend](./DAILY_MOVEMENTS_API.md) 