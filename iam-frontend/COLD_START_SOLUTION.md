# Solución para Cold Starts en Fly.io

## 🎯 Problema Resuelto

Tu servidor en Fly.io se apaga por inactividad y tarda mucho en "despertar" (cold start), generando una mala experiencia de usuario. Esta solución implementa:

- ✅ **Detección automática** de cold starts
- ✅ **Loaders animados** durante el proceso de inicio
- ✅ **Reintentos inteligentes** con delays exponenciales
- ✅ **Calentamiento manual** del servidor
- ✅ **Feedback visual** del estado de conexión
- ✅ **Contexto global** para el estado del servidor

## 🚀 Componentes Implementados

### 1. **Hook de Estado del Servidor** (`useServerStatus`)
```typescript
import { useServerStatus } from '@/hooks/useServerStatus'

const { status, responseTime, retryCount, isWarmingUp, checkServerStatus, warmUpServer } = useServerStatus()
```

**Estados disponibles:**
- `checking`: Verificando servidor
- `online`: Servidor funcionando
- `cold-start`: Servidor iniciando
- `offline`: Servidor no disponible
- `error`: Error de conexión

### 2. **Contexto Global** (`ServerStatusContext`)
```typescript
import { useServerState, useServerActions } from '@/context/ServerStatusContext'

// En cualquier componente
const { status, responseTime } = useServerState()
const { checkServerStatus, warmUpServer } = useServerActions()
```

### 3. **Loader Inteligente** (`ColdStartLoader`)
```typescript
import ColdStartLoader from '@/components/ui/ColdStartLoader'

<ColdStartLoader
  status={status}
  responseTime={responseTime}
  retryCount={retryCount}
  isWarmingUp={isWarmingUp}
  onRetry={handleRetry}
  onWarmUp={handleWarmUp}
/>
```

### 4. **Loader Consciente del Servidor** (`ServerAwareLoader`)
```typescript
import ServerAwareLoader from '@/components/ui/ServerAwareLoader'

<ServerAwareLoader
  isLoading={loading}
  error={error}
  showServerStatus={true}
  onRetry={handleRetry}
  onWarmUp={handleWarmUp}
>
  {/* Tu contenido aquí */}
</ServerAwareLoader>
```

### 5. **Cliente API Mejorado** (`apiClient`)
```typescript
import { apiClient } from '@/lib/api/apiClient'

// Detección automática de cold start
// Reintentos inteligentes
// Timeouts adaptativos
```

### 6. **Hook de Peticiones Inteligentes** (`useApiWithRetry`)
```typescript
import { useSmartApiRequest } from '@/hooks/useApiWithRetry'

const { data, loading, error, smartRequest } = useSmartApiRequest()

// Petición que maneja automáticamente cold starts
await smartRequest(() => apiClient.get('/api/data'))
```

## 📱 Componentes de UI

### **Barra de Estado** (`ServerStatusBar`)
- Se muestra automáticamente cuando hay problemas
- Posición fija en la esquina inferior derecha
- Desaparece cuando el servidor está online

### **Estado en Header** (`HeaderServerStatus`)
- Indicador compacto en headers
- Solo visible cuando hay problemas

### **Loader Animado** (`ColdStartLoader`)
- Animación de progreso durante cold start
- Botones de acción (reintentar, calentar)
- Información detallada del estado

## 🔧 Configuración

### **1. Layout Principal**
```typescript
// app/layout.tsx
import { ServerStatusProvider } from '@/context/ServerStatusContext'
import ServerStatusBar from '@/components/layout/ServerStatusBar'

export default function RootLayout({ children }) {
  return (
    <ServerStatusProvider>
      {children}
      <ServerStatusBar />
    </ServerStatusProvider>
  )
}
```

### **2. En Componentes**
```typescript
import { useServerState } from '@/context/ServerStatusContext'
import ServerAwareLoader from '@/components/ui/ServerAwareLoader'

export default function MiComponente() {
  const { status } = useServerState()
  
  return (
    <ServerAwareLoader showServerStatus={true}>
      {/* Tu contenido */}
    </ServerAwareLoader>
  )
}
```

### **3. Con Peticiones API**
```typescript
import { useSmartApiRequest } from '@/hooks/useApiWithRetry'

export default function MiComponente() {
  const { data, loading, error, smartRequest } = useSmartApiRequest()
  
  const handleFetch = async () => {
    await smartRequest(() => apiClient.get('/api/data'))
  }
}
```

## 🎨 Personalización

