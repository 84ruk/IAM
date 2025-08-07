# 🔧 Guía Completa: Conectar Sensor Físico al Sistema

## 🎯 **¿Qué tipo de sensor tienes en tu prototipo?**

Te voy a mostrar cómo conectar cualquier tipo de sensor físico al sistema. Primero, identifica qué sensor tienes:

### **Sensores Soportados:**
- ✅ **TEMPERATURA** - DHT22, DHT11, LM35, DS18B20, etc.
- ✅ **HUMEDAD** - DHT22, DHT11, SHT30, etc.
- ✅ **PESO** - HX711 + Load Cell, etc.
- ✅ **PRESION** - BMP280, BME280, etc.

## 🚀 **Paso 1: Configurar el Sistema Backend**

### **1.1 Verificar que el backend esté funcionando**
```bash
# En el directorio iam-backend
npm run start:dev
```

### **1.2 Configurar datos iniciales**
```bash
# Configurar JWT Token
export JWT_TOKEN="tu-jwt-token-aqui"

# Configurar sensor físico
node scripts/configurar-sensor-fisico.js
```

### **1.3 Verificar que todo funcione**
```bash
# Probar recepción de datos
node scripts/test-sensor-reception.js
```

## 🔧 **Paso 2: Configurar tu Hardware (ESP32/Arduino)**

