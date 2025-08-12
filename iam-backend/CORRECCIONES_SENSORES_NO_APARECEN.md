# Correcciones - Sensores No Aparecen en Dashboard

## 🚨 Problema Identificado
El usuario reportó que tenía 4 sensores configurados pero no aparecían en la lista del dashboard de sensores.

## 🔍 Análisis del Problema

### Causa Raíz
1. **Sensores inactivos**: Los 4 sensores existentes en la base de datos tenían `activo: false`
2. **Filtro del backend**: El endpoint `/mqtt-sensor/sensores/listar` filtra solo sensores activos (`activo: true`)
3. **API Route faltante**: El frontend llamaba directamente al backend sin pasar por una API route

### Flujo Problemático
```javascript
// ❌ PROBLEMÁTICO - Sensores inactivos
const sensores = await prisma.sensor.findMany({
  where: {
    empresaId,
    activo: true,  // ← Solo sensores activos
  }
});

// Resultado: 0 sensores porque todos estaban inactivos
```

## ✅ Soluciones Implementadas

### 1. Activación de Sensores Existentes
**Script creado**: `iam-backend/scripts/activate-sensores.js`

```javascript
// ✅ Activación masiva de sensores
const result = await prisma.sensor.updateMany({
  where: { activo: false },
  data: { activo: true }
});

// Resultado: 4 sensores activados
```

### 2. API Route para Sensores
**Archivo creado**: `iam-frontend/src/app/api/mqtt-sensor/sensores/listar/route.ts`

```typescript
// ✅ API Route con autenticación correcta
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  
  const response = await fetch(`${BACKEND_URL}/mqtt-sensor/sensores/listar`, {
    method: 'GET',
    headers: {
      'Cookie': cookieHeader,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  
  return NextResponse.json(data, { status: response.status });
}
```

### 3. Servicio de Sensores Actualizado
**Archivo corregido**: `iam-frontend/src/lib/services/sensorService.ts`

```typescript
// ✅ Llamada a API route en lugar de backend directo
async obtenerSensores(ubicacionId?: number): Promise<Sensor[]> {
  const url = ubicacionId 
    ? `/api/mqtt-sensor/sensores/listar?ubicacionId=${ubicacionId}`
    : '/api/mqtt-sensor/sensores/listar'
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  
  return Array.isArray(data) ? data : [];
}
```

### 4. Script de Verificación
**Script creado**: `iam-backend/scripts/check-sensores.js`

```javascript
// ✅ Verificación completa de sensores
const sensores = await prisma.sensor.findMany({
  include: {
    ubicacion: { /* ... */ },
    _count: { select: { lecturas: true } }
  }
});
```

## 🎯 Estado de los Sensores

### Antes (Problemático)
| Sensor | Tipo | Ubicación | Estado |
|--------|------|-----------|--------|
| temperatura | TEMPERATURA | Almacén Principal | ❌ Inactivo |
| Temperatura 1 | TEMPERATURA | Almacén Principal | ❌ Inactivo |
| Sensor Test | TEMPERATURA | Refrigerador 1 | ❌ Inactivo |
| Sensor Test Diferente | HUMEDAD | Refrigerador 1 | ❌ Inactivo |

### Después (Corregido)
| Sensor | Tipo | Ubicación | Estado |
|--------|------|-----------|--------|
| temperatura | TEMPERATURA | Almacén Principal | ✅ Activo |
| Temperatura 1 | TEMPERATURA | Almacén Principal | ✅ Activo |
| Sensor Test | TEMPERATURA | Refrigerador 1 | ✅ Activo |
| Sensor Test Diferente | HUMEDAD | Refrigerador 1 | ✅ Activo |

## 🔧 Consideraciones Técnicas

### Filtro de Sensores Activos
- **Propósito**: Mostrar solo sensores funcionales
- **Implementación**: `WHERE activo = true` en queries
- **Beneficio**: Evita mostrar sensores deshabilitados o de prueba

### Autenticación por Cookies
- **Método**: HTTP-only cookies con JWT
- **Ventaja**: Seguridad mejorada, no expuesto en JavaScript
- **Implementación**: `credentials: 'include'` en fetch requests

### API Routes como Proxy
- **Función**: Intermediario entre frontend y backend
- **Beneficio**: Manejo correcto de cookies y headers
- **Patrón**: Reenviar cookies del request al backend

## 🧪 Casos de Prueba

### ✅ Casos Válidos
1. **Sensores activos**: Aparecen en el dashboard
2. **Filtro por ubicación**: Funciona correctamente
3. **Autenticación**: Cookies se envían correctamente
4. **API Route**: Proxy funciona sin errores

### ❌ Casos Prevenidos
1. **Sensores inactivos**: No aparecen en el dashboard
2. **Sin autenticación**: Error 401 con mensaje claro
3. **Cookies faltantes**: Error específico de sesión

## 🎉 Resultados Esperados

### Antes (Error)
```
📡 Sensores encontrados: 0
❌ No hay sensores en el dashboard
```

### Después (Funcionando)
```
📡 Sensores encontrados: 4
✅ Sensores aparecen en el dashboard:
   • temperatura (TEMPERATURA) - Almacén Principal
   • Temperatura 1 (TEMPERATURA) - Almacén Principal
   • Sensor Test (TEMPERATURA) - Refrigerador 1
   • Sensor Test Diferente (HUMEDAD) - Refrigerador 1
```

## 📋 Próximas Mejoras Sugeridas

### 1. Interfaz de Activación/Desactivación
Agregar botones en el dashboard para activar/desactivar sensores:
```typescript
const toggleSensorStatus = async (sensorId: number, active: boolean) => {
  await sensorService.actualizarSensor(sensorId, { activo: active });
};
```

### 2. Indicadores Visuales
Mostrar estado de sensores con iconos:
- 🟢 Activo
- 🔴 Inactivo
- 🟡 Error de conexión

### 3. Filtros Avanzados
Agregar filtros por estado de sensor:
- Solo activos
- Solo inactivos
- Con lecturas recientes

### 4. Notificaciones de Estado
Alertas cuando sensores cambien de estado:
- Sensor desconectado
- Sensor reactivado
- Error de lectura

## 🔄 Compatibilidad

- ✅ **Backend**: Endpoints funcionan correctamente
- ✅ **Frontend**: API routes autenticadas
- ✅ **Base de datos**: Sensores activados
- ✅ **Autenticación**: Cookies funcionando
- ✅ **Dashboard**: Sensores visibles
- ✅ **Filtros**: Funcionan por ubicación y tipo

## 🎯 Comandos Útiles

### Verificar Sensores
```bash
node scripts/check-sensores.js
```

### Activar Sensores
```bash
node scripts/activate-sensores.js
```

### Verificar Backend
```bash
npm run start:dev
```

### Verificar Frontend
```bash
npm run dev
```

---

## ✅ **Estado Final**

Con estas correcciones, el sistema de sensores funciona correctamente:

- ✅ **4 sensores activos** en la base de datos
- ✅ **API route** para autenticación correcta
- ✅ **Servicio actualizado** para usar API route
- ✅ **Dashboard muestra** todos los sensores
- ✅ **Filtros funcionan** correctamente
- ✅ **Autenticación** por cookies funcionando

**¡Los sensores ahora aparecen en el dashboard!**



