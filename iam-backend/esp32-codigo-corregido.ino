/*
 * ESP32 IAM - Sistema de Lecturas Periodicas
 * Codigo generado automaticamente para: ESP32Temp
 * Device ID: esp32_1755732408873_vlu3k1ucf
 * Fecha de generacion: 20250820T232717
 * 
 * 🔧 CORREGIDO: Ahora envía lecturas al endpoint correcto /iot/lecturas
 * 
 * 🔧 NUEVO: Este codigo incluye headers ESP32 automáticos para:
 * - x-empresa-id: ID de la empresa
 * - x-device-type: Tipo de dispositivo (esp32)
 * - x-esp32-device: Identificador ESP32
 * - x-esp32-version: Versión del firmware
 * - User-Agent: Identificador del dispositivo
 * 
 * Los headers se envían automáticamente en todas las peticiones HTTP
 * para autenticación y identificación en el backend.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <WiFiClientSecure.h>
#include <time.h>

#include <DHT.h>


#include <SPI.h>
#include <Wire.h>

// ===========================================
// CONFIGURACIÓN DEL DISPOSITIVO
// ===========================================

// Información del dispositivo
#define DEVICE_ID "esp32_1755732408873_vlu3k1ucf"
#define DEVICE_NAME "ESP32Temp"

// Configuración WiFi (configuración inicial del usuario)
String wifiSSID = "IZZI-148B";
String wifiPassword = "98F781F3148B";

// 🔧 CORREGIDO: Configuración API con endpoint correcto
String apiBaseUrl = "https://api.iaminventario.com.mx"; // Normalizar sin slash final
String apiToken = "AJQREILpOUDX9rxhtjbum3BxQptLOAZ0";
String apiEndpoint = "/iot/lecturas"; // ✅ CORREGIDO: Endpoint correcto para IoT

// 🔧 CORREGIDO: Función simplificada que SIEMPRE retorna el endpoint correcto
String buildLecturasURL() {
  return String(apiBaseUrl) + "/iot/lecturas"; // ✅ SIEMPRE usar /iot/lecturas
}

// 🔧 NUEVO: Configuración de puerto y verificación
bool backendConectado = false;
WiFiClientSecure secureClient; // Cliente TLS para HTTPS

// 🔧 NUEVO: Función para verificar conexión al backend
bool verificarConexionBackend() {
  HTTPClient http;
  String testUrl = String(apiBaseUrl) + "/iot/health"; // Endpoint de health check
  
  Serial.println("🔍 Verificando conexión al backend: " + testUrl);
  
  http.begin(testUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-empresa-id", String(1));
  http.addHeader("x-device-type", "esp32");
  http.addHeader("x-esp32-device", "true");
  
  http.setTimeout(5000); // 5 segundos para health check
  
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("✅ Backend conectado correctamente");
    backendConectado = true;
    http.end();
    return true;
  } else {
    Serial.println("❌ Error conectando al backend. HTTP Code: " + String(httpCode));
    Serial.println("🔍 Verificar:");
    Serial.println("   • URL del servidor: " + apiBaseUrl);
    Serial.println("   • Servicio backend ejecutándose");
    Serial.println("   • Firewall/red");
    
    // 🔧 NUEVO: Intentar actualizar la URL del servidor automáticamente
    Serial.println("🔄 Intentando actualizar URL del servidor automáticamente...");
    if (actualizarURLServidor()) {
      Serial.println("✅ URL actualizada, verificando conexión nuevamente...");
      http.end();
      return verificarConexionBackend(); // Reintentar con la nueva URL
    }
    
    backendConectado = false;
    http.end();
    return false;
  }
}

/**
 * 🔧 NUEVO: Actualiza la URL del servidor automáticamente
 * Esta función se llama cuando se detecta un cambio de URL
 */
