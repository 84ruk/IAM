export const ARDUINO_CODE_TEMPLATE = (config: any) => {
  const sensoresHabilitados = config.sensores.filter((s: any) => s.enabled);
  const tieneTemperatura = sensoresHabilitados.some((s: any) => s.tipo === 'TEMPERATURA');
  const tieneHumedad = sensoresHabilitados.some((s: any) => s.tipo === 'HUMEDAD');
  const tienePeso = sensoresHabilitados.some((s: any) => s.tipo === 'PESO');
  const tienePresion = sensoresHabilitados.some((s: any) => s.tipo === 'PRESION');

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]; // Formato seguro para C++
  
  return `/*
 * ESP32 IAM - Sistema de Lecturas Periodicas
 * Codigo generado automaticamente para: ${config.deviceName}
 * Device ID: ${config.deviceId}
 * Fecha de generacion: ${timestamp}
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
${config.socketEnabled ? '#include <WebSocketsClient.h>' : ''}
${tieneTemperatura || tieneHumedad ? '#include <DHT.h>' : ''}
${tienePeso ? '#include <HX711.h>' : ''}
${tienePresion ? '#include <Adafruit_Sensor.h>\n#include <Adafruit_BMP280.h>' : ''}
#include <SPI.h>
#include <Wire.h>

// ===========================================
// CONFIGURACIÓN DEL DISPOSITIVO
// ===========================================

// Información del dispositivo
#define DEVICE_ID "${config.deviceId}"
#define DEVICE_NAME "${config.deviceName}"

// Configuración WiFi (configuración inicial del usuario)
String wifiSSID = "${config.wifi.ssid}";
String wifiPassword = "${config.wifi.password}";

// Configuración API (se obtiene automáticamente del backend)
String apiBaseUrl = "${(config.api?.baseUrl || '').replace(/\/$/, '')}"; // Normalizar sin slash final
String apiToken = "${config.api.token}";
String apiEndpoint = "${(config.api?.endpoint || '/iot/lecturas').startsWith('/') ? (config.api?.endpoint || '/iot/lecturas') : '/' + (config.api?.endpoint || '/iot/lecturas')}"; // Asegurar prefijo '/'

// Sanitizar endpoint (evitar valores "null" o vacíos)
String sanitizeEndpoint(String ep) {
  if (ep.length() == 0) return "/iot/lecturas";
  ep.trim();
  ep.toLowerCase();
  if (ep == "null" || ep == "undefined") return "/iot/lecturas";
  if (!ep.startsWith("/")) ep = String("/") + ep;
  return ep;
}

// Construir URL final de lecturas
String buildLecturasURL() {
  String base = String(apiBaseUrl);
  if (base.endsWith("/")) base.remove(base.length()-1);
  String ep = sanitizeEndpoint(apiEndpoint);
  return base + ep;
}

// 🔧 NUEVO: Configuración de puerto y verificación
// int apiPort = 3001; // Puerto del backend - ELIMINADO
bool backendConectado = false;
WiFiClientSecure secureClient; // Cliente TLS para HTTPS

// 🔧 NUEVO: Función para verificar conexión al backend
bool verificarConexionBackend() {
  HTTPClient http;
  String testUrl = String(apiBaseUrl) + "/iot/health"; // Endpoint de health check
  
  Serial.println("🔍 Verificando conexión al backend: " + testUrl);
  
  http.begin(testUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-empresa-id", String(${config.empresaId}));
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
  http.addHeader("x-empresa-id", String(${config.empresaId}));
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
int intervaloLecturas = ${config.intervalo};
bool socketEnabled = ${config.socketEnabled ? 'true' : 'false'};
${config.socketEnabled ? `
// ======= WEBSOCKET =======
WebSocketsClient webSocket;
bool wsConectado = false;

String buildWebSocketURL() {
  String base = String(apiBaseUrl);
  base.replace("http://", "ws://");
  base.replace("https://", "wss://");
  if (base.endsWith("/")) base.remove(base.length()-1);
  return base + "/iot";
}

