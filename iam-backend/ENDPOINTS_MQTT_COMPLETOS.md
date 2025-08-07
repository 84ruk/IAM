# Endpoints MQTT Completos - Documentación

## 📋 Resumen

Este documento describe todos los endpoints disponibles en el controlador MQTT (`/mqtt-sensor`) que proporcionan funcionalidad completa para:

- ✅ Gestión de conexión MQTT con EMQX
- ✅ Gestión de dispositivos EMQX
- ✅ Gestión de sensores
- ✅ Lecturas de sensores
- ✅ Analytics y alertas
- ✅ Dashboard y monitoreo en tiempo real

## 🔐 Autenticación

Todos los endpoints requieren:
- **JWT Token** válido
- **Rol** de `SUPERADMIN` o `ADMIN`
- **Empresa** configurada

## 📡 Endpoints Disponibles

### 1. Estado y Configuración MQTT

#### GET `/mqtt-sensor/status`
Obtiene el estado actual del servicio MQTT.

**Respuesta:**
```json
{
  "enabled": true,
  "connected": true,
  "reconnectAttempts": 0
}
```

#### POST `/mqtt-sensor/toggle`
Habilita o deshabilita el servicio MQTT.

**Body:**
```json
{
  "enabled": true
}
```

**Respuesta:**
```json
{
  "message": "MQTT habilitado exitosamente",
  "status": {
    "enabled": true,
    "connected": true,
    "reconnectAttempts": 0
  }
}
```

### 2. Gestión de Dispositivos EMQX

#### GET `/mqtt-sensor/devices`
Lista todos los dispositivos conectados al broker EMQX.

**Respuesta:**
```json
[
  {
    "id": "device_001",
    "username": "sensor_001",
    "is_superuser": false,
    "created_at": "2025-01-08T12:00:00Z",
    "updated_at": "2025-01-08T12:00:00Z"
  }
]
```

#### GET `/mqtt-sensor/devices/{deviceId}/stats`
Obtiene estadísticas de un dispositivo específico.

**Respuesta:**
```json
{
  "connections": 1,
  "subscriptions": 3,
  "topics": 5
}
```

#### POST `/mqtt-sensor/devices`
Crea un nuevo dispositivo/usuario en EMQX.

**Body:**
```json
{
  "username": "sensor_002",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "id": "device_002",
  "username": "sensor_002",
  "is_superuser": false,
  "created_at": "2025-01-08T12:00:00Z"
}
```

#### DELETE `/mqtt-sensor/devices/{username}`
Elimina un dispositivo/usuario de EMQX.

**Respuesta:**
```json
{
  "success": true,
  "message": "Dispositivo eliminado exitosamente"
}
```

#### GET `/mqtt-sensor/broker/stats`
Obtiene estadísticas generales del broker EMQX.

**Respuesta:**
```json
{
  "connections": 10,
  "subscriptions": 25,
  "topics": 50,
  "messages": 1000
}
```

### 3. Gestión de Sensores

#### POST `/mqtt-sensor/sensores/registrar`
Registra un nuevo sensor en el sistema.

**Body:**
```json
{
  "nombre": "Sensor de Temperatura",
  "tipo": "TEMPERATURA",
  "ubicacionId": 1,
  "activo": true,
  "configuracion": {
    "unidad": "°C",
    "rango_min": -40,
    "rango_max": 80
  }
}
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Sensor de Temperatura",
  "tipo": "TEMPERATURA",
  "ubicacionId": 1,
  "activo": true,
  "configuracion": {
    "unidad": "°C",
    "rango_min": -40,
    "rango_max": 80
  },
  "createdAt": "2025-01-08T12:00:00Z"
}
```

#### GET `/mqtt-sensor/sensores/listar`
Lista todos los sensores de la empresa.

**Query Parameters:**
- `ubicacionId` (opcional): Filtrar por ubicación

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Sensor de Temperatura",
    "tipo": "TEMPERATURA",
    "ubicacionId": 1,
    "activo": true,
    "ultimaLectura": {
      "valor": 25.5,
      "unidad": "°C",
      "fecha": "2025-01-08T12:00:00Z"
    }
  }
]
```

#### GET `/mqtt-sensor/sensores/sensor/{id}`
Obtiene información detallada de un sensor específico.

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Sensor de Temperatura",
  "tipo": "TEMPERATURA",
  "ubicacionId": 1,
  "activo": true,
  "configuracion": {
    "unidad": "°C",
    "rango_min": -40,
    "rango_max": 80
  },
  "ultimaLectura": {
    "valor": 25.5,
    "unidad": "°C",
    "fecha": "2025-01-08T12:00:00Z"
  },
  "estadisticas": {
    "totalLecturas": 1000,
    "promedio": 24.8,
    "maximo": 35.2,
    "minimo": 18.1
  }
}
```

