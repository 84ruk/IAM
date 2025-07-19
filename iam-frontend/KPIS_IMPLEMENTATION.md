# Implementación de la Página de KPIs

## Resumen

Se ha implementado una página completa de Indicadores Clave de Rendimiento (KPIs) para el dashboard de la aplicación IAM ERP SaaS. La implementación sigue las mejores prácticas de React, Next.js y TypeScript, manteniendo la consistencia con el diseño existente.

## Características Implementadas

### 🎯 KPIs Principales
- **Total Productos**: Número total de productos en inventario
- **Stock Crítico**: Productos con stock por debajo del mínimo
- **Valor Inventario**: Valor total del inventario en euros
- **Ventas del Mes**: Ventas totales del mes actual

### 💰 KPIs Financieros (Opcionales)
- **Ingresos del Mes**: Ingresos totales del mes
- **Gastos del Mes**: Gastos totales del mes
- **Margen Bruto**: Porcentaje de margen bruto
- **Rentabilidad**: Porcentaje de rentabilidad

### 📊 Gráficos Interactivos
- **Tendencia de Ventas**: Gráfico de líneas mostrando la evolución de ventas
- **Distribución de Stock**: Gráfico circular mostrando la distribución por categorías

### 🔮 Predicciones y Alertas
- **Riesgo de Quiebre de Stock**: Productos en riesgo de quedarse sin stock
- **Tendencias de Demanda**: Predicciones de tendencias de demanda

### 📈 Productos Más Vendidos
- Lista de productos con mayor volumen de ventas
- Porcentajes de participación en ventas totales

## Arquitectura y Componentes

### Estructura de Archivos
```
src/
├── app/(dashboard)/dashboard/kpis/
│   ├── page.tsx                 # Página principal (SSR)
│   └── KPIsClient.tsx          # Componente cliente principal
├── components/dashboard/
│   ├── KPICard.tsx             # Tarjeta individual de KPI
│   ├── KPIGraph.tsx            # Componente de gráficos
│   ├── PredictionsPanel.tsx    # Panel de predicciones
│   └── TopProductsList.tsx     # Lista de productos más vendidos
├── hooks/
│   └── useKPIs.ts              # Hooks personalizados para KPIs
├── lib/
│   └── kpi-utils.ts            # Utilidades para formateo y cálculos
└── types/
    └── kpis.ts                 # Tipos TypeScript para KPIs
```

### Componentes Principales

#### 1. KPIsClient.tsx
- Componente principal que orquesta toda la página
- Maneja estados de loading, error y datos
- Implementa auto-refresh cada 5 minutos
- Gestiona filtros por período e industria

#### 2. KPICard.tsx
- Componente reutilizable para mostrar KPIs individuales
- Maneja estados de loading y error
- Formateo automático de valores
- Iconos y colores dinámicos

#### 3. KPIGraph.tsx
- Componente para gráficos (línea, barras, circular)
- Integración con Recharts
- Formateo personalizable de valores y etiquetas
- Estados de loading y error

#### 4. PredictionsPanel.tsx
- Panel para mostrar predicciones y alertas
- Diferentes tipos: quiebre de stock y tendencias
- Indicadores visuales de riesgo

#### 5. TopProductsList.tsx
- Lista de productos más vendidos
- Ranking visual con números
- Porcentajes de participación

### Hooks Personalizados

#### useKPIs.ts
- `useKPIs()`: Hook básico para KPIs principales
- `useFinancialKPIs()`: Hook para KPIs financieros
- `useIndustryKPIs()`: Hook para KPIs específicos de industria
- `usePredictiveKPIs()`: Hook para predicciones
- `useAllKPIs()`: Hook combinado para todos los KPIs

### Utilidades

#### kpi-utils.ts
- `formatCurrency()`: Formateo de moneda en euros
- `formatPercentage()`: Formateo de porcentajes
- `getValueColor()`: Colores dinámicos según valores
- `calculateRiskLevel()`: Cálculo de niveles de riesgo
- `formatChartDate()`: Formateo de fechas para gráficos

## Características Técnicas

### 🔄 Reactividad y Datos
- **SWR**: Para gestión de estado y caché
- **Auto-refresh**: Actualización automática cada 5 minutos
- **Revalidación**: Al reconectar y recuperar foco
- **Deduplicación**: Evita requests duplicados

### 🎨 Diseño y UX
- **Responsive**: Adaptable a móviles y escritorio
- **Loading States**: Skeleton loaders y spinners
- **Error Handling**: Manejo elegante de errores
- **Notifications**: Notificaciones de actualización automática

### 🔒 Seguridad y Performance
- **SSR/CSR**: Renderizado híbrido optimizado
- **TypeScript**: Tipado completo para seguridad
- **Lazy Loading**: Carga diferida de componentes
- **Error Boundaries**: Manejo de errores en componentes

### 📱 Navegación
- **Sidebar**: Enlace agregado al menú principal
- **Breadcrumbs**: Navegación contextual
- **Filtros**: Por período e industria

## Endpoints del Backend

La página consume los siguientes endpoints:

- `GET /dashboard-cqrs/kpis` - KPIs principales
- `GET /dashboard-cqrs/financial-kpis?period={period}` - KPIs financieros
- `GET /dashboard-cqrs/industry-kpis?industry={industry}` - KPIs de industria
- `GET /dashboard-cqrs/predictive-kpis?days=30` - Predicciones

## Configuración y Personalización

### Filtros Disponibles
- **Períodos**: Mes, trimestre, semestre, año
- **Industrias**: General, Alimentos, Farmacia, Ropa, Electrónica
- **Datos Financieros**: Mostrar/ocultar según permisos

### Auto-refresh
- **Intervalo**: 5 minutos (configurable)
- **Condiciones**: Solo cuando está en línea
- **Notificaciones**: Feedback visual de actualizaciones

## Escalabilidad

### Modularidad
- Componentes reutilizables
- Hooks personalizados
- Utilidades centralizadas
- Tipos TypeScript bien definidos

### Extensibilidad
- Fácil agregar nuevos tipos de KPIs
- Configuración flexible de gráficos
- Sistema de filtros extensible
- Arquitectura preparada para más industrias

### Performance
- Caché inteligente con SWR
- Componentes optimizados
- Lazy loading de gráficos
- Debouncing en filtros

## Próximos Pasos

1. **Más Gráficos**: Agregar gráficos de barras y áreas
2. **Exportación**: Funcionalidad para exportar datos
3. **Comparativas**: Comparación entre períodos
4. **Alertas**: Sistema de notificaciones push
5. **Personalización**: Dashboard personalizable por usuario

## Conclusión

La implementación de la página de KPIs proporciona una vista completa y profesional del rendimiento empresarial, siguiendo las mejores prácticas de desarrollo moderno y manteniendo la consistencia con el resto de la aplicación. 