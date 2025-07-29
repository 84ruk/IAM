# Configuración de Health Checks para Producción

## 🎯 Objetivo

Configurar endpoints de health check seguros y optimizados para monitoreo en producción, permitiendo verificar el estado del servidor sin comprometer la seguridad.

## ✅ Endpoints Disponibles

### 1. **Health Check Básico**
```
GET /health
```

**Propósito**: Verificación rápida de disponibilidad del servidor
**Autenticación**: No requerida (público)
**Respuesta**:
```json
{
  "status": "ok",
  "timestamp": "2025-07-28T19:23:28.305Z",
  "uptime": 13.422078708,
  "environment": "development"
}
```

### 2. **Health Check Completo**
```
GET /health/complete
```

**Propósito**: Verificación completa del estado del sistema
**Autenticación**: No requerida (público)
**Respuesta**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-28T19:23:59.582Z",
  "uptime": 11.910719625,
  "environment": "development",
  "version": "0.0.1",
  "services": {
    "database": {
      "status": "ok",
      "message": "Conexión a la base de datos establecida",
      "poolStats": {
        "totalConnections": 7,
        "activeConnections": 1,
        "idleConnections": 4,
        "lastCheck": "2025-07-28T19:23:59.582Z"
      }
    },
    "system": {
      "memory": {
        "used": 106,
        "total": 112,
        "external": 6,
        "unit": "MB"
      },
      "cpu": {
        "user": 1255,
        "system": 267,
        "unit": "ms"
      }
    }
  },
  "checks": {
    "database": true,
    "memory": true,
    "uptime": true
  }
}
```

### 3. **Health Check de Base de Datos**
```
GET /health/database
```

**Propósito**: Verificación específica de la conexión a la base de datos
**Autenticación**: No requerida (público)

### 4. **Health Check de Pool de Conexiones**
```
GET /health/connections
```

**Propósito**: Estadísticas del pool de conexiones de la base de datos
**Autenticación**: No requerida (público)

## 🔒 Seguridad

### **Medidas Implementadas**

1. **Decorador @Public()**: Todos los endpoints de health check están marcados como públicos
2. **Sin Información Sensible**: Los endpoints no exponen información confidencial
3. **Timeouts**: Configurados para evitar bloqueos
4. **Rate Limiting**: Aplicado a nivel de aplicación

### **Configuración de Seguridad**

```typescript
// En el guard de autenticación
@Public()
@Get('health')
getHealth() {
  // Solo información básica de estado
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };
}
```

## 🚀 Configuración para Producción

### **Variables de Entorno**

```env
# Configuración de Health Check
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_INTERVAL=30000

# Configuración de Monitoreo
ENABLE_DETAILED_HEALTH=false  # En producción, usar solo /health básico
ENABLE_DATABASE_HEALTH=true
ENABLE_SYSTEM_HEALTH=true
```

### **Configuración de Load Balancer**

```nginx
# Nginx configuration
location /health {
    proxy_pass http://backend:3001/health;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeout para health checks
    proxy_connect_timeout 3s;
    proxy_send_timeout 3s;
    proxy_read_timeout 3s;
}
```

### **Configuración de Docker**

```dockerfile
# Health check en Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
```

## 📊 Monitoreo

### **Métricas a Monitorear**

1. **Disponibilidad**: Uptime del servidor
2. **Rendimiento**: Tiempo de respuesta de health checks
3. **Recursos**: Uso de memoria y CPU
4. **Base de Datos**: Estado de conexiones y pool
5. **Errores**: Tasa de errores en health checks

### **Alertas Recomendadas**

```yaml
# Ejemplo de configuración de alertas
alerts:
  - name: "Backend Down"
    condition: "health_check_failed"
    threshold: "1 failure"
    duration: "1m"
    
  - name: "High Memory Usage"
    condition: "memory_usage > 80%"
    threshold: "80%"
    duration: "5m"
    
  - name: "Database Connection Issues"
    condition: "database_health_failed"
    threshold: "1 failure"
    duration: "2m"
```

## 🔧 Implementación en Frontend

### **Componente BackendStatus**

```typescript
const checkBackendStatus = async () => {
  try {
    const response = await fetch(`${apiUrl}/health`, {
      signal: controller.signal,
      cache: 'no-store'
    })
    
    setIsBackendAvailable(response.ok)
  } catch (error) {
    setIsBackendAvailable(false)
  }
}
```

### **Hook useBackendStatus**

```typescript
export function useBackendStatus() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  
  const checkStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/health`, {
        cache: 'no-store'
      })
      setIsAvailable(response.ok)
    } catch (error) {
      setIsAvailable(false)
    }
  }
  
  return { isAvailable, checkStatus }
}
```

## 🎯 Mejores Prácticas

### **1. Simplicidad**
- Usar `/health` para verificaciones básicas
- Usar `/health/complete` solo cuando sea necesario

### **2. Performance**
- Timeouts cortos (3-5 segundos)
- Cache deshabilitado para health checks
- Respuestas ligeras

### **3. Seguridad**
- No exponer información sensible
- Usar decoradores `@Public()` apropiadamente
- Implementar rate limiting

### **4. Monitoreo**
- Configurar alertas automáticas
- Logs de health check failures
- Métricas de disponibilidad

## 🔄 Próximos Pasos

1. **Configurar alertas** en el sistema de monitoreo
2. **Implementar métricas** más detalladas
3. **Configurar load balancer** para health checks
4. **Documentar procedimientos** de troubleshooting
5. **Implementar health checks** para servicios externos

## 📝 Notas de Implementación

- ✅ Endpoints configurados correctamente
- ✅ Seguridad implementada
- ✅ Frontend actualizado
- ✅ Documentación completa
- ✅ Listo para producción 