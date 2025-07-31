# Solución Mejorada: Health Checks sin Cache

## 🎯 **Problema Original**

El sistema anterior usaba `sessionStorage` para cachear el estado del servidor, lo cual tenía varios problemas:

### ❌ **Problemas con el Cache Local**
1. **No funciona entre pestañas/ventanas** - Cada pestaña tenía su propio cache
2. **Se pierde al recargar** - El cache se resetea con cada refresh
3. **No sincronizado** - Cada componente tenía su propio cache independiente
4. **No escalable** - No funciona bien en entornos distribuidos (Vercel + Fly)

### 🏗️ **Entorno de Producción**
- **Frontend (Vercel)**: Serverless, múltiples instancias
- **Backend (Fly)**: Distribuido, múltiples regiones
- **Necesidad**: Health checks eficientes sin sobrecargar el sistema

## ✅ **Nueva Solución Implementada**

### 1. **Contexto Global Compartido**

**Archivo**: `iam-frontend/src/context/ServerStatusContext.tsx`

```typescript
export function ServerStatusProvider({ 
  children, 
  checkInterval = 60000, // 1 minuto por defecto
  maxRetries = 5,
  backoffMultiplier = 2
}: ServerStatusProviderProps) {
  // Estado global compartido entre todos los componentes
  const [state, setState] = useState<ServerStatusState>({
    status: 'checking',
    lastCheck: null,
    responseTime: null,
    retryCount: 0,
    isWarmingUp: false,
    lastSuccessfulCheck: null,
    consecutiveFailures: 0
  })
}
```

**Beneficios**:
- 🎯 **Estado único**: Un solo estado compartido por toda la aplicación
- 🔄 **Sincronización automática**: Todos los componentes se actualizan simultáneamente
- 🚀 **Sin cache local**: No depende de `sessionStorage` o `localStorage`
- 📱 **Funciona en todas las pestañas**: Estado sincronizado entre ventanas

### 2. **Backoff Exponencial Inteligente**

```typescript
// Calcular delay de backoff exponencial
const getBackoffDelay = useCallback(() => {
  if (state.consecutiveFailures === 0) return 0
  
  const baseDelay = 1000 // 1 segundo base
  const delay = baseDelay * Math.pow(backoffMultiplier, Math.min(state.consecutiveFailures - 1, 5))
  return Math.min(delay, 30000) // Máximo 30 segundos
}, [state.consecutiveFailures, backoffMultiplier])
```

**Características**:
- ⏱️ **Delays progresivos**: 1s, 2s, 4s, 8s, 16s, 30s (máximo)
- 🧠 **Inteligente**: Solo aplica backoff cuando hay fallos consecutivos
- 🔄 **Auto-reset**: Se resetea cuando el servidor vuelve a estar online

### 3. **Intervalos Adaptativos**

```typescript
// Determinar el intervalo apropiado
let interval: number

if (state.status === 'online' && state.lastSuccessfulCheck) {
  // Si el servidor está online, verificar cada 5 minutos
  interval = 5 * 60 * 1000
} else if (shouldRetry) {
  // Si hay errores, usar backoff exponencial
  interval = getBackoffDelay()
  if (interval === 0) interval = checkInterval
} else {
  // Intervalo base
  interval = checkInterval
}
```

**Estrategia**:
- 🟢 **Servidor online**: Verificación cada 5 minutos
- 🔴 **Servidor offline**: Backoff exponencial (1s → 30s)
- 🟡 **Servidor iniciando**: Verificación cada minuto

### 4. **Cancelación de Peticiones**

```typescript
// Cancelar petición anterior si existe
if (abortControllerRef.current) {
  abortControllerRef.current.abort()
}

abortControllerRef.current = new AbortController()
```

**Beneficios**:
- 🚫 **Evita peticiones duplicadas**: Cancela peticiones anteriores
- ⚡ **Mejor rendimiento**: No acumula peticiones pendientes
- 🎯 **Respuesta más rápida**: Prioriza la petición más reciente

### 5. **Hooks Especializados**

**Archivo**: `iam-frontend/src/hooks/useServerHealth.ts`

```typescript
// Hook para componentes que necesitan esperar al servidor
export function useServerReady() {
  const { isReady, isStarting, hasConnectivityIssues, forceCheck } = useServerHealth()
  
  return {
    isReady: isReady(),
    isStarting: isStarting(),
    hasIssues: hasConnectivityIssues(),
    retry: forceCheck
  }
}

// Hook para mostrar estado del servidor
export function useServerStatusDisplay() {
  const { status, responseTime, retryCount, getRecommendations } = useServerHealth()
  
  return {
    status,
    responseTime,
    retryCount,
    recommendations: getRecommendations(),
    showWarning: shouldShowWarning(),
    showError: shouldShowError(),
    severityLevel: getSeverityLevel()
  }
}
```

## 🎨 **Componentes Actualizados**

### 1. **BackendStatus Component**

