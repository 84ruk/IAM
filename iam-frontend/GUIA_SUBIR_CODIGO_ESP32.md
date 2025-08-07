# 🔧 Guía Completa: Cómo Subir el Código al ESP32

## 🎯 **Problema Resuelto: El código ahora se copia correctamente**

He arreglado la funcionalidad de copiar código en el frontend. Ahora tienes **2 opciones**:

### **Opción 1: Copiar al Portapapeles**
- **Hacer clic** en "Copiar Código"
- **Pegar** directamente en Arduino IDE

### **Opción 2: Descargar Archivo .ino**
- **Hacer clic** en "Descargar .ino"
- **Abrir** el archivo descargado en Arduino IDE

## 📋 **Paso a Paso: Dónde y Cómo Subir el Código**

### **Paso 1: Instalar Arduino IDE**

1. **Descargar Arduino IDE** desde: https://www.arduino.cc/en/software
2. **Instalar** siguiendo las instrucciones
3. **Abrir** Arduino IDE

### **Paso 2: Configurar ESP32 en Arduino IDE**

#### **2.1 Agregar Soporte para ESP32**
1. **Ir a** → Archivo → Preferencias
2. **En "URLs Adicionales"** agregar:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. **Hacer clic** → OK

#### **2.2 Instalar Board ESP32**
1. **Ir a** → Herramientas → Placa → Administrador de placas
2. **Buscar** "esp32"
3. **Instalar** "ESP32 by Espressif Systems"
4. **Seleccionar** tu placa ESP32:
   - **Herramientas** → Placa → ESP32 Arduino → ESP32 Dev Module

### **Paso 3: Instalar Librerías Necesarias**

#### **3.1 Librerías Requeridas**
1. **Ir a** → Herramientas → Administrar librerías
2. **Instalar** estas librerías:

| Librería | Autor | Propósito |
|----------|-------|-----------|
| **PubSubClient** | Nick O'Leary | Conexión MQTT |
| **ArduinoJson** | Benoit Blanchon | Manejo JSON |
| **DHT sensor library** | Adafruit | Sensores DHT22/DHT11 |
| **HX711** | Bogdan Necula | Celda de carga |
| **Adafruit BMP280 Library** | Adafruit | Sensor BMP280 |

#### **3.2 Configurar PubSubClient**
1. **Encontrar** la carpeta de librerías:
   - **Windows**: `C:\Users\[Usuario]\Documents\Arduino\libraries\PubSubClient`
   - **Mac**: `~/Documents/Arduino/libraries/PubSubClient`
   - **Linux**: `~/Arduino/libraries/PubSubClient`

2. **Editar** `PubSubClient.h`:
   ```cpp
   // Cambiar esta línea:
   #define MQTT_MAX_PACKET_SIZE 128
   
   // Por esta:
   #define MQTT_MAX_PACKET_SIZE 512
   ```

### **Paso 4: Obtener el Código**

#### **4.1 Desde el Frontend**
1. **Ir a** → Dashboard → Sensores
2. **Hacer clic** → "Configurar ESP32"
3. **Completar** el wizard (5 pasos)
4. **En el paso 5**:
   - **Hacer clic** → "Copiar Código" **O**
   - **Hacer clic** → "Descargar .ino"

#### **4.2 Código Base (si no tienes wizard)**
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
const char* mqtt_topic = "esp32/temperatura_humedad";

// Variables globales
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
const long interval = 30000;

