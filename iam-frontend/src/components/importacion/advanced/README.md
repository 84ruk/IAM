# 🚀 Componentes Avanzados de Importación

Este directorio contiene los componentes avanzados para el sistema de importación, implementando funcionalidades de nivel empresarial con resolución inteligente de errores, analytics, programación automática y más.

## 📋 Componentes Disponibles

### 1. **ErrorResolutionModal** 
Modal inteligente para resolver errores de importación con:
- ✅ Resolución automática de errores comunes
- ✅ Preview de cambios antes de aplicar
- ✅ Agrupación de errores similares
- ✅ Aplicación masiva de correcciones
- ✅ Validación de correcciones en tiempo real

### 2. **ImportHistory**
Historial completo de importaciones con:
- 📊 Filtros avanzados por tipo, estado, fecha
- 📈 Estadísticas detalladas
- 🔍 Búsqueda inteligente
- 📤 Exportación a CSV
- 👁️ Vista detallada de cada importación

### 3. **ImportAnalytics**
Analytics y métricas avanzadas:
- 📊 Gráficos de tendencias temporales
- 📈 Distribución por tipos de importación
- 🎯 Análisis de errores comunes
- 📋 Insights y recomendaciones
- 📤 Exportación de reportes

### 4. **AdvancedImportOptions**
Configuraciones avanzadas de importación:
- ⚙️ Opciones específicas por tipo
- 🔧 Configuraciones de validación
- 🏗️ Opciones de creación automática
- 📧 Configuración de notificaciones
- 💾 Templates de configuración

### 5. **ImportScheduler**
Programador de importaciones automáticas:
- ⏰ Programación por frecuencia (diaria, semanal, mensual)
- 📅 Selección de días específicos
- 🔄 Gestión de importaciones programadas
- 📊 Estadísticas de ejecución
- ⏸️ Pausar/reanudar programaciones

### 6. **AdvancedImportDashboard**
Dashboard unificado que integra todos los componentes:
- 🎛️ Navegación por secciones
- 📊 Vista general con estadísticas
- ⚡ Acciones rápidas
- 🔗 Integración completa de funcionalidades

## 🛠️ Uso Básico

```tsx
import { 
  AdvancedImportDashboard,
  ErrorResolutionModal,
  ImportHistory,
  ImportAnalytics,
  AdvancedImportOptions,
  ImportScheduler
} from '@/components/importacion/advanced'

// Dashboard completo
<AdvancedImportDashboard />

// Componente individual
<ImportHistory />
<ImportAnalytics />
<AdvancedImportOptions 
  tipo="productos"
  opciones={opciones}
  onOpcionesChange={handleOpcionesChange}
/>
```

## 🔧 Configuración del Backend

### Mejoras Implementadas

1. **Creación Automática de Entidades**:
   - ✅ Productos creados automáticamente desde movimientos
   - ✅ Proveedores creados automáticamente
   - ✅ Categorías/etiquetas procesadas automáticamente
   - ✅ SKUs generados automáticamente

2. **Configuraciones Expandidas**:
   - ✅ Nuevas opciones en DTOs de movimientos
   - ✅ Configuraciones específicas por tipo
   - ✅ Validaciones avanzadas
   - ✅ Opciones de creación automática

### DTOs Actualizados

```typescript
// Configuraciones específicas de movimientos
interface ConfiguracionEspecificaMovimientos {
  crearProductoSiNoExiste?: boolean
  crearProveedorSiNoExiste?: boolean
  generarSKUAutomatico?: boolean
  usarPreciosDelMovimiento?: boolean
  crearCategoriaSiNoExiste?: boolean
  // ... más opciones
}
```

## 🎯 Características Principales

### Resolución Inteligente de Errores
- **Detección automática** de patrones de error
- **Sugerencias inteligentes** basadas en el contexto
- **Corrección automática** de formatos comunes
- **Validación en tiempo real** de correcciones

### Analytics Avanzados
- **Métricas en tiempo real** de rendimiento
- **Tendencias temporales** de importaciones
- **Análisis de errores** y patrones
- **Insights automáticos** y recomendaciones

### Programación Automática
- **Cronogramas flexibles** (diario, semanal, mensual)
- **Gestión de archivos** para importaciones programadas
- **Monitoreo de ejecución** y estadísticas
- **Notificaciones automáticas** de resultados

### Configuraciones Avanzadas
- **Templates reutilizables** de configuración
- **Opciones específicas** por tipo de importación
- **Validaciones personalizables**
- **Integración con notificaciones**

## 🔄 Flujo de Trabajo

1. **Configuración**: Usar `AdvancedImportOptions` para configurar parámetros
2. **Programación**: Usar `ImportScheduler` para importaciones automáticas
3. **Monitoreo**: Usar `ImportAnalytics` para seguimiento de rendimiento
4. **Resolución**: Usar `ErrorResolutionModal` para errores
5. **Historial**: Usar `ImportHistory` para revisión completa

## 🚀 Próximas Mejoras

- [ ] Integración con WebSockets para actualizaciones en tiempo real
- [ ] Machine Learning para predicción de errores
- [ ] API para integración con sistemas externos
- [ ] Dashboard de administración avanzado
- [ ] Sistema de alertas inteligentes

## 📝 Notas de Desarrollo

- Todos los componentes son **TypeScript** con tipado estricto
- Utilizan **React Hooks** para gestión de estado
- Implementan **patrones de diseño** consistentes
- Siguen **principios de UX** modernos
- Son **responsivos** y accesibles

## 🤝 Contribución

Para contribuir a estos componentes:

1. Mantener consistencia con el diseño existente
2. Agregar tipos TypeScript completos
3. Incluir documentación de props
4. Implementar manejo de errores robusto
5. Seguir las convenciones de nomenclatura

---

**Desarrollado con ❤️ para el sistema IAM** 