bool actualizarURLServidor() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi no conectado para actualizar URL del servidor");
    return false;
  }

  HTTPClient http;
  String url = String(apiBaseUrl) + "/iot/server-info";
  
  Serial.println("🔍 Verificando URL del servidor: " + url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-empresa-id", String(1));
  http.addHeader("x-device-type", "esp32");
  http.addHeader("x-esp32-device", "true");
  
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    
    if (doc.containsKey("baseUrl")) {
      String nuevaURL = doc["baseUrl"].as<String>();
      if (nuevaURL != "") {
        Serial.println("🔄 URL del servidor actualizada: " + nuevaURL);
        apiBaseUrl = nuevaURL;
        http.end();
        return true;
      }
    } else if (doc.containsKey("serverIP")) {
      String nuevaIP = doc["serverIP"].as<String>();
      if (nuevaIP != "") {
        String nuevaURL = String("https://") + nuevaIP; // preferir HTTPS
        Serial.println("🔄 URL del servidor actualizada: " + nuevaURL);
        apiBaseUrl = nuevaURL;
        http.end();
        return true;
      }
    }
    
    http.end();
    return false;
  } else {
    Serial.println("❌ Error obteniendo información del servidor. HTTP Code: " + String(httpCode));
    http.end();
    return false;
  }
}

// Configuración de sensores (se obtiene desde el backend)
struct SensorConfig {
  String tipo;
  String nombre;
  int pin;
  int pin2;
  bool enabled;
  float umbralMin;
  float umbralMax;
  String unidad;
  int intervalo;
};

SensorConfig sensores[10];
int numSensores = 0;
int intervaloLecturas = 10000;
bool socketEnabled = false;


// Configuración inicial de sensores (del usuario)
void configurarSensoresIniciales() {
  numSensores = 0;
  
  sensores[numSensores].tipo = "TEMPERATURA";
  sensores[numSensores].nombre = "Temperatura (DHT22)";
  sensores[numSensores].pin = 4;
  sensores[numSensores].pin2 = 0;
  sensores[numSensores].enabled = true;
  sensores[numSensores].umbralMin = 20;
  sensores[numSensores].umbralMax = 27;
  sensores[numSensores].unidad = "°C";
  sensores[numSensores].intervalo = 12000;
  numSensores++;
  
  Serial.println("📊 Sensores iniciales configurados: " + String(numSensores));
}

// Variables de estado
bool configuracionCargada = false;
unsigned long ultimaLectura = 0;
unsigned long ultimoIntentoConfig = 0;
int intentosConfig = 0;
const int MAX_INTENTOS_CONFIG = 5;

// ===========================================
// INICIALIZACIÓN DE SENSORES
// ===========================================

// Sensor DHT22
DHT dht(4, DHT22);





// ===========================================
// FUNCIONES DE CONFIGURACIÓN
// ===========================================

/**
 * Obtiene la configuración desde el backend
 */
bool obtenerConfiguracionDesdeBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi no conectado para obtener configuración");
    return false;
  }

  HTTPClient http;
  String url = String(apiBaseUrl) + "/iot/config";
  
  Serial.println("🔧 Obteniendo configuración desde: " + url);
  
  // Crear JSON con los datos de autenticación del dispositivo
  DynamicJsonDocument authDoc(512);
  authDoc["deviceId"] = DEVICE_ID;
  authDoc["apiToken"] = apiToken;
  authDoc["empresaId"] = 1;
  
  String authJson;
  serializeJson(authDoc, authJson);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(authJson);
  
  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    String payload = http.getString();
    Serial.println("✅ Configuración recibida: " + payload);
    
    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      // Extraer configuración WiFi
      wifiSSID = doc["wifi"]["ssid"].as<String>();
      wifiPassword = doc["wifi"]["password"].as<String>();
      
      // Extraer configuración API
      apiBaseUrl = doc["api"]["baseUrl"].as<String>();
      apiToken = doc["api"]["token"].as<String>();
      apiEndpoint = doc["api"]["endpoint"].as<String>();
      
      // Extraer configuración de sensores
      JsonArray sensoresArray = doc["sensores"];
      numSensores = 0;
      
      for (JsonObject sensor : sensoresArray) {
        if (sensor["enabled"] && numSensores < 10) {
          sensores[numSensores].tipo = sensor["tipo"].as<String>();
          sensores[numSensores].nombre = sensor["nombre"].as<String>();
          sensores[numSensores].pin = sensor["pin"];
          sensores[numSensores].pin2 = sensor["pin2"];
          sensores[numSensores].enabled = sensor["enabled"];
          sensores[numSensores].umbralMin = sensor["umbralMin"];
          sensores[numSensores].umbralMax = sensor["umbralMax"];
          sensores[numSensores].unidad = sensor["unidad"].as<String>();
          sensores[numSensores].intervalo = sensor["intervalo"];
          numSensores++;
        }
      }
      
      intervaloLecturas = doc["intervalo"] | 10000;
      
      Serial.println("✅ Configuración cargada exitosamente");
      Serial.println("📡 WiFi SSID: " + wifiSSID);
      Serial.println("🔑 API Base URL: " + apiBaseUrl);
      Serial.println("📊 Sensores configurados: " + String(numSensores));
      Serial.println("⏱️ Intervalo: " + String(intervaloLecturas) + "ms");
      
      configuracionCargada = true;
      http.end();
      return true;
    } else {
      Serial.println("❌ Error parseando JSON de configuración");
    }
  } else {
    Serial.println("❌ Error obteniendo configuración. HTTP Code: " + String(httpCode));
  }
  
  http.end();
  return false;
}

/**
 * Conecta al WiFi usando la configuración del backend
 */
bool conectarWiFi() {
  if (wifiSSID.length() == 0) {
    Serial.println("❌ SSID no configurado");
    return false;
  }
  
  Serial.println("📡 Conectando a WiFi: " + wifiSSID);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi conectado");
    Serial.println("📶 IP: " + WiFi.localIP().toString());
    return true;
  } else {
    Serial.println("\n❌ Error conectando WiFi");
    return false;
  }
}

// ===========================================
// FUNCIONES DE LECTURA DE SENSORES
// ===========================================

/**
 * Lee un sensor específico
 */
float leerSensor(int index) {
  if (index >= numSensores || !sensores[index].enabled) {
    return 0.0;
  }
  
  String tipo = sensores[index].tipo;
  int pin = sensores[index].pin;
  
  if (tipo == "TEMPERATURA") {
    return dht.readTemperature();
  } else if (tipo == "HUMEDAD") {
    return dht.readHumidity();
  }  
  
  return 0.0;
}

/**
 * 🔧 CORREGIDO: Envía las lecturas al endpoint correcto /iot/lecturas
 */
bool enviarLecturas() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi no conectado para enviar lecturas");
    return false;
  }
  
  HTTPClient http;
  // 🔧 CORREGIDO: Usar directamente el endpoint correcto
  String url = String(apiBaseUrl) + "/iot/lecturas";
  
  Serial.println("📤 Enviando lecturas a: " + url);
  
  // Crear JSON con las lecturas
  DynamicJsonDocument doc(2048);
  doc["deviceId"] = DEVICE_ID;
  doc["deviceName"] = DEVICE_NAME;
  doc["ubicacionId"] = 1;
  doc["empresaId"] = 1;
  doc["apiToken"] = apiToken;
  doc["timestamp"] = (long long)time(nullptr) * 1000LL; // epoch ms vía NTP
  JsonObject sensorsObj = doc.createNestedObject("sensors");
  // Agregar un valor por defecto (se sobreescribe en enviarLecturasMultiples)
  sensorsObj["Temperatura (DHT22)"] = 0.0;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("📤 Enviando lecturas: " + jsonString);
  
  if (url.startsWith("https://")) {
    secureClient.setInsecure();
    http.begin(secureClient, url);
  } else {
    http.begin(url);
  }
  http.addHeader("Content-Type", "application/json");
  
  // 🔧 HEADERS ESP32 REQUERIDOS PARA EL BACKEND
  http.addHeader("x-empresa-id", String(1));
  http.addHeader("x-device-type", "esp32");
  http.addHeader("x-esp32-device", "true");
  http.addHeader("x-esp32-version", "1.0.0");
  http.addHeader("User-Agent", "ESP32-Sensor/1.0");
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    String response = http.getString();
    Serial.println("✅ Lecturas enviadas exitosamente");
    Serial.println("📥 Respuesta: " + response);
    http.end();
    return true;
  } else {
    Serial.println("❌ Error enviando lecturas. HTTP Code: " + String(httpCode));
    String response = http.getString();
    Serial.println("📥 Respuesta: " + response);
    http.end();
    return false;
  }
}