void setup() {
  Serial.begin(115200);
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
  Serial.println("ESP32 configurado");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  if (millis() - lastMsg > interval) {
    lastMsg = millis();
    publishSensorData();
  }
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

void reconnect() {
  while (!client.connected()) {
    Serial.println("Conectando a MQTT...");
    if (client.connect("ESP32Client", mqtt_username, mqtt_password)) {
      Serial.println("MQTT conectado");
    } else {
      Serial.print("Error, rc=");
      Serial.print(client.state());
      Serial.println(" reintentando en 5 segundos");
      delay(5000);
    }
  }
}

void publishSensorData() {
  // Leer sensores (implementar según tus sensores)
  float temperatura = 25.5; // Ejemplo
  float humedad = 60.0;     // Ejemplo
  
  // Crear JSON
  StaticJsonDocument<200> doc;
  doc["temperatura"] = temperatura;
  doc["humedad"] = humedad;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Publicar
  if (client.publish(mqtt_topic, jsonString.c_str())) {
    Serial.println("Datos enviados: " + jsonString);
  } else {
    Serial.println("Error enviando datos");
  }
}
```

### **Paso 5: Conectar ESP32**

#### **5.1 Conexión Física**
1. **Conectar ESP32** a la computadora via USB
2. **Verificar** que se detecte:
   - **Windows**: Aparece en Administrador de dispositivos
   - **Mac**: Aparece en /dev/tty.usbserial-*
   - **Linux**: Aparece en /dev/ttyUSB0

#### **5.2 Configurar Puerto**
1. **En Arduino IDE**:
   - **Herramientas** → Puerto → Seleccionar puerto del ESP32
   - **Herramientas** → Velocidad de carga → 115200

### **Paso 6: Subir Código**

#### **6.1 Verificar Código**
1. **Hacer clic** → Verificar (✓)
2. **Esperar** que compile sin errores

#### **6.2 Subir Código**
1. **Hacer clic** → Subir (→)
2. **Esperar** que termine la carga
3. **Ver mensaje**: "Subida completada"

### **Paso 7: Verificar Funcionamiento**

#### **7.1 Monitor Serial**
1. **Hacer clic** → Herramientas → Monitor serial
2. **Configurar** velocidad: 115200 baud
3. **Verificar** mensajes:
   ```
   Conectando a WiFi...
   WiFi conectado
   IP: 192.168.1.100
   Conectando a MQTT...
   MQTT conectado
   Datos enviados: {"temperatura":25.5,"humedad":60.0}
   ```

#### **7.2 Dashboard**
1. **Ir a** → Dashboard → Ubicaciones
2. **Seleccionar** tu ubicación
3. **Pestaña** → "Tiempo Real"
4. **Verificar** que lleguen datos

## 🔍 **Troubleshooting**

### **Error: "No se puede abrir el dispositivo"**
- **Verificar** cable USB
- **Reinstalar** drivers ESP32
- **Probar** otro puerto USB

### **Error: "Compilación fallida"**
- **Verificar** librerías instaladas
- **Revisar** sintaxis del código
- **Actualizar** Arduino IDE

### **Error: "No conecta a WiFi"**
- **Verificar** SSID y contraseña
- **Probar** con otra red WiFi
- **Verificar** que la red sea 2.4GHz

### **Error: "No conecta a MQTT"**
- **Verificar** credenciales MQTT
- **Verificar** conexión a internet
- **Revisar** configuración del broker

## 📱 **Código Completo con Sensores Específicos**

### **Para DHT22 (Temperatura y Humedad)**
```cpp
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  dht.begin();
  // ... resto del setup
}

void publishSensorData() {
  float temperatura = dht.readTemperature();
  float humedad = dht.readHumidity();
  
  if (!isnan(temperatura) && !isnan(humedad)) {
    StaticJsonDocument<200> doc;
    doc["temperatura"] = temperatura;
    doc["humedad"] = humedad;
    doc["timestamp"] = millis();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    client.publish(mqtt_topic, jsonString.c_str());
    Serial.println("Datos enviados: " + jsonString);
  }
}
```

### **Para HX711 (Peso)**
```cpp
#include <HX711.h>

#define LOADCELL_DOUT_PIN 2
#define LOADCELL_SCK_PIN 3

HX711 scale;

void setup() {
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(2280.f); // Calibrar
  scale.tare();
  // ... resto del setup
}

void publishSensorData() {
  float peso = scale.get_units();
  
  StaticJsonDocument<200> doc;
  doc["peso"] = peso;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  client.publish(mqtt_topic, jsonString.c_str());
  Serial.println("Datos enviados: " + jsonString);
}
```

## 🎉 **¡Listo!**

**Una vez que subas el código y veas los datos llegando al dashboard, tu ESP32 estará completamente integrado al sistema.**

**El código se actualiza automáticamente y los datos aparecen en tiempo real en tu interfaz web.** 🚀 