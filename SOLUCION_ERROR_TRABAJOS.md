# Solución al Error: "Cannot read properties of undefined (reading 'trabajos')"

## Problema Identificado

El error se produce porque el hook `useImportacion` está intentando acceder a la propiedad `trabajos` antes de que los datos se hayan cargado correctamente desde el backend.

### Causas del Error:

1. **Demasiadas solicitudes simultáneas** - El backend está rechazando las peticiones
2. **Estado inicial no manejado** - El hook no maneja correctamente el estado de carga inicial
3. **Acceso a propiedades undefined** - Se intenta acceder a `trabajos` antes de que esté disponible

## Soluciones Implementadas

### ✅ **1. Hook Seguro (`useImportacionSafe.ts`)**

Se ha creado una versión mejorada del hook que maneja mejor los errores:

```typescript
// Manejo seguro de trabajos
const trabajosRecientes = useMemo(() => 
  state.trabajos?.slice(0, 5) || [], 
  [state.trabajos]
)

// Estado de carga inicial
const [state, setState] = useState<ImportacionState>({
  isImporting: false,
  isLoading: true, // ← Nuevo estado de carga
  currentTrabajo: null,
  trabajos: [],
  // ... resto del estado
})
```

### ✅ **2. Manejo de Errores Mejorado**

```typescript
// Función para cargar trabajos de forma segura
const loadTrabajos = useCallback(async (limit = 50, offset = 0) => {
  try {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    const response = await importacionAPI.listarTrabajos(limit, offset)
    setState(prev => ({
      ...prev,
      trabajos: response.trabajos || [], // ← Fallback a array vacío
      isLoading: false
    }))
  } catch (error) {
    console.error('Error al cargar trabajos:', error)
    setState(prev => ({
      ...prev,
      trabajos: [], // ← Array vacío en caso de error
      isLoading: false,
      error: error instanceof Error ? error.message : 'Error al cargar trabajos'
    }))
  }
}, [])
```

### ✅ **3. Componente de Carga (`LoadingSpinner.tsx`)**

```typescript
export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Cargando...',
  className = ''
}: LoadingSpinnerProps) {
  // Componente reutilizable para mostrar estados de carga
}
```

### ✅ **4. Inicialización Segura**

```typescript
// Efecto con inicialización única
useEffect(() => {
  if (!isInitializedRef.current) {
    isInitializedRef.current = true
    
    const initializeData = async () => {
      try {
        await Promise.all([
          loadTrabajos(),
          loadTiposSoportados()
        ])
      } catch (error) {
        console.error('Error al inicializar datos:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    initializeData()
  }
}, [loadTrabajos, loadTiposSoportados])
```

## Cómo Usar la Solución

### 1. **Usar el Hook Seguro**

```typescript
// En lugar de:
import { useImportacion } from '@/hooks/useImportacion'

// Usar:
import { useImportacionSafe } from '@/hooks/useImportacionSafe'
```

### 2. **Manejar el Estado de Carga**

```typescript
const { isLoading, trabajos, error } = useImportacionSafe()

if (isLoading) {
  return <LoadingSpinner text="Cargando datos de importación..." />
}

if (error) {
  return <div>Error: {error}</div>
}

// Ahora es seguro acceder a trabajos
return <div>Trabajos: {trabajos.length}</div>
```

### 3. **Verificar Antes de Acceder**

```typescript
// Siempre verificar antes de acceder
const trabajosRecientes = trabajos?.slice(0, 5) || []
const primerTrabajo = trabajos?.[0] || null
```

## Verificación de la Solución

### 1. **Revisar la Consola**

```bash
# Verificar que no hay errores de "trabajos undefined"
# Deberías ver logs como:
🔍 Estado completo del hook: {
  isLoading: true,
  trabajos: [],
  trabajosLength: 0,
  // ...
}
```

### 2. **Probar la Carga**

```typescript
// El hook debería manejar automáticamente:
// - Estado de carga inicial
// - Errores de red
// - Respuestas vacías del backend
// - Timeouts
```

### 3. **Verificar el Backend**

```bash
# Asegúrate de que el backend esté funcionando
cd iam-backend && npm run start:dev

# Verificar que no hay errores de "Demasiadas solicitudes simultáneas"
```

## Comandos para Probar

```bash
# 1. Iniciar el backend
cd iam-backend && npm run start:dev

# 2. En otra terminal, iniciar el frontend
cd iam-frontend && npm run dev

# 3. Verificar logs
cd iam-frontend && npm run dev 2>&1 | tee frontend.log
```

## Prevención de Errores Futuros

### ✅ **Buenas Prácticas:**

1. **Siempre usar optional chaining** (`?.`)
2. **Proporcionar valores por defecto** (`|| []`)
3. **Manejar estados de carga**
4. **Capturar errores de red**
5. **Usar tipos TypeScript estrictos**

### ✅ **Patrón Recomendado:**

```typescript
// ✅ Correcto
const { isLoading, trabajos = [], error } = useImportacionSafe()

if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />

return <div>Trabajos: {trabajos.length}</div>

// ❌ Incorrecto
const { trabajos } = useImportacion()
return <div>Trabajos: {trabajos.length}</div> // Puede fallar
```

## Contacto

Si el error persiste:

1. **Verificar conectividad** con el backend
2. **Revisar logs** del servidor
3. **Comprobar** que los endpoints funcionan
4. **Verificar** que no hay problemas de CORS
5. **Revisar** la configuración de la API 