#### PATCH `/mqtt-sensor/sensores/sensor/{id}`
Actualiza la configuración de un sensor.

**Body:**
```json
{
  "nombre": "Sensor de Temperatura Actualizado",
  "activo": false,
  "configuracion": {
    "unidad": "°C",
    "rango_min": -50,
    "rango_max": 100
  }
}
```

#### DELETE `/mqtt-sensor/sensores/sensor/{id}`
Elimina un sensor del sistema.

**Respuesta:**
```json
{
  "message": "Sensor eliminado exitosamente"
}
```

### 4. Lecturas de Sensores

#### POST `/mqtt-sensor/lecturas/registrar`
Registra una nueva lectura de sensor.

**Body:**
```json
{
  "tipo": "TEMPERATURA",
  "valor": 25.5,
  "unidad": "°C",
  "sensorId": 1,
  "ubicacionId": 1,
  "productoId": 1
}
```

**Respuesta:**
```json
{
  "id": 1,
  "tipo": "TEMPERATURA",
  "valor": 25.5,
  "unidad": "°C",
  "estado": "NORMAL",
  "mensaje": "Temperatura normal",
  "fecha": "2025-01-08T12:00:00Z"
}
```

#### GET `/mqtt-sensor/lecturas/listar`
Lista las lecturas de sensores con filtros.

**Query Parameters:**
- `tipo` (opcional): Tipo de sensor
- `productoId` (opcional): ID del producto
- `desde` (opcional): Fecha desde (ISO)
- `hasta` (opcional): Fecha hasta (ISO)
- `limite` (opcional): Número máximo de resultados (default: 100)

**Respuesta:**
```json
[
  {
    "id": 1,
    "tipo": "TEMPERATURA",
    "valor": 25.5,
    "unidad": "°C",
    "estado": "NORMAL",
    "mensaje": "Temperatura normal",
    "fecha": "2025-01-08T12:00:00Z",
    "producto": {
      "id": 1,
      "nombre": "Producto A"
    }
  }
]
```

#### POST `/mqtt-sensor/lecturas/simular`
Simula una lectura de sensor para pruebas.

**Body:**
```json
{
  "productoId": 1
}
```

### 5. Analytics y Alertas

#### GET `/mqtt-sensor/analytics`
Obtiene estadísticas generales de sensores.

**Respuesta:**
```json
{
  "totalLecturas": 5000,
  "lecturasUltimas24h": 120,
  "alertasActivas": 3,
  "productosMonitoreados": 15,
  "temperaturaPromedio": 24.8,
  "humedadPromedio": 65.2,
  "tendenciaTemperatura": "ESTABLE",
  "tendenciaHumedad": "CRECIENTE"
}
```

#### GET `/mqtt-sensor/alertas`
Lista todas las alertas activas.

**Respuesta:**
```json
[
  {
    "id": "alert_001",
    "tipo": "TEMPERATURA",
    "severidad": "ALTA",
    "mensaje": "Temperatura crítica detectada",
    "productoId": 1,
    "productoNombre": "Producto A",
    "valor": 45.2,
    "limite": 40.0,
    "fecha": "2025-01-08T12:00:00Z",
    "resuelto": false
  }
]
```

### 6. Dashboard

#### GET `/mqtt-sensor/dashboard/ubicaciones`
Obtiene datos del dashboard de ubicaciones.

**Respuesta:**
```json
{
  "ubicaciones": [
    {
      "id": 1,
      "nombre": "Almacén Principal",
      "totalSensores": 5,
      "sensoresActivos": 4,
      "ultimaLectura": "2025-01-08T12:00:00Z",
      "estado": "NORMAL"
    }
  ],
  "resumen": {
    "totalUbicaciones": 3,
    "totalSensores": 15,
    "alertasActivas": 2
  }
}
```

#### GET `/mqtt-sensor/dashboard/ubicacion/{id}/tiempo-real`
Obtiene datos en tiempo real de una ubicación específica.