void configurarWebSocket() {
  String wsUrl = buildWebSocketURL();
  Serial.println("🔌 Configurando WebSocket: " + wsUrl);
  // Parse host y path desde wsUrl
  String proto, host, path;
  int idx = wsUrl.indexOf("://");
  if (idx > 0) {
    proto = wsUrl.substring(0, idx);
    String rest = wsUrl.substring(idx + 3);
    int slashIdx = rest.indexOf("/");
    host = slashIdx > 0 ? rest.substring(0, slashIdx) : rest;
    path = slashIdx > 0 ? rest.substring(slashIdx) : "/iot";
  } else {
    host = wsUrl;
    path = "/iot";
  }
  int port = 80;
  bool useSSL = proto == "wss";
  if (host.indexOf(":") > 0) {
    port = host.substring(host.indexOf(":") + 1).toInt();
    host = host.substring(0, host.indexOf(":"));
  } else {
    port = useSSL ? 443 : 80;
  }

  if (useSSL) {
    webSocket.beginSSL(host.c_str(), port, path.c_str());
  } else {
    webSocket.begin(host.c_str(), port, path.c_str());
  }

  // Headers extra
  String headers = String("x-device-id: ") + DEVICE_ID + "\r\n";
  headers += String("x-empresa-id: ") + String(${config.empresaId}) + "\r\n";
  headers += String("x-device-type: esp32");
  webSocket.setExtraHeaders(headers.c_str());

  webSocket.onEvent([](WStype_t type, uint8_t * payload, size_t length){
    switch (type) {
      case WStype_CONNECTED:
        wsConectado = true;
        Serial.println("✅ WebSocket conectado");
        break;
      case WStype_DISCONNECTED:
        wsConectado = false;
        Serial.println("❌ WebSocket desconectado");
        break;
      case WStype_TEXT: {
        String msg = String((char*)payload).substring(0, length);
        Serial.println("💬 Mensaje WS: " + msg);
        if (msg.indexOf("socket:on") >= 0) { socketEnabled = true; }
        if (msg.indexOf("socket:off") >= 0) { socketEnabled = false; if (wsConectado) webSocket.disconnect(); }
        break;
      }
      default: break;
    }
  });

  webSocket.setReconnectInterval(5000);
}
` : ''}

// Configuración inicial de sensores (del usuario)
void configurarSensoresIniciales() {
  numSensores = 0;
  ${sensoresHabilitados.map((sensor: any) => `
  sensores[numSensores].tipo = "${sensor.tipo}";
  sensores[numSensores].nombre = "${sensor.nombre}";
  sensores[numSensores].pin = ${sensor.pin};
  sensores[numSensores].pin2 = ${sensor.pin2};
  sensores[numSensores].enabled = true;
  sensores[numSensores].umbralMin = ${sensor.umbralMin};
  sensores[numSensores].umbralMax = ${sensor.umbralMax};
  sensores[numSensores].unidad = "${sensor.unidad}";
  sensores[numSensores].intervalo = ${sensor.intervalo};
  numSensores++;`).join('\n  ')}
  
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

${tieneTemperatura || tieneHumedad ? `// Sensor DHT22
DHT dht(4, DHT22);` : ''}

${tienePeso ? `// Sensor HX711 (Peso)
HX711 scale;` : ''}

${tienePresion ? `// Sensor BMP280 (Presión)
Adafruit_BMP280 bmp;` : ''}

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
  authDoc["empresaId"] = ${config.empresaId};
  
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
      
      intervaloLecturas = doc["intervalo"] | ${config.intervalo};
      
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
    Serial.println("\\n✅ WiFi conectado");
    Serial.println("📶 IP: " + WiFi.localIP().toString());
    return true;
  } else {
    Serial.println("\\n❌ Error conectando WiFi");
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
  } ${tienePeso ? `else if (tipo == "PESO") {
    if (scale.is_ready()) {
      return scale.get_units();
    }
    return 0.0;
  }` : ''} ${tienePresion ? `else if (tipo == "PRESION") {
    return bmp.readPressure() / 100.0; // Convertir a hPa
  }` : ''}
  
  return 0.0;
}

/**
 * Envía las lecturas al backend
 */
bool enviarLecturas() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi no conectado para enviar lecturas");
    return false;
  }
  
  HTTPClient http;
  String url = buildLecturasURL();
  
  // Crear JSON con las lecturas
  DynamicJsonDocument doc(2048);
  doc["deviceId"] = DEVICE_ID;
  doc["deviceName"] = DEVICE_NAME;
  doc["ubicacionId"] = ${config.ubicacionId};
  doc["empresaId"] = ${config.empresaId};
  doc["apiToken"] = apiToken;
  doc["timestamp"] = (long long)time(nullptr) * 1000LL; // epoch ms vía NTP
  JsonObject sensorsObj = doc.createNestedObject("sensors");
  // Agregar un valor por defecto (se sobreescribe en enviarLecturasMultiples)
  sensorsObj["${sensoresHabilitados[0]?.nombre || 'sensor'}"] = 0.0;
  
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
  http.addHeader("x-empresa-id", String(${config.empresaId}));
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
 * 🔧 NUEVO: Envía lecturas de múltiples sensores al backend
 */
bool enviarLecturasMultiples() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi no conectado para enviar lecturas múltiples");
    return false;
  }
  
  HTTPClient http;
  // Usar el endpoint público IoT correcto (múltiples lecturas)
  String url = buildLecturasURL();
  
  Serial.println("🌐 URL del backend: " + url);
  Serial.println("🔑 Empresa ID: " + String(${config.empresaId}));
  
  // Construir un payload único con múltiples lecturas
  DynamicJsonDocument doc(4096);
  doc["deviceId"] = DEVICE_ID;
  doc["deviceName"] = DEVICE_NAME;
  doc["ubicacionId"] = ${config.ubicacionId};
  doc["empresaId"] = ${config.empresaId};
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
      det["ubicacionId"] = ${config.ubicacionId};
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
  http.addHeader("x-empresa-id", String(${config.empresaId}));
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
  Serial.println("🔑 Empresa ID: " + String(${config.empresaId}));
  
  // Registrar cada sensor habilitado
  for (int i = 0; i < numSensores; i++) {
    if (sensores[i].enabled) {
      // Crear documento para registro del sensor
      DynamicJsonDocument sensorDoc(1024);
      sensorDoc["nombre"] = sensores[i].nombre;
      sensorDoc["tipo"] = sensores[i].tipo;
      sensorDoc["ubicacionId"] = ${config.ubicacionId};
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
      http.addHeader("x-empresa-id", String(${config.empresaId}));
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
          Serial.println("   • Empresa ID: " + String(${config.empresaId}));
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
  Serial.println("\\n🚀 Iniciando ESP32 IAM - " + String(DEVICE_NAME));
  Serial.println("🆔 Device ID: " + String(DEVICE_ID));
  
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
  ${tieneTemperatura || tieneHumedad ? `dht.begin();` : ''}
  ${tienePeso ? `scale.begin(16, 17); // DT, SCK pins
  scale.set_scale(2280.f); // Factor de calibración
  scale.tare();` : ''}
  ${tienePresion ? `if (!bmp.begin(0x76)) {
    Serial.println("❌ Error inicializando BMP280");
  }` : ''}
  
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

  ${config.socketEnabled ? `// Iniciar WebSocket si está habilitado
  if (socketEnabled) {
    configurarWebSocket();
  }` : ''}
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
  
  ${config.socketEnabled ? `// Mantener WS si está activado
  if (socketEnabled) {
    webSocket.loop();
  }` : ''}

  delay(1000); // Pequeña pausa para estabilidad
}
`;
};

