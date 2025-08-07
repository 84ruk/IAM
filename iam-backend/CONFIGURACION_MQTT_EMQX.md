# Configuración MQTT para EMQX Broker

## 📋 Información del Broker

- **Host:** `h02f10fd.ala.us-east-1.emqxsl.com`
- **Puerto MQTT TLS/SSL:** `8883`
- **Puerto WebSocket TLS/SSL:** `8084`
- **API Endpoint:** `https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5`
- **App ID:** `v2c96220`
- **App Secret:** [Configurar en variables de entorno]

## 🚀 Configuración Rápida

### Opción 1: Script Automático (Recomendado)

```bash
cd iam-backend
node scripts/configurar-mqtt.js
```

El script te guiará para configurar:
- Usuario MQTT (opcional)
- Contraseña MQTT (opcional)
- App Secret de EMQX

### Opción 2: Configuración Manual

Agrega las siguientes variables a tu archivo `.env`:

```env
# Configuración MQTT para EMQX Broker
MQTT_ENABLED=true
MQTT_HOST=h02f10fd.ala.us-east-1.emqxsl.com
MQTT_PORT=8883
MQTT_USE_TLS=true
MQTT_USERNAME=tu_usuario
MQTT_PASSWORD=tu_contraseña
MQTT_APP_ID=v2c96220
MQTT_APP_SECRET=tu_app_secret
MQTT_API_ENDPOINT=https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5

# Configuración avanzada MQTT
MQTT_RECONNECT_PERIOD=5000
MQTT_CONNECT_TIMEOUT=10000
MQTT_MAX_RECONNECT_ATTEMPTS=5
```

## 🔧 Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `MQTT_ENABLED` | Habilitar/deshabilitar MQTT | `true` |
| `MQTT_HOST` | Host del broker EMQX | `h02f10fd.ala.us-east-1.emqxsl.com` |
| `MQTT_PORT` | Puerto MQTT (TLS/SSL) | `8883` |
| `MQTT_USE_TLS` | Usar TLS/SSL | `true` |
| `MQTT_USERNAME` | Usuario MQTT | - |
| `MQTT_PASSWORD` | Contraseña MQTT | - |
| `MQTT_APP_ID` | ID de la aplicación EMQX | `v2c96220` |
| `MQTT_APP_SECRET` | Secret de la aplicación EMQX | - |
| `MQTT_API_ENDPOINT` | Endpoint de la API EMQX | `https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5` |

## 📡 Endpoints Disponibles

### Estado del Servicio MQTT
```http
GET /mqtt-sensor/status
```

### Habilitar/Deshabilitar MQTT
```http
POST /mqtt-sensor/toggle
Content-Type: application/json

{
  "enabled": true
}
```

### Gestión de Dispositivos

#### Listar Dispositivos
```http
GET /mqtt-sensor/devices
```

#### Obtener Estadísticas de un Dispositivo
```http
GET /mqtt-sensor/devices/{deviceId}/stats
```

#### Crear Nuevo Dispositivo
```http
POST /mqtt-sensor/devices
Content-Type: application/json

{
  "username": "sensor_001",
  "password": "password123"
}
```

#### Eliminar Dispositivo
```http
DELETE /mqtt-sensor/devices/{username}
```

#### Estadísticas del Broker
```http
GET /mqtt-sensor/broker/stats
```

## 🔍 Tópicos MQTT Soportados

El sistema se suscribe automáticamente a los siguientes tópicos:

1. `esp32/temperatura_humedad` - Datos de sensores ESP32
2. `empresa/{empresaId}/ubicacion/{ubicacionId}/sensor/{sensorId}/lectura` - Lecturas de sensores organizadas
3. `sensor/{sensorId}/data` - Datos de sensores genéricos
4. `iot/{deviceId}/sensor/{sensorId}/reading` - Lecturas IoT

## 📊 Formato de Mensajes

### Temperatura y Humedad
```json
{
  "temperatura": 25.5,
  "humedad": 60.2
}
```

### Peso
```json
{
  "peso": 150.75
}
```

### Datos Complejos
```json
{
  "temperatura": 25.5,
  "humedad": 60.2,
  "peso": 150.75,
  "timestamp": "2025-01-08T12:00:00Z"
}
```

## 🛠️ Solución de Problemas

### Error de Conexión TLS
Si tienes problemas con certificados SSL en desarrollo:
```typescript
// En mqtt-sensor.service.ts
rejectUnauthorized: false, // Solo para desarrollo
```

### Error de Autenticación
Verifica que las credenciales sean correctas:
- `MQTT_USERNAME` y `MQTT_PASSWORD` (si se requieren)
- `MQTT_APP_ID` y `MQTT_APP_SECRET` para la API

### Error de API EMQX
Si la API no responde:
1. Verifica que `MQTT_API_ENDPOINT` sea correcto
2. Confirma que `MQTT_APP_ID` y `MQTT_APP_SECRET` sean válidos
3. Verifica la conectividad de red al endpoint

## 🔒 Seguridad

### Producción
- Cambia `rejectUnauthorized: true` en producción
- Usa certificados SSL válidos
- Configura credenciales seguras
- Limita el acceso a la API

### Desarrollo
- `rejectUnauthorized: false` está permitido
- Usa credenciales de prueba
- No expongas credenciales en el código

## 📝 Logs

Los logs MQTT incluyen:
- Estado de conexión
- Mensajes recibidos
- Errores de conexión
- Intentos de reconexión
- Operaciones de la API

Para habilitar logs detallados:
```env
LOG_LEVEL=debug
```

## 🚀 Próximos Pasos

1. Configura las variables de entorno
2. Reinicia el servidor: `npm run start:dev`
3. Verifica la conexión: `GET /mqtt-sensor/status`
4. Prueba la API: `GET /mqtt-sensor/devices`
5. Conecta tus sensores al broker
6. Monitorea los datos en tiempo real 