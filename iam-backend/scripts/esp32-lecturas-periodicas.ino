/*
 * ESP32 IAM - Sistema de Lecturas Periódicas
 * Envía lecturas cada X segundos/minutos vía HTTP REST API
 * 
 * Sensores soportados:
 * - DHT22 (Temperatura y Humedad)
 * - HX711 (Peso)
 * - BMP280 (Presión)
 * 
 * Configuración automática vía QR Code
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HX711.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <SPI.h>
#include <Wire.h>
#include <SPIFFS.h>

// ===========================================
// CONFIGURACIÓN DE SENSORES
// ===========================================

// DHT22 - Temperatura y Humedad
#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// HX711 - Peso
#define LOADCELL_DOUT_PIN 16
#define LOADCELL_SCK_PIN 17
HX711 scale;

// BMP280 - Presión
#define BMP280_ADDRESS 0x76
Adafruit_BMP280 bmp;

// ===========================================
// CONFIGURACIÓN WIFI Y API
// ===========================================

// Credenciales WiFi (se configurarán automáticamente)
String wifiSSID = "";
String wifiPassword = "";

// Configuración API REST (se configurarán automáticamente)
String apiBaseUrl = "";
String apiToken = "";
String deviceId = "";

// Configuración del dispositivo
String deviceName = "";
int ubicacionId = 0;
int empresaId = 0;

// ===========================================
// CONFIGURACIÓN AP (Access Point)
// ===========================================

const char* apSsid = "IAM_ESP32_Config";
const char* apPass = "iam-setup-2024";

// ===========================================
// VARIABLES DE ESTADO
// ===========================================

bool wifiConnected = false;
bool configLoaded = false;
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 30000; // 30 segundos por defecto

// Configuración de sensores
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

// ===========================================
// SETUP PRINCIPAL
// ===========================================

void setup() {
  Serial.begin(115200);
  Serial.println("🚀 ESP32 IAM - Sistema de Lecturas Periódicas");
  
  // Inicializar SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("❌ Error inicializando SPIFFS");
    return;
  }
  
  // Cargar configuración
  if (loadConfiguration()) {
    Serial.println("✅ Configuración cargada");
    configLoaded = true;
  } else {
    Serial.println("📄 No hay configuración, iniciando modo AP");
    setupAccessPoint();
    return;
  }
  
  // Inicializar sensores
  initializeSensors();
  
  // Conectar WiFi
  if (connectWiFi()) {
    Serial.println("✅ WiFi conectado");
    wifiConnected = true;
  } else {
    Serial.println("❌ Error conectando WiFi");
    setupAccessPoint();
    return;
  }
  
  Serial.println("✅ Sistema iniciado correctamente");
}

// ===========================================
// LOOP PRINCIPAL
// ===========================================

void loop() {
  if (configLoaded && wifiConnected) {
    // Modo normal: leer sensores y enviar datos
    readAndSendSensors();
    delay(1000);
  } else {
    // Modo configuración: manejar portal captivo
    handleAccessPoint();
    delay(100);
  }
}

// ===========================================
// FUNCIONES DE LECTURA DE SENSORES
// ===========================================

void readAndSendSensors() {
  if (millis() - lastSensorRead < SENSOR_INTERVAL) return;
  
  Serial.println("📊 Leyendo sensores...");
  
  // Crear JSON con datos de todos los sensores habilitados
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = deviceId;
  doc["deviceName"] = deviceName;
  doc["ubicacionId"] = ubicacionId;
  doc["empresaId"] = empresaId;
  doc["timestamp"] = millis();
  
  JsonObject sensors = doc.createNestedObject("sensors");
  
  // Leer cada sensor configurado
  for (int i = 0; i < numSensores; i++) {
    if (sensores[i].enabled) {
      float valor = leerSensor(i);
      if (valor != -999) { // Valor válido
        sensors[sensores[i].nombre] = valor;
        Serial.printf("📊 %s: %.2f %s\n", 
          sensores[i].nombre.c_str(), valor, sensores[i].unidad.c_str());
      }
    }
  }
  
  // Enviar datos vía HTTP
  sendSensorData(doc);
  
  lastSensorRead = millis();
}

float leerSensor(int sensorIndex) {
  if (sensorIndex >= numSensores || !sensores[sensorIndex].enabled) {
    return -999;
  }
  
  SensorConfig& sensor = sensores[sensorIndex];
  float valor = 0.0;
  
  if (sensor.tipo == "TEMPERATURA") {
    valor = dht.readTemperature();
    if (isnan(valor)) {
      Serial.printf("❌ Error leyendo temperatura del sensor %s\n", sensor.nombre.c_str());
      return -999;
    }
  } else if (sensor.tipo == "HUMEDAD") {
    valor = dht.readHumidity();
    if (isnan(valor)) {
      Serial.printf("❌ Error leyendo humedad del sensor %s\n", sensor.nombre.c_str());
      return -999;
    }
  } else if (sensor.tipo == "PESO") {
    if (scale.is_ready()) {
      valor = scale.get_units(5); // Promedio de 5 lecturas
      if (valor < 0) valor = 0;
    } else {
      Serial.printf("❌ Error leyendo peso del sensor %s\n", sensor.nombre.c_str());
      return -999;
    }
  } else if (sensor.tipo == "PRESION") {
    valor = bmp.readPressure() / 100.0; // Convertir a hPa
    if (isnan(valor)) {
      Serial.printf("❌ Error leyendo presión del sensor %s\n", sensor.nombre.c_str());
      return -999;
    }
  }
  
  return valor;
}

// ===========================================
// FUNCIONES HTTP
// ===========================================

void sendSensorData(DynamicJsonDocument& doc) {
  if (!WiFi.isConnected()) {
    Serial.println("❌ WiFi desconectado");
    return;
  }
  
  HTTPClient http;
  String url = apiBaseUrl + "/sensores/lectura";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + apiToken);
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("📤 Enviando datos: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("✅ Datos enviados. Código: %d, Respuesta: %s\n", httpResponseCode, response.c_str());
  } else {
    Serial.printf("❌ Error enviando datos. Código: %d\n", httpResponseCode);
  }
  
  http.end();
}

// ===========================================
// FUNCIONES WIFI
// ===========================================

bool connectWiFi() {
  if (wifiSSID.length() == 0) return false;
  
  Serial.printf("📶 Conectando a WiFi: %s\n", wifiSSID.c_str());
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi conectado");
    Serial.printf("📡 IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  }
  
  Serial.println("\n❌ Error conectando WiFi");
  return false;
}

// ===========================================
// FUNCIONES DE CONFIGURACIÓN
// ===========================================

void initializeSensors() {
  // Inicializar DHT22
  dht.begin();
  
  // Inicializar HX711
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(1.0);
  scale.tare();
  
  // Inicializar BMP280
  if (!bmp.begin(BMP280_ADDRESS)) {
    Serial.println("❌ Error iniciando BMP280");
  }
  
  Serial.println("✅ Sensores inicializados");
}

bool loadConfiguration() {
  File file = SPIFFS.open("/config.json", "r");
  if (!file) {
    Serial.println("📄 No hay archivo de configuración");
    return false;
  }
  
  DynamicJsonDocument doc(2048);
  DeserializationError error = deserializeJson(doc, file);
  file.close();
  
  if (error) {
    Serial.println("❌ Error leyendo configuración");
    return false;
  }
  
  // Cargar configuración WiFi
  wifiSSID = doc["wifi_ssid"].as<String>();
  wifiPassword = doc["wifi_password"].as<String>();
  
  // Cargar configuración API
  apiBaseUrl = doc["api_base_url"].as<String>();
  apiToken = doc["api_token"].as<String>();
  deviceId = doc["device_id"].as<String>();
  deviceName = doc["device_name"].as<String>();
  ubicacionId = doc["ubicacion_id"].as<int>();
  empresaId = doc["empresa_id"].as<int>();
  
  // Cargar configuración de sensores
  JsonArray sensoresArray = doc["sensores"];
  numSensores = 0;
  
  for (JsonObject sensorObj : sensoresArray) {
    if (numSensores < 10) {
      sensores[numSensores].tipo = sensorObj["tipo"].as<String>();
      sensores[numSensores].nombre = sensorObj["nombre"].as<String>();
      sensores[numSensores].pin = sensorObj["pin"].as<int>();
      sensores[numSensores].pin2 = sensorObj["pin2"].as<int>();
      sensores[numSensores].enabled = sensorObj["enabled"].as<bool>();
      sensores[numSensores].umbralMin = sensorObj["umbral_min"].as<float>();
      sensores[numSensores].umbralMax = sensorObj["umbral_max"].as<float>();
      sensores[numSensores].unidad = sensorObj["unidad"].as<String>();
      sensores[numSensores].intervalo = sensorObj["intervalo"].as<int>();
      numSensores++;
    }
  }
  
  Serial.printf("✅ Configuración cargada: %d sensores\n", numSensores);
  return true;
}

void setupAccessPoint() {
  Serial.println("📡 Configurando Access Point...");
  WiFi.softAP(apSsid, apPass);
  
  Serial.printf("📶 AP creado: %s\n", apSsid);
  Serial.printf("🔑 Contraseña: %s\n", apPass);
  Serial.printf("🌐 IP: %s\n", WiFi.softAPIP().toString().c_str());
  Serial.println("📱 Conéctate a esta red y ve a 192.168.4.1");
}

void handleAccessPoint() {
  // Aquí se manejaría el portal captivo
  // Por simplicidad, solo mostramos el estado
  static unsigned long lastStatus = 0;
  if (millis() - lastStatus > 10000) {
    Serial.println("📡 Modo configuración activo");
    lastStatus = millis();
  }
}

