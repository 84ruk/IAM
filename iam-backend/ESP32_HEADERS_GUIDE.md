# 🔧 Guía de Headers ESP32 para IAM Backend

## 📋 **Headers Automáticos Generados**

El botón "ESP32 Lecturas Periódicas" ahora genera automáticamente código que incluye todos los headers necesarios para la autenticación y identificación en el backend.

### **Headers Requeridos (Generados Automáticamente):**

```cpp
// 🔧 HEADERS ESP32 REQUERIDOS PARA EL BACKEND
http.addHeader("x-empresa-id", String(EMPRESA_ID));
http.addHeader("x-device-type", "esp32");
http.addHeader("x-esp32-device", "true");
http.addHeader("x-esp32-version", "1.0.0");
http.addHeader("User-Agent", "ESP32-Sensor/1.0");
```

## 🎯 **Endpoints Disponibles para ESP32**

### **1. Lecturas de Sensores (Sin JWT)**
```cpp
POST /sensores/iot/lectura
```

**Headers Automáticos:**
- `x-empresa-id`: ID de la empresa
- `x-device-type`: "esp32"
- `x-esp32-device`: "true"
- `x-esp32-version`: "1.0.0"
- `User-Agent`: "ESP32-Sensor/1.0"

**Body JSON:**
```json
{
  "tipo": "TEMPERATURA",
  "valor": 25.5,
  "unidad": "°C",
  "ubicacionId": 1,
  "productoId": null,
  "sensorId": null
}
```

### **2. Registro de Sensores (Sin JWT)**
```cpp
POST /sensores/iot/registrar-sensor
```

**Headers Automáticos:** (Mismos que arriba)

**Body JSON:**
```json
{
  "nombre": "Sensor-Temperatura-1",
  "tipo": "TEMPERATURA",
  "ubicacionId": 1,
  "descripcion": "Sensor de temperatura en ubicación 1",
  "activo": true,
  "modo": "AUTOMATICO",
  "configuracion": {
    "unidad": "°C",
    "rango_min": -20,
    "rango_max": 50,
    "precision": 0.1,
    "intervalo_lectura": 30,
    "umbral_alerta": 35,
    "umbral_critico": 40
  }
}
```

## 🚀 **Funciones Automáticas en el Código Generado**

### **1. `enviarLecturasMultiples()`**
- Envía lecturas de todos los sensores habilitados
- Incluye headers automáticos en cada petición
- Maneja errores individuales por sensor
- Incluye pausas entre envíos para estabilidad

### **2. `registrarSensoresEnBackend()`**
- Registra automáticamente todos los sensores en el backend
- Se ejecuta durante el setup del ESP32
- Incluye configuración completa de cada sensor
- Headers automáticos en cada registro

### **3. Fallback Automático**
- Si fallan las lecturas múltiples, usa lecturas individuales
- Manejo robusto de errores de conexión
- Reintentos automáticos de conexión WiFi

## 📱 **Configuración del ESP32**

### **Variables de Configuración:**
```cpp
#define DEVICE_ID "tu-device-id"
#define DEVICE_NAME "tu-device-name"
String wifiSSID = "tu-wifi-ssid";
String wifiPassword = "tu-wifi-password";
String apiBaseUrl = "http://tu-servidor:puerto";
```

### **Configuración de Sensores:**
```cpp
struct SensorConfig {
  String tipo;        // TEMPERATURA, HUMEDAD, PESO, PRESION
  String nombre;      // Nombre del sensor
  int pin;           // Pin principal
  int pin2;          // Pin secundario (si aplica)
  bool enabled;      // Sensor habilitado
  float umbralMin;   // Umbral mínimo
  float umbralMax;   // Umbral máximo
  String unidad;     // Unidad de medida
  int intervalo;     // Intervalo de lectura
};
```

## 🔒 **Seguridad y Autenticación**

### **Validación Automática:**
- **IP Whitelist**: Solo IPs de redes locales permitidas
- **Headers de Identificación**: Validación automática de dispositivo ESP32
- **Empresa ID**: Validación de pertenencia a empresa
- **Rate Limiting**: Protección contra spam de lecturas

### **Detección de Dispositivos ESP32:**
```cpp
// El backend detecta automáticamente dispositivos ESP32 por:
headers["x-device-type"] === "esp32"
headers["x-esp32-device"] === "true"
headers["User-Agent"].includes("ESP32")
```

## 📊 **Logging y Monitoreo**

### **Logs Automáticos:**
- 📡 Conexión WiFi
- 🔧 Registro de sensores
- 📊 Envío de lecturas
- ⚠️ Errores y fallbacks
- ✅ Operaciones exitosas

### **Monitoreo en Tiempo Real:**
- WebSockets para actualizaciones en vivo
- Eventos de estado del dispositivo
- Alertas automáticas por valores fuera de rango

## 🧪 **Pruebas y Debugging**

### **Script de Prueba:**
```bash
cd iam-backend
node test-esp32-connection.js
```

### **Verificación de Headers:**
```bash
# Verificar que los headers se envían correctamente
curl -X POST http://localhost:3001/sensores/iot/lectura \
  -H "Content-Type: application/json" \
  -H "x-empresa-id: 1" \
  -H "x-device-type: esp32" \
  -H "x-esp32-device: true" \
  -H "x-esp32-version: 1.0.0" \
  -d '{"tipo":"TEMPERATURA","valor":25.5,"unidad":"°C","ubicacionId":1}'
```

## 🔄 **Flujo de Funcionamiento**

1. **Setup del ESP32:**
   - Conectar WiFi
   - Registrar sensores en backend
   - Obtener configuración actualizada

2. **Loop Principal:**
   - Leer sensores habilitados
   - Enviar lecturas múltiples
   - Fallback a lecturas individuales si es necesario
   - Manejo de errores y reconexión

3. **Backend:**
   - Validar headers ESP32
   - Procesar lecturas
   - Generar alertas si es necesario
   - Emitir eventos por WebSocket

## 📝 **Notas Importantes**

- ✅ **Headers se generan automáticamente** - No necesitas configurarlos manualmente
- ✅ **Endpoints sin JWT** - No necesitas manejar autenticación JWT
- ✅ **Fallback automático** - El sistema maneja errores automáticamente
- ✅ **Logging completo** - Todos los eventos se registran para debugging
- ✅ **Seguridad integrada** - Validación automática de dispositivos ESP32

## 🆘 **Solución de Problemas**

### **Error de IP no permitida:**
- Verificar que el ESP32 esté en una red local (192.168.x.x, 10.x.x.x, 172.16.x.x)
- El backend permite automáticamente IPs conocidas de ESP32

### **Error de empresa no encontrada:**
- Verificar que el `x-empresa-id` sea válido
- El ID debe existir en la base de datos

### **Error de ubicación no encontrada:**
- Verificar que el `ubicacionId` sea válido
- La ubicación debe pertenecer a la empresa especificada

### **Error de conexión WiFi:**
- Verificar credenciales WiFi en el ESP32
- El sistema incluye reintentos automáticos

---

**🎯 El botón "ESP32 Lecturas Periódicas" ahora genera todo el código necesario automáticamente, incluyendo los headers correctos para la autenticación en el backend.**


