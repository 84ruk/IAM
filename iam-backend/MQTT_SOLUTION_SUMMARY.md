# Solución MQTT - Módulo Opcional de Sensores

## Problema Resuelto

✅ **Error de dependencias**: `MqttSensorService` no podía resolver `SensoresService`
✅ **Errores de conexión**: Intentos constantes de conexión a broker inexistente
✅ **Falta de configuración**: No había forma de habilitar/deshabilitar MQTT
✅ **Errores en producción**: El módulo causaba errores sin configuración

## Solución Implementada

### 1. **Módulo Opcional por Configuración**
- MQTT está **deshabilitado por defecto**
- Solo se activa con `MQTT_ENABLED=true`
- No genera errores si no está configurado

### 2. **Gestión Inteligente de Conexiones**
- Verificación de configuración antes de conectar
- Reintentos limitados (5 por defecto)
- Deshabilitación automática tras fallos
- Timeouts configurables

### 3. **API de Gestión**
```http
GET  /mqtt-sensor/status    # Verificar estado
POST /mqtt-sensor/toggle    # Habilitar/Deshabilitar
```

### 4. **Configuración Flexible**
```bash
# Básica
MQTT_ENABLED=true
MQTT_HOST=localhost
MQTT_PORT=1883

# Avanzada
MQTT_RECONNECT_PERIOD=5000
MQTT_CONNECT_TIMEOUT=10000
MQTT_MAX_RECONNECT_ATTEMPTS=5
```

## Archivos Modificados

### Backend
- `src/microservices/mqtt-sensor/mqtt-sensor.service.ts` - Servicio principal
- `src/microservices/mqtt-sensor/mqtt-sensor.controller.ts` - Controlador API
- `src/microservices/mqtt-sensor/mqtt-sensor.module.ts` - Módulo con dependencias
- `src/sensores/sensores.module.ts` - Exportación de servicio
- `src/config/mqtt.config.ts` - Configuración mejorada
- `src/app.module.ts` - Carga correcta de configuración

### Documentación y Scripts
- `MQTT_CONFIGURATION.md` - Documentación completa
- `env.example` - Variables de entorno de ejemplo
- `scripts/check-mqtt-status.js` - Script de verificación
- `package.json` - Script npm `mqtt:check`

## Estados del Servicio

### 🟡 Deshabilitado (por defecto)
```
MQTT está deshabilitado. Para habilitarlo, configure MQTT_ENABLED=true...
```
- No intenta conectar
- No genera errores
- Funciona en producción sin configuración

### 🔴 Habilitado pero sin broker
```
Intento de reconexión 1/5 en 5 segundos...
Máximo número de intentos de reconexión alcanzado. MQTT deshabilitado.
```
- Intenta conectar y falla
- Reintenta hasta el límite
- Se deshabilita automáticamente

### 🟢 Habilitado y conectado
```
Conectado al broker MQTT
Suscrito al tópico esp32/temperatura_humedad
```
- Conexión exitosa
- Procesa mensajes de sensores
- Integración completa

## Uso en Diferentes Entornos

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
```

## Comandos Útiles

```bash
# Verificar configuración MQTT
npm run mqtt:check

# Verificar estado via API
curl -H "Authorization: Bearer <token>" http://localhost:3000/mqtt-sensor/status

# Habilitar MQTT via API
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' \
  http://localhost:3000/mqtt-sensor/toggle
```

## Beneficios de la Solución

### ✅ **Robustez**
- No falla si no hay broker
- Reintentos inteligentes
- Deshabilitación automática

### ✅ **Flexibilidad**
- Configuración por variables de entorno
- API para gestión dinámica
- Diferentes configuraciones por entorno

### ✅ **Mantenibilidad**
- Documentación completa
- Scripts de verificación
- Logs informativos

### ✅ **Seguridad**
- Solo ADMIN/SUPERADMIN pueden gestionar
- Validación de mensajes
- Timeouts configurables

### ✅ **Producción Ready**
- Funciona sin configuración
- No genera errores por defecto
- Fácil habilitación cuando sea necesario

## Próximos Pasos

1. **Configurar broker MQTT** cuando sea necesario
2. **Integrar sensores IoT** (ESP32, etc.)
3. **Monitorear logs** para verificar funcionamiento
4. **Usar API** para gestión dinámica

## Conclusión

El módulo MQTT ahora es completamente opcional y robusto:
- ✅ No causa errores en producción
- ✅ Fácil de habilitar cuando sea necesario
- ✅ Gestión completa via API
- ✅ Documentación y herramientas incluidas
- ✅ Configuración flexible por entorno 