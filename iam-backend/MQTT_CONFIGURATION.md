# Configuración MQTT - Sistema de Sensores

## Descripción

El módulo MQTT es **opcional** y permite recibir datos de sensores IoT (como ESP32) para monitorear temperatura y humedad en tiempo real. Por defecto está **deshabilitado** para evitar errores en producción.

## Variables de Entorno

### Básicas
```bash
# Habilitar MQTT (requerido para activar el módulo)
MQTT_ENABLED=true

# Configuración del broker MQTT
MQTT_HOST=localhost
MQTT_PORT=1883

# Credenciales (opcionales)
MQTT_USERNAME=usuario
MQTT_PASSWORD=contraseña
```

### Avanzadas
```bash
# Configuración de reconexión
MQTT_RECONNECT_PERIOD=5000        # Intervalo entre intentos (ms)
MQTT_CONNECT_TIMEOUT=10000        # Timeout de conexión (ms)
MQTT_MAX_RECONNECT_ATTEMPTS=5     # Máximo intentos de reconexión
```

## Estados del Servicio

### Deshabilitado (por defecto)
- No intenta conectarse al broker
- No genera errores
- Log: "MQTT está deshabilitado. Para habilitarlo, configure MQTT_ENABLED=true..."

### Habilitado pero sin broker
- Intenta conectarse y falla
- Reintenta hasta alcanzar el máximo de intentos
- Se deshabilita automáticamente después de fallar
- Log: "Máximo número de intentos de reconexión alcanzado. MQTT deshabilitado."

### Habilitado y conectado
- Conecta exitosamente al broker
- Suscribe al tópico `esp32/temperatura_humedad`
- Procesa mensajes de sensores
- Log: "Conectado al broker MQTT" y "Suscrito al tópico esp32/temperatura_humedad"

## API Endpoints

### Verificar estado
```http
GET /mqtt-sensor/status
Authorization: Bearer <token>
```

Respuesta:
```json
{
  "enabled": true,
  "connected": true,
  "reconnectAttempts": 0
}
```

### Habilitar/Deshabilitar
```http
POST /mqtt-sensor/toggle
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true
}
```

Respuesta:
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

## Formato de Mensajes MQTT

El servicio espera mensajes JSON en el tópico `esp32/temperatura_humedad`:

```json
{
  "temperatura": 25.5,
  "humedad": 60.2
}
```

### Validaciones
- `temperatura`: -50°C a 100°C
- `humedad`: 0% a 100%
- Ambos campos son requeridos

## Configuración por Entorno

### Desarrollo
```bash
# .env.development
MQTT_ENABLED=true
MQTT_HOST=localhost
MQTT_PORT=1883
```

### Producción
```bash
# .env.production
MQTT_ENABLED=false  # Deshabilitado por defecto
# MQTT_HOST=broker.produccion.com
# MQTT_PORT=1883
```

### Docker
```bash
# docker-compose.yml
environment:
  - MQTT_ENABLED=false  # Deshabilitado por defecto
  # - MQTT_HOST=mosquitto
  # - MQTT_PORT=1883
```

## Monitoreo y Logs

### Logs Informativos
- "MQTT está deshabilitado" - Servicio no configurado
- "Iniciando conexión MQTT a: mqtt://..." - Intentando conectar
- "Conectado al broker MQTT" - Conexión exitosa
- "Mensaje recibido en el tópico..." - Datos recibidos

### Logs de Error
- "Error en la conexión MQTT" - Fallo de conexión
- "Intento de reconexión X/Y" - Reintentando conexión
- "Máximo número de intentos alcanzado" - Deshabilitado automáticamente

## Integración con Sensores

Los datos recibidos se procesan automáticamente:

1. **Validación**: Se verifica el formato y rangos
2. **Registro**: Se guardan en la base de datos
3. **Análisis**: Se determina el estado (NORMAL/ALERTA/CRÍTICO)
4. **Alertas**: Se generan alertas si es necesario
5. **Inventario**: Se actualiza el inventario si es sensor de peso

## Seguridad

- Solo usuarios ADMIN y SUPERADMIN pueden gestionar MQTT
- Las credenciales se configuran por variables de entorno
- Los mensajes se validan antes de procesar
- Timeouts y límites de reconexión previenen loops infinitos

## Troubleshooting

### Error: "ECONNREFUSED"
- Verificar que el broker MQTT esté ejecutándose
- Verificar host y puerto correctos
- Verificar firewall/red

### Error: "Máximo intentos alcanzado"
- El servicio se deshabilitó automáticamente
- Usar API para habilitar nuevamente
- Verificar configuración del broker

### No se reciben mensajes
- Verificar suscripción al tópico correcto
- Verificar formato JSON del mensaje
- Verificar permisos del broker 