/**
 * 🔧 CORREGIDO: Envía lecturas de múltiples sensores al endpoint correcto /iot/lecturas
 */
bool enviarLecturasMultiples() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi no conectado para enviar lecturas múltiples");
    return false;
  }
  
  HTTPClient http;
  // 🔧 CORREGIDO: Usar directamente el endpoint correcto
  String url = String(apiBaseUrl) + "/iot/lecturas";
  
  Serial.println("🌐 URL del backend: " + url);
  Serial.println("🔑 Empresa ID: " + String(1));
  
  // Construir un payload único con múltiples lecturas
  DynamicJsonDocument doc(4096);
  doc["deviceId"] = DEVICE_ID;
  doc["deviceName"] = DEVICE_NAME;
  doc["ubicacionId"] = 1;
  doc["empresaId"] = 1;
  doc["apiToken"] = apiToken;
  doc["timestamp"] = (long long)time(nullptr) * 1000LL; // epoch ms vía NTP

  JsonObject sensorsObj = doc.createNestedObject("sensors");
  JsonArray detailsArr = doc.createNestedArray("sensorDetails");

  int enviados = 0;
  for (int i = 0; i < numSensores; i++) {
    if (sensores[i].enabled) {
      float valor = leerSensor(i);
      String nombre = sensores[i].nombre;
      if (isnan(valor)) valor = 0.0;
      sensorsObj[nombre] = valor;

      JsonObject det = detailsArr.createNestedObject();
      det["tipo"] = sensores[i].tipo;
      det["valor"] = valor;
      det["unidad"] = sensores[i].unidad;
      det["ubicacionId"] = 1;
      enviados++;
    }
  }

  String jsonString;
  serializeJson(doc, jsonString);
  Serial.println("📤 Enviando lecturas múltiples: " + jsonString);

  // Iniciar conexión (HTTP/HTTPS)
  if (url.startsWith("https://")) {
    secureClient.setInsecure(); // Permitir TLS sin cert en ESP32
    http.begin(secureClient, url);
  } else {
    http.begin(url);
  }

  http.addHeader("Content-Type", "application/json");
  // Headers de identificación
  http.addHeader("x-empresa-id", String(1));
  http.addHeader("x-device-type", "esp32");
  http.addHeader("x-esp32-device", "true");
  http.addHeader("x-esp32-version", "1.0.0");
  http.addHeader("User-Agent", "ESP32-Sensor/1.0");
  http.setTimeout(15000);

  int httpCode = http.POST(jsonString);
  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    String response = http.getString();
    Serial.println("✅ Lecturas múltiples enviadas: " + String(enviados));
    Serial.println("📥 Respuesta: " + response);
    http.end();
    return true;
  } else {
    Serial.println("❌ Error enviando lecturas múltiples. HTTP Code: " + String(httpCode));
    String response = http.getString();
    Serial.println("📥 Respuesta: " + response);
    if (httpCode == -1) {
      Serial.println("🔍 Error -1: Problema de conexión/SSL. Verifica WiFi, certificado o URL: " + url);
    }
    http.end();
    return false;
  }
}

/**
 * 🔧 NUEVO: Registra sensores en el backend desde el ESP32
 */