**Query Parameters:**
- `desde` (opcional): Fecha desde (ISO)
- `hasta` (opcional): Fecha hasta (ISO)
- `limite` (opcional): Número máximo de lecturas

**Respuesta:**
```json
{
  "ubicacion": {
    "id": 1,
    "nombre": "Almacén Principal"
  },
  "lecturasRecientes": [
    {
      "id": 1,
      "tipo": "TEMPERATURA",
      "valor": 25.5,
      "unidad": "°C",
      "fecha": "2025-01-08T12:00:00Z"
    }
  ],
  "estadisticas": {
    "temperatura": {
      "promedio": 24.8,
      "maximo": 28.5,
      "minimo": 22.1
    }
  }
}
```

#### GET `/mqtt-sensor/dashboard/alertas`
Obtiene alertas para el dashboard.

**Query Parameters:**
- `ubicacionId` (opcional): Filtrar por ubicación
- `tipo` (opcional): Tipo de alerta
- `desde` (opcional): Fecha desde (ISO)
- `hasta` (opcional): Fecha hasta (ISO)

### 7. Monitoreo en Tiempo Real

#### GET `/mqtt-sensor/monitoreo/estado`
Obtiene el estado completo del sistema de monitoreo.

**Respuesta:**
```json
{
  "mqtt": {
    "enabled": true,
    "connected": true,
    "reconnectAttempts": 0
  },
  "analytics": {
    "totalLecturas": 5000,
    "lecturasUltimas24h": 120,
    "alertasActivas": 3
  },
  "alertasActivas": 3,
  "ultimaActualizacion": "2025-01-08T12:00:00Z"
}
```

#### GET `/mqtt-sensor/monitoreo/estadisticas`
Obtiene estadísticas detalladas del monitoreo.

**Respuesta:**
```json
{
  "broker": {
    "connections": 10,
    "subscriptions": 25,
    "topics": 50
  },
  "sensores": {
    "totalLecturas": 5000,
    "lecturasUltimas24h": 120,
    "alertasActivas": 3
  },
  "timestamp": "2025-01-08T12:00:00Z"
}
```

## 🔧 Códigos de Error

### Errores Comunes

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

#### 404 Not Found
```json
{
  "error": "Error obteniendo sensor",
  "message": "Sensor no encontrado"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Error interno del servidor",
  "message": "Error específico"
}
```

## 📊 Tipos de Sensores Soportados

- `TEMPERATURA` - Sensores de temperatura
- `HUMEDAD` - Sensores de humedad
- `PRESION` - Sensores de presión
- `PESO` - Sensores de peso

## 🚀 Ejemplos de Uso

### Ejemplo 1: Configurar MQTT y Registrar Sensor

```bash
# 1. Verificar estado MQTT
curl -X GET "http://localhost:3000/mqtt-sensor/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Registrar sensor
curl -X POST "http://localhost:3000/mqtt-sensor/sensores/registrar" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Sensor de Temperatura",
    "tipo": "TEMPERATURA",
    "ubicacionId": 1,
    "activo": true
  }'

# 3. Registrar lectura
curl -X POST "http://localhost:3000/mqtt-sensor/lecturas/registrar" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "TEMPERATURA",
    "valor": 25.5,
    "unidad": "°C",
    "sensorId": 1,
    "ubicacionId": 1
  }'
```

### Ejemplo 2: Monitoreo en Tiempo Real

```bash
# Obtener estado completo del sistema
curl -X GET "http://localhost:3000/mqtt-sensor/monitoreo/estado" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Obtener analytics
curl -X GET "http://localhost:3000/mqtt-sensor/analytics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Obtener alertas
curl -X GET "http://localhost:3000/mqtt-sensor/alertas" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Seguridad

- Todos los endpoints requieren autenticación JWT
- Validación de roles (SUPERADMIN/ADMIN)
- Validación de empresa
- Sanitización de datos de entrada
- Logs de auditoría para operaciones críticas

## 📝 Notas Importantes

1. **Empresa Required**: Todos los endpoints requieren que el usuario tenga una empresa configurada
2. **Validación de Datos**: Todos los datos de entrada son validados automáticamente
3. **Manejo de Errores**: Todos los endpoints incluyen manejo robusto de errores
4. **Logs**: Todas las operaciones son registradas en logs
5. **WebSockets**: Los datos en tiempo real se transmiten también por WebSockets 