# 📊 API de Movimientos de Inventario Diarios

## 🎯 Descripción

Este endpoint proporciona datos de movimientos de inventario agrupados por día, incluyendo entradas, salidas, valores monetarios y análisis de tendencias. Es el KPI más básico y universal para cualquier ERP.

## 🔗 Endpoint

```
GET /dashboard-cqrs/daily-movements
```

## 🔐 Autenticación

Requiere autenticación JWT con uno de los siguientes roles:
- `SUPERADMIN`
- `ADMIN` 
- `EMPLEADO`

## 📋 Parámetros de Query

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `days` | number | No | 7 | Número de días a consultar (1-365) |
| `forceRefresh` | boolean | No | false | Forzar recálculo ignorando cache |

## 📤 Respuesta

### Estructura de Respuesta

```typescript
{
  "data": DailyMovementData[],
  "summary": DailyMovementsSummary,
  "meta": {
    "empresaId": number,
    "source": string,
    "generatedAt": string,
    "daysRequested": number,
    "totalDays": number
  }
}
```

### Tipos de Datos

#### DailyMovementData
```typescript
{
  "fecha": string,           // YYYY-MM-DD
  "entradas": number,        // Cantidad de unidades que entraron
  "salidas": number,         // Cantidad de unidades que salieron
  "neto": number,           // Diferencia neta (entradas - salidas)
  "valorEntradas": number,   // Valor monetario de entradas
  "valorSalidas": number,    // Valor monetario de salidas
  "valorNeto": number        // Valor neto monetario
}
```

#### DailyMovementsSummary
```typescript
{
  "avgEntradasDiarias": number,    // Promedio de entradas por día
  "avgSalidasDiarias": number,     // Promedio de salidas por día
  "diaMaxActividad": string,       // Fecha con mayor actividad
  "totalMovimientos": number,      // Total de movimientos en el período
  "tendencia": "CRECIENTE" | "DECRECIENTE" | "ESTABLE"
}
```

## 📝 Ejemplos de Uso

### 1. Movimientos de 7 días (default)

```bash
curl -X GET "http://localhost:3000/dashboard-cqrs/daily-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta:**
```json
{
  "data": [
    {
      "fecha": "2024-07-13",
      "entradas": 45,
      "salidas": 32,
      "neto": 13,
      "valorEntradas": 1250.50,
      "valorSalidas": 890.25,
      "valorNeto": 360.25
    },
    {
      "fecha": "2024-07-14",
      "entradas": 38,
      "salidas": 41,
      "neto": -3,
      "valorEntradas": 1050.00,
      "valorSalidas": 1150.75,
      "valorNeto": -100.75
    }
  ],
  "summary": {
    "avgEntradasDiarias": 42.3,
    "avgSalidasDiarias": 38.7,
    "diaMaxActividad": "2024-07-15",
    "totalMovimientos": 77,
    "tendencia": "CRECIENTE"
  },
  "meta": {
    "empresaId": 1,
    "source": "cqrs",
    "generatedAt": "2024-07-19T10:30:00Z",
    "daysRequested": 7,
    "totalDays": 7
  }
}
```

### 2. Movimientos de 30 días

```bash
curl -X GET "http://localhost:3000/dashboard-cqrs/daily-movements?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Con forceRefresh

```bash
curl -X GET "http://localhost:3000/dashboard-cqrs/daily-movements?forceRefresh=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔄 Cache

- **TTL**: 5 minutos (300 segundos)
- **Clave**: `daily-movements:{empresaId}:{days}:{userRole}`
- **Invalidación**: Automática con `forceRefresh=true`

## 🛡️ Seguridad

### Validaciones
- ✅ `empresaId` debe ser positivo
- ✅ `days` debe estar entre 1 y 365
- ✅ Usuario debe pertenecer a la empresa
- ✅ Roles autorizados verificados

### Multi-tenancy
- 🔒 Datos aislados por `empresaId`
- 🔒 Cache separado por empresa
- 🔒 Validación de pertenencia de usuario

## 📊 Casos de Uso

### 1. Dashboard Principal
```javascript
// Obtener datos para gráfica de líneas
const response = await fetch('/dashboard-cqrs/daily-movements?days=7');
const data = await response.json();

// Usar en gráfica
const chartData = data.data.map(day => ({
  fecha: day.fecha,
  entradas: day.entradas,
  salidas: day.salidas,
  neto: day.neto
}));
```

### 2. Análisis de Tendencias
```javascript
// Obtener tendencia del mes
const response = await fetch('/dashboard-cqrs/daily-movements?days=30');
const data = await response.json();

console.log('Tendencia:', data.summary.tendencia);
console.log('Día más activo:', data.summary.diaMaxActividad);
```

### 3. Monitoreo en Tiempo Real
```javascript
// Actualizar cada 5 minutos
setInterval(async () => {
  const response = await fetch('/dashboard-cqrs/daily-movements?forceRefresh=true');
  const data = await response.json();
  updateDashboard(data);
}, 5 * 60 * 1000);
```

## 🚨 Códigos de Error

| Código | Descripción |
|--------|-------------|
| 401 | No autorizado (token inválido) |
| 403 | Acceso denegado (rol insuficiente) |
| 400 | Parámetros inválidos |
| 500 | Error interno del servidor |

## 🔧 Testing

### Script de Prueba
```bash
# Ejecutar tests
node scripts/test-daily-movements.js

# Con variables de entorno
BASE_URL=http://localhost:3000 \
TEST_EMAIL=admin@test.com \
TEST_PASSWORD=password123 \
node scripts/test-daily-movements.js
```

### Tests Unitarios
```bash
# Ejecutar tests específicos
npm test -- --testPathPattern=get-daily-movements.handler.spec.ts
```

## 📈 Métricas de Rendimiento

- **Tiempo de respuesta**: < 200ms (con cache)
- **Throughput**: 1000+ requests/minuto
- **Uso de memoria**: < 50MB por request
- **Cache hit rate**: > 90%

## 🔄 Actualizaciones Automáticas

Los datos se actualizan automáticamente cuando:
- ✅ Se registra una compra (ENTRADA)
- ✅ Se registra una venta (SALIDA)
- ✅ Se hace ajuste de stock
- ✅ Se procesa devolución
- ✅ Se registra merma/pérdida

**No requiere configuración adicional del usuario.** 