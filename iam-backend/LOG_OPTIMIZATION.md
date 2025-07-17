# Optimización de Logs - Backend

## 🔍 **Problema Identificado**

Los logs de debug del pool de conexiones de Prisma se estaban generando cada 30 segundos en producción, creando ruido innecesario:

```
[Nest] DEBUG [PrismaService] Estadísticas del pool de conexiones:
[Nest] DEBUG [PrismaService] Object(3) {
  activas: 1,
  totales: 8,
  timestamp: 2025-07-17T22:35:01.676Z
}
```

## ✅ **Soluciones Implementadas**

### 1. **Logs Condicionales por Entorno**

#### Antes:
```typescript
// Siempre mostraba logs de debug
if (this.connectionPoolStats.activeConnections > 0) {
  this.logger.debug('Estadísticas del pool de conexiones:', {...});
}
```

#### Después:
```typescript
// Solo en desarrollo
if (process.env.NODE_ENV === 'development' && this.connectionPoolStats.activeConnections > 0) {
  this.logger.debug('Estadísticas del pool de conexiones:', {...});
}
```

### 2. **Intervalo de Monitoreo Optimizado**

#### Antes:
```typescript
setInterval(async () => {
  // Monitoreo cada 30 segundos
}, 30000);
```

#### Después:
```typescript
setInterval(async () => {
  // Monitoreo cada 60 segundos en producción, 30 en desarrollo
}, process.env.NODE_ENV === 'production' ? 60000 : 30000);
```

### 3. **Configuración de Prisma por Entorno**

#### Antes:
```typescript
log: [
  { emit: 'stdout', level: 'error' },
  { emit: 'stdout', level: 'warn' },
  { emit: 'stdout', level: 'info' },
],
```

#### Después:
```typescript
log: process.env.NODE_ENV === 'production' 
  ? [
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ]
  : [
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
      { emit: 'stdout', level: 'info' },
      { emit: 'stdout', level: 'query' },
    ],
```

## 📊 **Configuración por Entorno**

### 🚀 **Producción**
- **Logs**: Solo error y warning
- **Monitoreo**: Cada 60 segundos
- **Debug**: Deshabilitado
- **Queries**: No se muestran

### 🔧 **Desarrollo**
- **Logs**: Error, warning, info y query
- **Monitoreo**: Cada 30 segundos
- **Debug**: Habilitado
- **Queries**: Se muestran para debugging

## 🛠️ **Scripts de Verificación**

### `scripts/optimize-logs.js`
Verifica la configuración de logs:
```bash
node scripts/optimize-logs.js
```

**Salida esperada:**
```
🔧 Optimizando configuración de logs...

📋 Configuración actual de logs:
  🌍 NODE_ENV: development
  ✅ Logs condicionales configurados
  ✅ Monitoreo de conexiones configurado
  ✅ Intervalo optimizado configurado
  ✅ Logger configurado por entorno
```

## 📋 **Variables de Entorno**

### **Críticas:**
```bash
NODE_ENV=production  # Controla el nivel de logs
```

### **Opcionales:**
```bash
LOG_LEVEL=error      # Nivel mínimo de logs
DEBUG=false          # Deshabilitar logs de debug
```

## 🎯 **Beneficios**

### **En Producción:**
- ✅ **Menos ruido**: Solo logs importantes
- ✅ **Mejor rendimiento**: Menos I/O de logs
- ✅ **Monitoreo eficiente**: Cada 60 segundos
- ✅ **Logs limpios**: Fáciles de analizar

### **En Desarrollo:**
- ✅ **Debugging completo**: Todos los logs disponibles
- ✅ **Monitoreo frecuente**: Cada 30 segundos
- ✅ **Queries visibles**: Para optimización
- ✅ **Información detallada**: Pool de conexiones

## 🔧 **Comandos Útiles**

### **Verificar Configuración:**
```bash
# Verificar configuración de logs
node scripts/optimize-logs.js

# Ver logs en tiempo real
fly logs --app iam-backend-baruk --follow

# Ver logs específicos
fly logs --app iam-backend-baruk | grep "PrismaService"
```

### **Cambiar Nivel de Logs:**
```bash
# En producción (menos verboso)
fly secrets set NODE_ENV=production

# En desarrollo (más verboso)
fly secrets set NODE_ENV=development
```

## 📈 **Métricas de Mejora**

### **Antes:**
- Logs cada 30 segundos
- Debug siempre activo
- Queries visibles en producción
- Ruido innecesario

### **Después:**
- Logs cada 60 segundos en producción
- Debug solo en desarrollo
- Queries solo en desarrollo
- Logs limpios y relevantes

## 🚀 **Deploy de Cambios**

Para aplicar estos cambios:

```bash
# 1. Verificar configuración
node scripts/optimize-logs.js

# 2. Compilar
npm run build

# 3. Deploy
./scripts/deploy.sh

# 4. Verificar logs
fly logs --app iam-backend-baruk --limit 20
```

## 💡 **Próximas Mejoras**

### **Inmediatas:**
1. ✅ Logs condicionales implementados
2. ✅ Intervalo optimizado
3. ✅ Configuración por entorno

### **A Mediano Plazo:**
1. Implementar log rotation
2. Configurar alertas de logs
3. Centralizar logs con ELK Stack
4. Implementar structured logging

### **A Largo Plazo:**
1. Logs distribuidos
2. Análisis de logs con ML
3. Auto-scaling basado en logs
4. Predictive logging

## 🔗 **Recursos Útiles**

- [NestJS Logging](https://docs.nestjs.com/techniques/logger)
- [Prisma Logging](https://www.prisma.io/docs/concepts/components/prisma-client/logging)
- [Node.js Logging Best Practices](https://nodejs.org/en/docs/guides/logging/)
- [Production Logging](https://12factor.net/logs) 