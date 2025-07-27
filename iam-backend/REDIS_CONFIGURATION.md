# Configuración de Redis con Variables de Entorno

## 📋 Resumen

Este documento explica cómo configurar Redis en el proyecto IAM usando variables de entorno en lugar de hardcodear las credenciales.

## 🔧 Configuración Actual

### Variables de Entorno Configuradas

```bash
# Redis Cloud Configuration
REDIS_HOST=redis-16076.c16.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=16076
REDIS_PASSWORD=Md5zvlTV8Pq7lC1zh27qsltGE4nrwp1d
REDIS_DB=0
```

## 🚀 Cómo Usar

### 1. Configuración en Producción

Las variables ya están configuradas en `env.production`:

```bash
# Copiar configuración de producción
cp env.production .env
```

### 2. Configuración en Desarrollo

Para desarrollo, puedes usar Redis local o Redis Cloud:

#### Opción A: Redis Local (Recomendado para desarrollo)
```bash
# En tu archivo .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

#### Opción B: Redis Cloud (Para pruebas con producción)
```bash
# En tu archivo .env
REDIS_HOST=redis-16076.c16.us-east-1-3.ec2.redns.redis-cloud.com
REDIS_PORT=16076
REDIS_PASSWORD=Md5zvlTV8Pq7lC1zh27qsltGE4nrwp1d
REDIS_DB=0
```

### 3. Probar la Conexión

```bash
# Probar conexión a Redis
npm run redis:test
```

## 🔍 Servicios que Usan Redis

### 1. **KPICacheService**
- Cache para métricas y KPIs del dashboard
- TTL: 5 minutos
- Ubicación: `src/common/services/kpi-cache.service.ts`

### 2. **ImportacionCacheService**
- Cache para procesos de importación
- TTL: 30 minutos
- Ubicación: `src/importacion/servicios/importacion-cache.service.ts`

### 3. **ColasService**
- Colas de procesamiento con BullMQ
- Ubicación: `src/colas/colas.service.ts`

### 4. **RedisHealthService**
- Monitoreo de salud de Redis
- Ubicación: `src/common/services/redis-health.service.ts`

## ⚙️ Configuración Avanzada

### Variables de Cache

```bash
# TTL (Time To Live) en segundos
CACHE_TTL_KPIS=300          # 5 minutos para KPIs
CACHE_TTL_IMPORTACION=1800  # 30 minutos para importación
CACHE_TTL_PLANTILLAS=3600   # 1 hora para plantillas
CACHE_TTL_TRABAJOS=7200     # 2 horas para trabajos

# Configuración de fallback
REDIS_FALLBACK_ENABLED=true
CACHE_DEBUG_ENABLED=false
```

### Configuración de Colas

```bash
# Configuración de BullMQ
QUEUE_CONCURRENCY=2
QUEUE_MAX_RETRIES=3
QUEUE_BACKOFF_DELAY=2000
```

## 🛠️ Servicios de Configuración

### RedisConfigService

El servicio principal que maneja la configuración de Redis:

```typescript
// Ubicación: src/common/services/redis-config.service.ts

// Para redis package (KPIs)
getRedisConfig(): any

// Para ioredis package (Colas)
getIORedisConfig(): any

// Verificar si Redis está configurado
isRedisConfigured(): boolean
```

## 🔒 Seguridad

### ✅ Mejores Prácticas Implementadas

1. **Variables de Entorno**: Credenciales no hardcodeadas
2. **Fallback**: Sistema continúa sin Redis si falla
3. **Timeouts Optimizados**: Configuración robusta para evitar timeouts
4. **Monitoreo**: Servicio de salud de Redis
5. **Logging**: Logs estructurados para debugging

### 🚨 Consideraciones de Seguridad

1. **Nunca committear credenciales** en el repositorio
2. **Usar archivos .env** para configuración local
3. **Variables de entorno** en producción
4. **Rotación de contraseñas** periódica

## 🐛 Troubleshooting

### Error: "Redis no configurado"

```bash
# Verificar variables de entorno
echo $REDIS_HOST
echo $REDIS_PORT
echo $REDIS_PASSWORD

# Probar conexión
npm run redis:test
```

### Error: "Connection timeout"

```bash
# Verificar conectividad
telnet redis-16076.c16.us-east-1-3.ec2.redns.redis-cloud.com 16076

# Verificar firewall
# Verificar configuración de red
```

### Error: "Authentication failed"

```bash
# Verificar contraseña
echo $REDIS_PASSWORD

# Verificar formato de contraseña
# No debe tener espacios extra o caracteres especiales
```

## 📊 Monitoreo

### Endpoints de Salud

```bash
# Estado general del sistema
GET /health

# Estado específico de Redis
GET /health/redis

# Estadísticas del sistema
GET /health/system
```

### Métricas Disponibles

- **Latencia**: Tiempo de respuesta de Redis
- **Tasa de Éxito**: Porcentaje de comandos exitosos
- **Uso de Memoria**: Memoria utilizada vs máxima
- **Uptime**: Tiempo de funcionamiento
- **Comandos**: Total y fallidos

## 🔄 Migración desde Configuración Hardcodeada

### Antes (❌ No usar)
```typescript
const client = createClient({
    username: 'default',
    password: 'Md5zvlTV8Pq7lC1zh27qsltGE4nrwp1d',
    socket: {
        host: 'redis-16076.c16.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 16076
    }
});
```

### Después (✅ Usar)
```typescript
// Usar RedisConfigService
const redisConfig = this.redisConfigService.getRedisConfig();
const client = createClient(redisConfig);
```

## 📝 Notas Adicionales

1. **Redis Cloud**: Plan gratuito con 30MB y 30 conexiones
2. **Upstash**: Alternativa recomendada para desarrollo
3. **Railway**: Otra opción para hosting de Redis
4. **Local**: Redis local para desarrollo

## 🔗 Enlaces Útiles

- [Redis Cloud Documentation](https://docs.redis.com/)
- [Upstash Redis](https://upstash.com/docs/redis)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS Redis](https://docs.nestjs.com/microservices/redis) 