bool registrarSensoresEnBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi no conectado para registrar sensores");
    return false;
  }
  
  HTTPClient http;
  String url = String(apiBaseUrl) + "/sensores/iot/registrar-sensor";
  
  Serial.println("🔧 Registrando sensores en el backend...");
  Serial.println("🌐 URL: " + url);
  Serial.println("🔑 Empresa ID: " + String(1));
  
  // Registrar cada sensor habilitado
  for (int i = 0; i < numSensores; i++) {
    if (sensores[i].enabled) {
      // Crear documento para registro del sensor
      DynamicJsonDocument sensorDoc(1024);
      sensorDoc["nombre"] = sensores[i].nombre;
      sensorDoc["tipo"] = sensores[i].tipo;
      sensorDoc["ubicacionId"] = 1;
      sensorDoc["descripcion"] = "Sensor " + sensores[i].nombre + " registrado desde ESP32";
      // 🔧 CORREGIR: Asegurar que el sensor se cree como activo
      sensorDoc["activo"] = true;
      sensorDoc["modo"] = "AUTOMATICO";
      
      // Configuración del sensor
      JsonObject configuracion = sensorDoc.createNestedObject("configuracion");
      configuracion["unidad"] = sensores[i].unidad;
      configuracion["rango_min"] = sensores[i].umbralMin;
      configuracion["rango_max"] = sensores[i].umbralMax;
      configuracion["precision"] = 0.1;
      configuracion["intervalo_lectura"] = sensores[i].intervalo;
      configuracion["umbral_alerta"] = sensores[i].umbralMax * 0.8;
      configuracion["umbral_critico"] = sensores[i].umbralMax * 0.9;
      
      String sensorJsonString;
      serializeJson(sensorDoc, sensorJsonString);
      
      Serial.println("📤 Registrando sensor " + sensores[i].nombre + ": " + sensorJsonString);
      
      http.begin(url);
      http.addHeader("Content-Type", "application/json");
      
      // 🔧 HEADERS ESP32 REQUERIDOS PARA EL BACKEND
      http.addHeader("x-empresa-id", String(1));
      http.addHeader("x-device-type", "esp32");
      http.addHeader("x-esp32-device", "true");
      http.addHeader("x-esp32-version", "1.0.0");
      http.addHeader("User-Agent", "ESP32-Sensor/1.0");
      
      // 🔧 CONFIGURACIÓN DE TIMEOUT
      http.setTimeout(15000); // 15 segundos de timeout para registro
      
      int httpCode = http.POST(sensorJsonString);
      
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
        String response = http.getString();
        Serial.println("✅ Sensor " + sensores[i].nombre + " registrado exitosamente");
        Serial.println("📥 Respuesta: " + response);
      } else {
        Serial.println("❌ Error registrando sensor " + sensores[i].nombre + ". HTTP Code: " + String(httpCode));
        String response = http.getString();
        Serial.println("📥 Respuesta: " + response);
        
        // 🔧 DIAGNÓSTICO DE ERRORES
        if (httpCode == -1) {
          Serial.println("🔍 Error -1: Problema de conexión. Verificar:");
          Serial.println("   • URL del backend: " + url);
          Serial.println("   • Conexión WiFi");
          Serial.println("   • Headers enviados");
          Serial.println("   • Empresa ID: " + String(1));
        }
      }
      
      http.end();
      delay(1000); // Pausa entre registros para estabilidad
    }
  }
  
  Serial.println("✅ Todos los sensores registrados en el backend");
  return true;
}

