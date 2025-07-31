# Solución: Rate Limiting en Health Checks

## Problema Identificado

El sistema estaba experimentando un exceso de logs de rate limiting debido a múltiples componentes que hacían peticiones frecuentes al endpoint `/health`:

```
[Nest] WARN [SecurityMiddleware] Rate limit general excedido para IP: 172.16.3.138
```

### Causas del Problema

1. **Múltiples componentes verificando estado del servidor**:
   - `useServerStatus` hook: Verificaciones cada 30 segundos
   - `BackendStatus` component: Verificaciones al cargar
   - `apiClient`: Métodos de health check y warm up
   - `useBackendStatus` hook: Verificaciones adicionales

2. **Rate limiting configurado para 100 peticiones en 15 minutos** (900000 ms)

3. **Peticiones redundantes sin cache** cuando el servidor está en cold start o offline

## Solución Implementada

### 1. Exclusión de Health Checks del Rate Limiting

**Archivo**: `iam-backend/src/common/middleware/security.middleware.ts`

```typescript
use(req: Request, res: Response, next: NextFunction) {
  // NUEVO: Excluir endpoints de health check del rate limiting
  if (req.path === '/health' || req.path.startsWith('/health/')) {
    // Solo aplicar headers de seguridad para health checks
    this.addSecurityHeaders(res);
    return next();
  }
  
  // ... resto del código de rate limiting
}
```

**Beneficios**:
- ✅ Health checks no afectan el rate limiting general
- ✅ Mantiene seguridad con headers apropiados
- ✅ Permite monitoreo continuo del servidor

### 2. Optimización de Intervalos de Verificación

**Archivo**: `iam-frontend/src/hooks/useServerStatus.ts`

```typescript
// Configurar verificación periódica con intervalos más inteligentes
const interval = setInterval(() => {
  const now = Date.now()
  const lastCheckTime = state.lastCheck?.getTime() || 0
  const timeSinceLastCheck = now - lastCheckTime
  
  // Solo verificar si han pasado al menos 60 segundos desde la última verificación
  if (timeSinceLastCheck >= 60000) {
    if (state.status === 'offline' || state.status === 'error') {
      checkServerStatus()
    } else if (state.status === 'online' && timeSinceLastCheck >= 300000) {
      // Para servidores online, verificar cada 5 minutos
      checkServerStatus()
    }
  }
}, 60000) // Verificar cada minuto en lugar de cada 30 segundos
```

**Cambios**:
- ⏱️ Intervalo aumentado de 30s a 60s
- 🧠 Verificación inteligente basada en estado del servidor
- 📊 Servidores online verificados cada 5 minutos

### 3. Sistema de Cache Implementado

**Archivo**: `iam-frontend/src/components/ui/BackendStatus.tsx`

```typescript
useEffect(() => {
  // Solo verificar si no se ha verificado recientemente
  const lastCheck = sessionStorage.getItem('backendStatusLastCheck')
  const now = Date.now()
  
  if (!lastCheck || (now - parseInt(lastCheck)) > 30000) { // 30 segundos de cache
    checkBackendStatus()
    sessionStorage.setItem('backendStatusLastCheck', now.toString())
  } else {
    // Usar el estado cacheado
    const cachedStatus = sessionStorage.getItem('backendStatus')
    if (cachedStatus) {
      setStatus(cachedStatus as 'online' | 'offline' | 'checking')
    } else {
      checkBackendStatus()
    }
  }
}, [])
```

**Archivo**: `iam-frontend/src/lib/api/apiClient.ts`

```typescript
// Método para verificar el estado del servidor con cache
async checkServerHealth(): Promise<{ status: string; responseTime: number }> {
  // Verificar cache primero
  const cachedHealth = sessionStorage.getItem('apiClientHealthCache')
  if (cachedHealth) {
    const parsed = JSON.parse(cachedHealth)
    const now = Date.now()
    if (now - parsed.timestamp < 30000) { // 30 segundos de cache
      return parsed.data
    }
  }
  
  // ... resto del código con guardado en cache
}
```

**Beneficios del Cache**:
- 🚀 Reduce peticiones redundantes
- 💾 Cache de 30 segundos para health checks
- 💾 Cache de 1 minuto para warm up
- 📱 Mejora experiencia del usuario

## Configuración de Rate Limiting

### Límites Actuales

```typescript
// iam-backend/src/config/security.config.ts
rateLimit: {
  limits: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: process.env.NODE_ENV === 'development' ? 1000 : 100,
      blockDuration: 15 * 60 * 1000, // 15 minutos de bloqueo
    },
    // ... otros límites específicos
  }
}
```

### Endpoints Excluidos del Rate Limiting

- ✅ `/health` - Health check básico
- ✅ `/health/complete` - Health check completo
- ✅ `/health/database` - Estado de base de datos
- ✅ `/health/connections` - Pool de conexiones
- ✅ `/health/redis` - Estado de Redis
- ✅ `/health/system` - Estadísticas del sistema

## Monitoreo y Logs

### Logs de Seguridad Mantenidos

- 🔒 Acceso a rutas sensibles
- 🚨 Actividad sospechosa detectada
- 📊 Rate limiting para endpoints protegidos

### Logs Eliminados

- ❌ Rate limiting en health checks (ahora excluidos)
- ❌ Peticiones redundantes de health check

## Verificación de la Solución

### 1. Verificar que los health checks funcionan

```bash
curl http://localhost:3001/health
```

### 2. Verificar que el rate limiting sigue funcionando para otros endpoints

```bash
# Hacer múltiples peticiones a un endpoint protegido
for i in {1..150}; do
  curl http://localhost:3001/api/protected-endpoint
done
```

### 3. Verificar logs del servidor

```bash
# Los logs de rate limiting en /health deberían haber desaparecido
# Solo deberían aparecer para endpoints protegidos
```

## Beneficios de la Solución

1. **🎯 Eliminación de logs de rate limiting en health checks**
2. **⚡ Mejor rendimiento del frontend** con sistema de cache
3. **🛡️ Mantenimiento de seguridad** en endpoints protegidos
4. **📊 Monitoreo continuo** sin afectar rate limiting
5. **🔧 Configuración flexible** para diferentes entornos

## Próximos Pasos

1. **Monitorear logs** para confirmar que el problema está resuelto
2. **Ajustar intervalos** si es necesario según el uso
3. **Considerar implementar** health checks más sofisticados si es necesario
4. **Documentar** la configuración para el equipo de desarrollo 