```typescript
export function BackendStatus({ children }: BackendStatusProps) {
  const { 
    status, 
    isServerAvailable, 
    forceCheck,
    retryCount,
    responseTime 
  } = useServerStatus()

  // Usa el contexto global en lugar de estado local
}
```

### 2. **ServerStatusBar Component**

```typescript
export default function ServerStatusBar() {
  const { 
    status, 
    isServerAvailable, 
    responseTime, 
    retryCount, 
    lastCheck,
    forceCheck 
  } = useServerStatus()

  // Barra flotante con información en tiempo real
}
```

### 3. **API Client**

```typescript
// Método para verificar el estado del servidor
async checkServerHealth(): Promise<{ status: string; responseTime: number }> {
  const startTime = Date.now()
  
  try {
    const response = await this.instance.get('/health', { 
      timeout: 5000,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    // Sin cache, siempre verifica el estado real
  } catch {
    // Manejo de errores sin cache
  }
}
```

## 📊 **Configuración y Personalización**

### **Provider Configuration**

```typescript
<ServerStatusProvider
  checkInterval={60000}        // 1 minuto base
  maxRetries={5}              // Máximo 5 reintentos
  backoffMultiplier={2}       // Multiplicador exponencial
>
  {children}
</ServerStatusProvider>
```

### **Variables de Entorno**

```bash
# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://tu-backend.fly.dev

# Backend (Fly)
NODE_ENV=production
RATE_LIMIT_MAX=100
```

## 🔧 **Uso en Componentes**

### **Componente que espera al servidor**

```typescript
function MyComponent() {
  const { isReady, isStarting, hasIssues, retry } = useServerReady()
  
  if (!isReady) {
    return (
      <div>
        {isStarting && <p>Servidor iniciando...</p>}
        {hasIssues && <button onClick={retry}>Reintentar</button>}
      </div>
    )
  }
  
  return <div>Contenido cuando el servidor está listo</div>
}
```

### **Componente que muestra estado**

```typescript
function StatusDisplay() {
  const { status, responseTime, recommendations, severityLevel } = useServerStatusDisplay()
  
  return (
    <div className={`alert alert-${severityLevel}`}>
      <p>Estado: {status}</p>
      {responseTime && <p>Tiempo: {responseTime}ms</p>}
      {recommendations.map(rec => <p key={rec}>{rec}</p>)}
    </div>
  )
}
```

## 🎯 **Beneficios de la Nueva Solución**

### ✅ **Ventajas Técnicas**
1. **Estado global único**: No más caches desincronizados
2. **Backoff exponencial**: Reduce carga en servidores con problemas
3. **Cancelación inteligente**: Evita peticiones duplicadas
4. **Intervalos adaptativos**: Optimiza según el estado del servidor
5. **Sin dependencias de cache**: Funciona en cualquier entorno

### ✅ **Ventajas de UX**
1. **Respuesta inmediata**: Estado actualizado en tiempo real
2. **Información detallada**: Tiempo de respuesta, reintentos, recomendaciones
3. **Interfaz intuitiva**: Barra de estado con detalles expandibles
4. **Acciones directas**: Botones para reintentar y verificar

### ✅ **Ventajas de Producción**
1. **Escalable**: Funciona con múltiples instancias de Vercel
2. **Robusto**: Maneja fallos de red y servidor
3. **Eficiente**: Minimiza peticiones innecesarias
4. **Monitoreable**: Logs detallados para debugging

## 🚀 **Implementación**

### **1. Instalar el Provider**

```typescript
// src/app/layout.tsx
import { ServerStatusProvider } from '@/context/ServerStatusContext'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ServerStatusProvider>
          <BackendStatus>
            {children}
            <ServerStatusBar />
          </BackendStatus>
        </ServerStatusProvider>
      </body>
    </html>
  )
}
```

### **2. Usar en Componentes**

```typescript
// Componente que necesita verificar estado
import { useServerHealth } from '@/hooks/useServerHealth'

function MyComponent() {
  const { isReady, forceCheck } = useServerHealth()
  
  if (!isReady()) {
    return <button onClick={forceCheck}>Verificar servidor</button>
  }
  
  return <div>Servidor listo!</div>
}
```

## 📈 **Monitoreo y Métricas**

### **Métricas Disponibles**
- ⏱️ Tiempo de respuesta promedio
- 🔄 Número de reintentos
- 📊 Tasa de éxito/fallo
- 🕐 Frecuencia de verificaciones
- 🚨 Fallos consecutivos

### **Logs de Debugging**
```typescript
// Los logs incluyen información detallada
console.log('Server status changed:', {
  status,
  responseTime,
  retryCount,
  consecutiveFailures,
  lastSuccessfulCheck
})
```

## 🔮 **Próximos Pasos**

1. **Implementar métricas**: Agregar tracking de performance
2. **WebSocket integration**: Para actualizaciones en tiempo real
3. **Service Worker**: Para verificaciones offline
4. **Analytics**: Tracking de problemas de conectividad
5. **Notificaciones**: Alertas push para problemas críticos

Esta solución elimina completamente la dependencia del cache local y proporciona un sistema robusto y escalable para health checks en entornos de producción distribuidos. 