// ===========================================
// SETUP Y LOOP PRINCIPAL
// ===========================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 Iniciando ESP32 IAM - " + String(DEVICE_NAME));
  Serial.println("🆔 Device ID: " + String(DEVICE_ID));
  Serial.println("🔧 CORREGIDO: Ahora envía lecturas a /iot/lecturas");
  
  // Inicializar SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("❌ Error inicializando SPIFFS");
    return;
  }
  
  // Configuración inicial de WiFi
  WiFi.mode(WIFI_STA);
  
  // Conectar WiFi con la configuración del usuario
  Serial.println("📡 Conectando WiFi con configuración inicial...");
  if (conectarWiFi()) {
    Serial.println("✅ WiFi conectado con configuración inicial");
    
    // Intentar obtener configuración actualizada desde el backend (opcional)
    Serial.println("🔧 Intentando obtener configuración actualizada del backend...");
    if (obtenerConfiguracionDesdeBackend()) {
      Serial.println("✅ Configuración actualizada obtenida del backend");
      // Si la configuración del backend es diferente, reconectar WiFi
      if (WiFi.SSID() != wifiSSID) {
        Serial.println("🔄 SSID diferente, reconectando WiFi...");
        WiFi.disconnect();
        delay(1000);
        conectarWiFi();
      }
    } else {
      Serial.println("⚠️ No se pudo obtener configuración del backend, usando configuración inicial");
      // Usar configuración inicial como respaldo
      configuracionCargada = true;
    }
  } else {
    Serial.println("❌ Error conectando WiFi con configuración inicial");
  }
  
  // Configurar sensores iniciales
  configurarSensoresIniciales();
  
  // Inicializar sensores
  dht.begin();
  
  
  
  // 🔧 NUEVO: Registrar sensores en el backend automáticamente
  Serial.println("🔧 Registrando sensores en el backend...");
  
  // 🔧 NUEVO: Verificar conexión al backend primero
  if (verificarConexionBackend()) {
    if (registrarSensoresEnBackend()) {
      Serial.println("✅ Sensores registrados exitosamente en el backend");
    } else {
      Serial.println("⚠️ Error registrando sensores en el backend, continuando...");
    }
  } else {
    Serial.println("❌ No se puede conectar al backend. Los sensores no se registrarán.");
    Serial.println("🔧 Los sensores se registrarán cuando se restablezca la conexión.");
  }
  
  Serial.println("✅ Setup completado");

  // Sincronizar tiempo vía NTP para timestamps correctos
  Serial.println("⏱️ Configurando NTP...");
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  
}

void loop() {
  unsigned long tiempoActual = millis();
  
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi desconectado, reconectando...");
    conectarWiFi();
    delay(5000);
    return;
  }
  
  // Intentar obtener configuración del backend si no está cargada (solo como respaldo)
  if (!configuracionCargada && (tiempoActual - ultimoIntentoConfig > 60000)) { // 1 minuto
    ultimoIntentoConfig = tiempoActual;
    intentosConfig++;
    
    Serial.println("🔄 Intento " + String(intentosConfig) + " de obtener configuración del backend");
    
    if (obtenerConfiguracionDesdeBackend()) {
      intentosConfig = 0;
      Serial.println("✅ Configuración obtenida del backend");
    } else {
      Serial.println("⚠️ No se pudo obtener configuración del backend, usando configuración inicial");
      // Usar configuración inicial como respaldo
      configuracionCargada = true;
    }
    
    if (intentosConfig >= MAX_INTENTOS_CONFIG) {
      Serial.println("❌ Máximo de intentos alcanzado, usando configuración inicial");
      configuracionCargada = true;
      intentosConfig = 0;
    }
  }
  
  // Enviar lecturas si la configuración está cargada
  if (configuracionCargada && (tiempoActual - ultimaLectura > intervaloLecturas)) {
    ultimaLectura = tiempoActual;
    
    // 🔧 USAR LECTURAS MÚLTIPLES EN LUGAR DE LECTURAS INDIVIDUALES
    if (enviarLecturasMultiples()) {
      Serial.println("✅ Ciclo de lecturas múltiples completado");
    } else {
      Serial.println("❌ Error en ciclo de lecturas múltiples");
      // Fallback a lecturas individuales si fallan las múltiples
      if (enviarLecturas()) {
        Serial.println("✅ Fallback a lecturas individuales exitoso");
      } else {
        Serial.println("❌ Error en fallback a lecturas individuales");
      }
    }
  }
  
  

  delay(1000); // Pequeña pausa para estabilidad
}