### **2.1 Librerías necesarias**
Instala estas librerías en Arduino IDE:
- **WiFi** (incluida)
- **PubSubClient** (por Nick O'Leary)
- **ArduinoJson** (por Benoit Blanchon)

### **2.2 Código base para ESP32**

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración MQTT
const char* mqtt_server = "h02f10fd.ala.us-east-1.emqxsl.com";
const int mqtt_port = 8883;
const char* mqtt_username = "tu_usuario_mqtt";
const char* mqtt_password = "tu_password_mqtt";
const char* mqtt_client_id = "esp32_sensor_1"; // Cambiar por tu sensor ID

// Tópico MQTT
const char* mqtt_topic = "esp32/temperatura_humedad";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setupWiFi() {
  delay(10);
  Serial.println("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("WiFi conectado");
  Serial.println("IP: " + WiFi.localIP().toString());
}

void callback(char* topic, byte* payload, unsigned int length) {
  // Manejar mensajes recibidos si es necesario
}

void reconnect() {
  while (!client.connected()) {
    Serial.println("Conectando a MQTT...");
    if (client.connect(mqtt_client_id, mqtt_username, mqtt_password)) {
      Serial.println("MQTT conectado");
    } else {
      Serial.print("Error, rc=");
      Serial.print(client.state());
      Serial.println(" reintentando en 5 segundos");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Leer sensor (implementar según tu sensor)
  float temperatura = leerTemperatura();
  float humedad = leerHumedad();

  // Crear JSON con datos
  StaticJsonDocument<200> doc;
  doc["temperatura"] = temperatura;
  doc["humedad"] = humedad;
  doc["timestamp"] = millis();
  doc["sensor_id"] = 1; // Cambiar por tu sensor ID

  String jsonString;
  serializeJson(doc, jsonString);

  // Publicar datos
  if (client.publish(mqtt_topic, jsonString.c_str())) {
    Serial.println("Datos enviados: " + jsonString);
  } else {
    Serial.println("Error enviando datos");
  }

  delay(30000); // Enviar cada 30 segundos
}

// Implementar según tu sensor específico
float leerTemperatura() {
  // Ejemplo para DHT22
  // return dht.readTemperature();
  
  // Valor de ejemplo
  return 25.5;
}

float leerHumedad() {
  // Ejemplo para DHT22
  // return dht.readHumidity();
  
  // Valor de ejemplo
  return 60.0;
}
```

## 📋 **Paso 3: Configuración por Tipo de Sensor**

### **3.1 Sensor de Temperatura (DHT22)**

```cpp
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  dht.begin();
  // ... resto del setup
}

float leerTemperatura() {
  float t = dht.readTemperature();
  if (isnan(t)) {
    Serial.println("Error leyendo temperatura");
    return 0.0;
  }
  return t;
}

float leerHumedad() {
  float h = dht.readHumidity();
  if (isnan(h)) {
    Serial.println("Error leyendo humedad");
    return 0.0;
  }
  return h;
}
```

### **3.2 Sensor de Peso (HX711 + Load Cell)**

```cpp
#include <HX711.h>

#define LOADCELL_DOUT_PIN 2
#define LOADCELL_SCK_PIN 3

HX711 scale;

void setup() {
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(2280.f); // Calibrar según tu sensor
  scale.tare();
  // ... resto del setup
}

float leerPeso() {
  float peso = scale.get_units();
  if (peso < 0) peso = 0;
  return peso;
}

// En el loop principal:
StaticJsonDocument<200> doc;
doc["peso"] = leerPeso();
doc["timestamp"] = millis();
doc["sensor_id"] = 1;
```

### **3.3 Sensor de Presión (BMP280)**

```cpp
#include <Adafruit_BMP280.h>

Adafruit_BMP280 bmp;

void setup() {
  if (!bmp.begin(0x76)) {
    Serial.println("Error iniciando BMP280");
  }
  // ... resto del setup
}

float leerPresion() {
  return bmp.readPressure() / 100.0; // Convertir a hPa
}

float leerTemperatura() {
  return bmp.readTemperature();
}
```

## 🔧 **Paso 4: Configuración MQTT**

### **4.1 Variables de entorno (.env)**
```env
# Configuración MQTT para EMQX Broker
MQTT_ENABLED=true
MQTT_HOST=h02f10fd.ala.us-east-1.emqxsl.com
MQTT_PORT=8883
MQTT_USE_TLS=true
MQTT_USERNAME=tu_usuario_mqtt
MQTT_PASSWORD=tu_password_mqtt
MQTT_APP_ID=v2c96220
MQTT_APP_SECRET=tu_app_secret
MQTT_API_ENDPOINT=https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5
```

### **4.2 Tópicos MQTT soportados**
```
esp32/temperatura_humedad
empresa/{empresaId}/ubicacion/{ubicacionId}/sensor/{sensorId}/lectura
sensor/{sensorId}/data
iot/{deviceId}/sensor/{sensorId}/reading
```

### **4.3 Formato de mensaje JSON**
```json
{
  "temperatura": 25.5,
  "humedad": 60.0,
  "peso": 1.5,
  "presion": 1013.25,
  "timestamp": 1234567890,
  "sensor_id": 1
}
```

## 🧪 **Paso 5: Pruebas y Verificación**

### **5.1 Probar recepción de datos**
```bash
node scripts/test-sensor-reception.js
```

### **5.2 Monitorear en tiempo real**
```bash
node scripts/test-sensor-reception.js --monitor 1
```

### **5.3 Verificar en el dashboard**
```bash
curl -X GET "http://localhost:3000/mqtt-sensor/dashboard/ubicaciones" \
  -H "Authorization: Bearer tu-token"
```

## 🔍 **Paso 6: Troubleshooting**

### **6.1 Problemas comunes**

#### **MQTT no conecta:**
- ✅ Verificar credenciales en `.env`
- ✅ Verificar que el broker esté funcionando
- ✅ Verificar conexión WiFi en ESP32

#### **No llegan datos:**
- ✅ Verificar que el ESP32 esté conectado a WiFi
- ✅ Verificar que las credenciales MQTT sean correctas
- ✅ Verificar que el tópico sea correcto
- ✅ Verificar que el sensor esté funcionando

#### **Datos incorrectos:**
- ✅ Verificar la calibración del sensor
- ✅ Verificar las unidades en el código Arduino
- ✅ Verificar la conexión física del sensor

### **6.2 Comandos de debugging**
```bash
# Ver estado MQTT
curl -X GET "http://localhost:3000/mqtt-sensor/status" \
  -H "Authorization: Bearer tu-token"

# Ver sensores registrados
curl -X GET "http://localhost:3000/mqtt-sensor/sensores/listar" \
  -H "Authorization: Bearer tu-token"

# Ver lecturas recientes
curl -X GET "http://localhost:3000/mqtt-sensor/lecturas/listar?limite=10" \
  -H "Authorization: Bearer tu-token"
```

## 📊 **Paso 7: Verificar en el Frontend**

### **7.1 Dashboard en tiempo real**
Una vez que los datos lleguen, podrás verlos en:
- **Dashboard general** - Vista de todas las ubicaciones
- **Dashboard por ubicación** - Datos específicos de cada ubicación
- **Analytics** - Métricas y estadísticas
- **Alertas** - Notificaciones automáticas

### **7.2 WebSockets**
El sistema también emite eventos en tiempo real via WebSockets:
```javascript
// En el frontend
socket.on('nueva_lectura', (data) => {
  console.log('Nueva lectura:', data);
  // Actualizar UI en tiempo real
});
```

## 🎯 **Resumen del Flujo**

1. **Configurar backend** - Ejecutar scripts de configuración
2. **Conectar sensor físico** - Cablear según el tipo de sensor
3. **Programar ESP32/Arduino** - Subir código con tus credenciales
4. **Verificar conexión** - Probar que los datos lleguen
5. **Monitorear** - Ver datos en dashboard y analytics

## 🚀 **¡Listo!**

Una vez completados estos pasos, tu sensor físico estará completamente integrado al sistema y podrás:

- ✅ **Ver datos en tiempo real** en el dashboard
- ✅ **Recibir alertas automáticas** cuando los valores excedan umbrales
- ✅ **Analizar tendencias** con analytics
- ✅ **Escalar fácilmente** agregando más sensores

**¡Tu prototipo estará funcionando completamente integrado al sistema!** 🎉 