### **Colores y Estilos**
Los componentes usan Tailwind CSS y pueden personalizarse:

```typescript
// Estados de color
const statusColors = {
  online: 'text-green-600 bg-green-50',
  'cold-start': 'text-orange-600 bg-orange-50',
  offline: 'text-red-600 bg-red-50',
  error: 'text-red-600 bg-red-50'
}
```

### **Timeouts y Reintentos**
```typescript
// En apiClient.ts
private retryDelays = [1000, 2000, 4000] // Delays exponenciales
config.timeout = this.coldStartDetected ? 45000 : 10000 // Timeouts adaptativos
```

### **Mensajes Personalizados**
```typescript
const messages = {
  'cold-start': 'El servidor se está iniciando, esto puede tomar unos segundos',
  offline: 'No se puede conectar al servidor',
  error: 'Ocurrió un error al conectar con el servidor'
}
```

## 🔍 Monitoreo

### **Logs del Sistema**
El sistema registra automáticamente:
- Tiempos de respuesta
- Número de reintentos
- Estados del servidor
- Errores de conexión

### **Métricas Disponibles**
- `responseTime`: Tiempo de respuesta en ms
- `retryCount`: Número de reintentos
- `status`: Estado actual del servidor
- `isWarmingUp`: Si se está calentando el servidor

## 🚀 Optimizaciones

### **1. Detección Inteligente**
- Detecta cold starts por tiempo de respuesta (>3s)
- Ajusta timeouts automáticamente
- Usa delays exponenciales para reintentos

### **2. Calentamiento Proactivo**
- Petición ligera a `/health` para calentar
- Headers especiales para identificar warm-up
- Manejo de errores en calentamiento

### **3. UX Mejorada**
- Loaders animados con progreso
- Mensajes informativos
- Botones de acción claros
- Transiciones suaves

## 📊 Beneficios

### **Para el Usuario**
- ✅ Experiencia fluida durante cold starts
- ✅ Feedback visual claro del estado
- ✅ Opción de acelerar el proceso
- ✅ Sin pantallas en blanco

### **Para el Desarrollador**
- ✅ Sistema automático y transparente
- ✅ Fácil integración en componentes existentes
- ✅ Configuración flexible
- ✅ Monitoreo integrado

### **Para el Sistema**
- ✅ Manejo robusto de errores
- ✅ Reintentos inteligentes
- ✅ Optimización de recursos
- ✅ Escalabilidad

## 🔧 Troubleshooting

### **Problema: No se detecta el cold start**
**Solución:** Verificar que el endpoint `/health` esté disponible y público

### **Problema: Reintentos infinitos**
**Solución:** Ajustar `maxRetries` en la configuración

### **Problema: Timeouts muy largos**
**Solución:** Modificar los delays en `retryDelays`

### **Problema: No se muestra el loader**
**Solución:** Verificar que `ServerStatusProvider` esté en el layout

## 📝 Ejemplo Completo

```typescript
'use client'

import { useServerState, useServerActions } from '@/context/ServerStatusContext'
import { useSmartApiRequest } from '@/hooks/useApiWithRetry'
import ServerAwareLoader from '@/components/ui/ServerAwareLoader'
import { apiClient } from '@/lib/api/apiClient'

export default function MiPagina() {
  const { status, responseTime } = useServerState()
  const { checkServerStatus, warmUpServer } = useServerActions()
  
  const { data, loading, error, smartRequest } = useSmartApiRequest()
  
  const handleFetchData = async () => {
    await smartRequest(() => apiClient.get('/api/mis-datos'))
  }
  
  return (
    <ServerAwareLoader
      isLoading={loading}
      error={error}
      showServerStatus={true}
      onRetry={handleFetchData}
      onWarmUp={warmUpServer}
    >
      <div>
        <h1>Mi Página</h1>
        <p>Estado del servidor: {status}</p>
        {responseTime && <p>Tiempo de respuesta: {responseTime}ms</p>}
        <button onClick={handleFetchData}>Cargar Datos</button>
      </div>
    </ServerAwareLoader>
  )
}
```

## 🎯 Próximos Pasos

1. **Integrar en componentes existentes** usando `ServerAwareLoader`
2. **Personalizar mensajes** según tu aplicación
3. **Ajustar timeouts** según las necesidades de tu servidor
4. **Agregar métricas** adicionales si es necesario
5. **Optimizar** basándose en el uso real

¡Con esta solución, los cold starts de Fly.io ya no serán un problema para tus usuarios! 🚀 