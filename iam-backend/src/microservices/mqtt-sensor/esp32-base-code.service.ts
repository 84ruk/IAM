import { Injectable, Logger } from '@nestjs/common';

export interface ESP32BaseCodeConfig {
  deviceName: string;
  wifiSSID: string;
  wifiPassword: string;
  mqttConfig: {
    server: string;
    port: number;
    username: string;
    password: string;
    topic: string;
  };
  sensores: {
    tipo: string;
    nombre: string;
    pin: number;
  }[];
}

@Injectable()
export class ESP32BaseCodeService {
  private readonly logger = new Logger(ESP32BaseCodeService.name);

  /**
   * Genera el código base ESP32 con portal captivo mejorado
   * Este código debe ser subido al ESP32 una sola vez
   */
  generateBaseCode(): string {
    return `/*
 * ESP32 Auto-Configuration Base Code
 * Sistema IAM - Configuración Automática
 * 
 * Este código crea un portal captivo para configurar el ESP32
 * sin necesidad de subir código manualmente.
 * 
 * Instrucciones:
 * 1. Sube este código al ESP32 una sola vez
 * 2. Conecta el ESP32 a la corriente
 * 3. El ESP32 creará una red WiFi "ESP32_Config"
 * 4. Conéctate a esa red y ve a 192.168.4.1
 * 5. Escanea el QR que aparece en la pantalla
 * 6. ¡Listo! El ESP32 se configurará automáticamente
 */

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <WiFiManager.h>

// Configuración del portal captivo
const char* AP_SSID = "ESP32_Config";
const char* AP_PASSWORD = "12345678";
const int AP_PORT = 80;
const int DNS_PORT = 53;

// Variables globales
WebServer server(AP_PORT);
DNSServer dnsServer;
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Estado del dispositivo
bool isConfigured = false;
String deviceConfig = "";

// Configuración por defecto (se actualizará automáticamente)
String wifiSSID = "";
String wifiPassword = "";
String mqttServer = "h02f10fd.ala.us-east-1.emqxsl.com";
int mqttPort = 8883;
String mqttUsername = "";
String mqttPassword = "";
String mqttTopic = "";

// Configuración dinámica de sensores
struct SensorConfig {
  String tipo;
  String nombre;
  int pin;
  int pin2; // Para sensores que necesitan 2 pines
  String libreria;
  int intervalo;
  String unidad;
  float rangoMin;
  float rangoMax;
  float factorCalibracion;
  float offset;
  bool enabled;
  unsigned long ultimaLectura;
};

// Array dinámico de sensores (se configura automáticamente)
SensorConfig sensores[10]; // Máximo 10 sensores
int numSensores = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("\\n🚀 ESP32 Auto-Configuration System");
  Serial.println("=====================================");
  
  // Inicializar SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("❌ Error inicializando SPIFFS");
    return;
  }
  
  // Verificar si ya está configurado
  if (loadConfiguration()) {
    Serial.println("✅ Configuración encontrada, iniciando modo normal");
    isConfigured = true;
    startNormalMode();
  } else {
    Serial.println("🔧 No hay configuración, iniciando portal captivo");
    startCaptivePortal();
  }
}

void loop() {
  if (isConfigured) {
    // Modo normal - enviar datos de sensores
    normalModeLoop();
  } else {
    // Modo portal captivo
    dnsServer.processNextRequest();
    server.handleClient();
  }
}

// ===========================================
// MODO PORTAL CAPTIVO
// ===========================================

void startCaptivePortal() {
  Serial.println("📡 Iniciando portal captivo...");
  
  // Configurar modo AP
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  
  Serial.print("📶 Red WiFi creada: ");
  Serial.println(AP_SSID);
  Serial.print("🔑 Contraseña: ");
  Serial.println(AP_PASSWORD);
  Serial.print("🌐 IP del portal: ");
  Serial.println(WiFi.softAPIP());
  
  // Configurar DNS para capturar todas las peticiones
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
  
  // Configurar rutas del servidor web
  setupWebRoutes();
  
  // Iniciar servidor
  server.begin();
  Serial.println("✅ Portal captivo iniciado");
  Serial.println("📱 Conéctate a la red WiFi y ve a cualquier página web");
}

void setupWebRoutes() {
  // Página principal
  server.on("/", HTTP_GET, handleRoot);
  
  // Página de configuración
  server.on("/config", HTTP_GET, handleConfig);
  
  // Recibir configuración
  server.on("/configure", HTTP_POST, handleConfigure);
  
  // Página de estado
  server.on("/status", HTTP_GET, handleStatus);
  
  // Capturar todas las demás peticiones
  server.onNotFound(handleNotFound);
}

void handleRoot() {
  String html = R"(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESP32 Auto-Configuration</title>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .step { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007bff; }
        .step h3 { margin-top: 0; color: #007bff; }
        .qr-container { text-align: center; margin: 30px 0; }
        .qr-code { border: 2px solid #ddd; padding: 20px; display: inline-block; border-radius: 8px; }
        .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
        .status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .status.warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .btn { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        .btn:hover { background: #0056b3; }
        .btn.secondary { background: #6c757d; }
        .btn.secondary:hover { background: #545b62; }
        .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .device-info { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .device-info h4 { margin-top: 0; color: #495057; }
        .device-info p { margin: 5px 0; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ESP32 Auto-Configuration</h1>
        
        <div class="step">
            <h3>📋 Configuración Automática</h3>
            <p>Este ESP32 está listo para configurarse automáticamente. Sigue estos pasos:</p>
            <ol>
                <li>Ve a tu aplicación IAM</li>
                <li>Genera la configuración automática</li>
                <li>Escanea el código QR que aparece</li>
                <li>El ESP32 se configurará automáticamente</li>
            </ol>
            
            <div class="qr-container">
                <h4>🔍 Código QR de Configuración</h4>
                <div id="qrCode" class="qr-code">
                    <div class="loading"></div>
                    <p>Generando código QR...</p>
                </div>
                <p class="text-muted">Escanea este código QR desde tu aplicación IAM</p>
            </div>
        </div>
        
        <div class="step">
            <h3>🔧 Configuración Manual (Opcional)</h3>
            <p>Si prefieres configurar manualmente:</p>
            <a href="/config" class="btn">Configurar Manualmente</a>
        </div>
        
        <div class="step">
            <h3>📊 Estado del Dispositivo</h3>
            <div id="status">Cargando...</div>
            <div id="deviceInfo" class="device-info" style="display: none;">
                <h4>Información del Dispositivo</h4>
                <p><strong>ID:</strong> <span id="deviceId">-</span></p>
                <p><strong>Estado:</strong> <span id="deviceStatus">-</span></p>
                <p><strong>Última actualización:</strong> <span id="lastUpdate">-</span></p>
            </div>
        </div>
        
        <div class="step">
            <h3>🔒 Seguridad</h3>
            <p>Este portal está protegido. Solo dispositivos autorizados pueden acceder a la configuración.</p>
            <div class="status warning">
                ⚠️ No compartas este enlace con personas no autorizadas
            </div>
        </div>
    </div>
    
    <script>
        // Generar código QR automáticamente
        function generateQRCode() {
            const configUrl = window.location.origin + '/api/mqtt-sensor/esp32/config/' + getDeviceToken();
            
            QRCode.toCanvas(document.getElementById('qrCode'), configUrl, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, function (error) {
                if (error) {
                    console.error('Error generando QR:', error);
                    document.getElementById('qrCode').innerHTML = '<p>Error generando código QR</p>';
                } else {
                    console.log('QR Code generado exitosamente');
                }
            });
        }
        
        // Obtener token del dispositivo (simulado)
        function getDeviceToken() {
            // En un caso real, esto vendría del ESP32
            return 'esp32_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        // Actualizar estado del dispositivo
        function updateDeviceStatus() {
            fetch('/status')
                .then(response => response.json())
                .then(data => {
                    const statusDiv = document.getElementById('status');
                    const deviceInfo = document.getElementById('deviceInfo');
                    
                    if (data.configured) {
                        statusDiv.innerHTML = '<div class="status success">✅ Dispositivo configurado y funcionando</div>';
                        deviceInfo.style.display = 'block';
                        document.getElementById('deviceId').textContent = data.deviceId || 'N/A';
                        document.getElementById('deviceStatus').textContent = 'Conectado';
                        document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
                    } else {
                        statusDiv.innerHTML = '<div class="status warning">⏳ Esperando configuración automática...</div>';
                        deviceInfo.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('status').innerHTML = '<div class="status error">❌ Error obteniendo estado</div>';
                });
        }
        
        // Inicializar
        document.addEventListener('DOMContentLoaded', function() {
            generateQRCode();
            updateDeviceStatus();
            
            // Actualizar cada 5 segundos
            setInterval(updateDeviceStatus, 5000);
        });
    </script>
</body>
</html>
  )";
  
  server.send(200, "text/html", html);
}

void handleConfig() {
  String html = R"(
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuración Manual ESP32</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input, select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box; }
        .btn { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; width: 100%; }
        .btn:hover { background: #0056b3; }
        .status { padding: 15px; border-radius: 5px; margin: 20px 0; display: none; }
        .status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Configuración Manual</h1>
        
        <form id="configForm">
            <div class="form-group">
                <label for="wifiSSID">SSID WiFi:</label>
                <input type="text" id="wifiSSID" name="wifiSSID" required>
            </div>
            
            <div class="form-group">
                <label for="wifiPassword">Contraseña WiFi:</label>
                <input type="password" id="wifiPassword" name="wifiPassword" required>
            </div>
            
            <div class="form-group">
                <label for="mqttServer">Servidor MQTT:</label>
                <input type="text" id="mqttServer" name="mqttServer" value="h02f10fd.ala.us-east-1.emqxsl.com" required>
            </div>
            
            <div class="form-group">
                <label for="mqttPort">Puerto MQTT:</label>
                <input type="number" id="mqttPort" name="mqttPort" value="8883" required>
            </div>
            
            <div class="form-group">
                <label for="mqttUsername">Usuario MQTT:</label>
                <input type="text" id="mqttUsername" name="mqttUsername" required>
            </div>
            
            <div class="form-group">
                <label for="mqttPassword">Contraseña MQTT:</label>
                <input type="password" id="mqttPassword" name="mqttPassword" required>
            </div>
            
            <div class="form-group">
                <label for="mqttTopic">Tópico MQTT:</label>
                <input type="text" id="mqttTopic" name="mqttTopic" required>
            </div>
            
            <button type="submit" class="btn">💾 Guardar Configuración</button>
        </form>
        
        <div id="status" class="status"></div>
    </div>
    
    <script>
        document.getElementById('configForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            fetch('/configure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                const statusDiv = document.getElementById('status');
                statusDiv.style.display = 'block';
                
                if (result.success) {
                    statusDiv.className = 'status success';
                    statusDiv.innerHTML = '✅ Configuración guardada exitosamente. El ESP32 se reiniciará en 5 segundos...';
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 5000);
                } else {
                    statusDiv.className = 'status error';
                    statusDiv.innerHTML = '❌ Error: ' + result.message;
                }
            })
            .catch(error => {
                const statusDiv = document.getElementById('status');
                statusDiv.style.display = 'block';
                statusDiv.className = 'status error';
                statusDiv.innerHTML = '❌ Error de conexión';
            });
        });
    </script>
</body>
</html>
  )";
  
  server.send(200, "text/html", html);
}

void handleConfigure() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, body);
    
    if (!error) {
      // Extraer configuración
      wifiSSID = doc["wifiSSID"].as<String>();
      wifiPassword = doc["wifiPassword"].as<String>();
      mqttServer = doc["mqttServer"].as<String>();
      mqttPort = doc["mqttPort"].as<int>();
      mqttUsername = doc["mqttUsername"].as<String>();
      mqttPassword = doc["mqttPassword"].as<String>();
      mqttTopic = doc["mqttTopic"].as<String>();
      
      // Guardar configuración
      if (saveConfiguration()) {
        server.send(200, "application/json", "{\\"success\\": true, \\"message\\": \\"Configuración guardada\\"}");
        
        // Reiniciar en modo normal
        delay(1000);
        ESP.restart();
      } else {
        server.send(500, "application/json", "{\\"success\\": false, \\"message\\": \\"Error guardando configuración\\"}");
      }
    } else {
      server.send(400, "application/json", "{\\"success\\": false, \\"message\\": \\"Datos JSON inválidos\\"}");
    }
  } else {
    server.send(400, "application/json", "{\\"success\\": false, \\"message\\": \\"No se recibieron datos\\"}");
  }
}

void handleStatus() {
  DynamicJsonDocument doc(256);
  doc["configured"] = isConfigured;
  doc["wifi_connected"] = WiFi.status() == WL_CONNECTED;
  doc["mqtt_connected"] = mqttClient.connected();
  doc["uptime"] = millis();
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleNotFound() {
  // Redirigir a la página principal
  server.sendHeader("Location", "/", true);
  server.send(302, "text/plain", "");
}

// ===========================================
// MODO NORMAL - ENVÍO DE DATOS
// ===========================================

void startNormalMode() {
  Serial.println("🌐 Conectando a WiFi...");
  
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n✅ WiFi conectado");
    Serial.print("📡 IP: ");
    Serial.println(WiFi.localIP());
    
    // Configurar MQTT
    mqttClient.setServer(mqttServer.c_str(), mqttPort);
    mqttClient.setCallback(mqttCallback);
    
    Serial.println("🚀 Iniciando envío de datos...");
  } else {
    Serial.println("\\n❌ Error conectando WiFi");
    Serial.println("🔄 Reiniciando en modo portal captivo...");
    delay(2000);
    ESP.restart();
  }
}

void normalModeLoop() {
  // Reconectar MQTT si es necesario
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  // Leer y enviar datos de sensores dinámicamente
  unsigned long ahora = millis();
  
  for (int i = 0; i < numSensores; i++) {
    if (sensores[i].enabled && (ahora - sensores[i].ultimaLectura > sensores[i].intervalo)) {
      sensores[i].ultimaLectura = ahora;
      leerSensor(i);
    }
  }
  
  // Enviar datos consolidados cada 30 segundos
  static unsigned long lastSend = 0;
  if (ahora - lastSend > 30000) {
    lastSend = ahora;
    sendSensorData();
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("🔌 Reconectando MQTT...");
    
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str(), mqttUsername.c_str(), mqttPassword.c_str())) {
      Serial.println("✅ MQTT conectado");
    } else {
      Serial.print("❌ Error, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" reintentando en 5 segundos");
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📨 Mensaje recibido [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

// Función para leer un sensor específico
void leerSensor(int sensorIndex) {
  if (sensorIndex >= numSensores || !sensores[sensorIndex].enabled) {
    return;
  }
  
  SensorConfig& sensor = sensores[sensorIndex];
  float valor = 0.0;
  bool lecturaExitosa = false;
  
  if (sensor.tipo == "TEMPERATURA") {
    // Leer temperatura del DHT22
    valor = leerTemperatura(sensor.pin);
    lecturaExitosa = !isnan(valor);
  } else if (sensor.tipo == "HUMEDAD") {
    // Leer humedad del DHT22
    valor = leerHumedad(sensor.pin);
    lecturaExitosa = !isnan(valor);
  } else if (sensor.tipo == "PESO") {
    // Leer peso del HX711
    valor = leerPeso(sensor.pin, sensor.pin2, sensor.factorCalibracion, sensor.offset);
    lecturaExitosa = valor > 0;
  } else if (sensor.tipo == "PRESION") {
    // Leer presión del BMP280
    valor = leerPresion(sensor.pin, sensor.pin2);
    lecturaExitosa = valor > 0;
  }
  
  if (lecturaExitosa) {
    // Almacenar lectura temporalmente
    sensor.ultimaLectura = millis();
    Serial.printf("📊 Sensor %s: %.2f %s\\n", sensor.nombre.c_str(), valor, sensor.unidad.c_str());
  } else {
    Serial.printf("❌ Error leyendo sensor %s\\n", sensor.nombre.c_str());
  }
}

// Funciones específicas de lectura de sensores
float leerTemperatura(int pin) {
  // Implementar lectura de DHT22
  // Esta función se generará dinámicamente según la configuración
  return 25.0; // Valor de ejemplo
}

float leerHumedad(int pin) {
  // Implementar lectura de DHT22
  return 60.0; // Valor de ejemplo
}

float leerPeso(int pinDout, int pinSck, float factor, float offset) {
  // Implementar lectura de HX711
  return 1.5; // Valor de ejemplo
}

float leerPresion(int pinSda, int pinScl) {
  // Implementar lectura de BMP280
  return 1013.25; // Valor de ejemplo
}

void sendSensorData() {
  DynamicJsonDocument doc(1024);
  doc["timestamp"] = millis();
  doc["device_id"] = deviceConfig;
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["uptime"] = millis();
  doc["num_sensores"] = numSensores;
  
  // Agregar datos de todos los sensores habilitados
  for (int i = 0; i < numSensores; i++) {
    if (sensores[i].enabled) {
      String sensorKey = sensores[i].nombre + "_" + sensores[i].tipo.toLowerCase();
      doc[sensorKey] = leerSensor(i); // Obtener última lectura
    }
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  if (mqttClient.publish(mqttTopic.c_str(), jsonString.c_str())) {
    Serial.println("📤 Datos enviados: " + jsonString);
    
    // Actualizar estado del dispositivo
    actualizarEstadoDispositivo();
  } else {
    Serial.println("❌ Error enviando datos");
  }
}

void actualizarEstadoDispositivo() {
  // Enviar estado del dispositivo al servidor
  DynamicJsonDocument estadoDoc(512);
  estadoDoc["deviceId"] = deviceConfig;
  estadoDoc["connected"] = true;
  estadoDoc["lastSeen"] = millis();
  estadoDoc["wifiRSSI"] = WiFi.RSSI();
  estadoDoc["mqttConnected"] = mqttClient.connected();
  estadoDoc["numSensores"] = numSensores;
  estadoDoc["uptime"] = millis();
  
  String estadoString;
  serializeJson(estadoDoc, estadoString);
  
  // Enviar estado a endpoint específico
  String estadoTopic = "empresa/esp32/" + deviceConfig + "/status";
  mqttClient.publish(estadoTopic.c_str(), estadoString.c_str());
}

// ===========================================
// GESTIÓN DE CONFIGURACIÓN
// ===========================================

bool saveConfiguration() {
  File file = SPIFFS.open("/config.json", "w");
  if (!file) {
    Serial.println("❌ Error abriendo archivo de configuración");
    return false;
  }
  
  DynamicJsonDocument doc(1024);
  doc["wifi_ssid"] = wifiSSID;
  doc["wifi_password"] = wifiPassword;
  doc["mqtt_server"] = mqttServer;
  doc["mqtt_port"] = mqttPort;
  doc["mqtt_username"] = mqttUsername;
  doc["mqtt_password"] = mqttPassword;
  doc["mqtt_topic"] = mqttTopic;
  doc["configured"] = true;
  doc["timestamp"] = millis();
  
  if (serializeJson(doc, file) == 0) {
    Serial.println("❌ Error escribiendo configuración");
    file.close();
    return false;
  }
  
  file.close();
  Serial.println("✅ Configuración guardada");
  return true;
}

bool loadConfiguration() {
  File file = SPIFFS.open("/config.json", "r");
  if (!file) {
    Serial.println("📄 No hay archivo de configuración");
    return false;
  }
  
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, file);
  file.close();
  
  if (error) {
    Serial.println("❌ Error leyendo configuración");
    return false;
  }
  
  // Cargar configuración
  wifiSSID = doc["wifi_ssid"].as<String>();
  wifiPassword = doc["wifi_password"].as<String>();
  mqttServer = doc["mqtt_server"].as<String>();
  mqttPort = doc["mqtt_port"].as<int>();
  mqttUsername = doc["mqtt_username"].as<String>();
  mqttPassword = doc["mqtt_password"].as<String>();
  mqttTopic = doc["mqtt_topic"].as<String>();
  
  Serial.println("✅ Configuración cargada");
  Serial.println("📶 WiFi: " + wifiSSID);
  Serial.println("🌐 MQTT: " + mqttServer + ":" + String(mqttPort));
  
  return true;
}

void deleteConfiguration() {
  SPIFFS.remove("/config.json");
  Serial.println("🗑️ Configuración eliminada");
}
`;
  }

  /**
   * Genera el código específico para sensores
   */
  generateSensorCode(sensores: { tipo: string; nombre: string; pin: number }[]): string {
    let includes = '';
    let definitions = '';
    let setupCode = '';
    let loopCode = '';
    
    sensores.forEach((sensor, index) => {
      switch (sensor.tipo) {
        case 'TEMPERATURA':
        case 'HUMEDAD':
          if (!includes.includes('DHT.h')) {
            includes += '#include <DHT.h>\\n';
          }
          definitions += `DHT dht_${index}(${sensor.pin}, DHT22);\\n`;
          setupCode += `  dht_${index}.begin();\\n`;
          break;
          
        case 'PESO':
          if (!includes.includes('HX711.h')) {
            includes += '#include <HX711.h>\\n';
          }
          definitions += `HX711 scale_${index};\\n`;
          setupCode += `  scale_${index}.begin(${sensor.pin + 1}, ${sensor.pin + 2});\\n`;
          break;
      }
    });
    
    return `${includes}\n\n${definitions}\n\n${setupCode}\n\n${loopCode}`;
  }

  /**
   * Genera instrucciones de instalación
   */
  generateInstallationInstructions(): string {
    return `# 📋 Instrucciones de Instalación ESP32

## 🔧 Requisitos Previos

1. **Arduino IDE** instalado
2. **ESP32 Board Manager** configurado
3. **Librerías necesarias**:
   - WiFiManager (por tzapu)
   - PubSubClient (por Nick O'Leary)
   - ArduinoJson (por Benoit Blanchon)
   - DHT sensor library (por Adafruit) - solo si usas DHT22
   - HX711 (por Bogdan Necula) - solo si usas HX711

## 📥 Instalación de Librerías

### WiFiManager
1. Arduino IDE → Herramientas → Administrar Bibliotecas
2. Buscar "WiFiManager"
3. Instalar "WiFiManager by tzapu"

### PubSubClient
1. Buscar "PubSubClient"
2. Instalar "PubSubClient by Nick O'Leary"
3. **IMPORTANTE**: Editar PubSubClient.h y cambiar:
   \`\`\`cpp
   #define MQTT_MAX_PACKET_SIZE 128
   \`\`\`
   Por:
   \`\`\`cpp
   #define MQTT_MAX_PACKET_SIZE 512
   \`\`\`

### ArduinoJson
1. Buscar "ArduinoJson"
2. Instalar "ArduinoJson by Benoit Blanchon"

## 🚀 Subir Código Base

1. **Abrir Arduino IDE**
2. **Seleccionar placa**: Herramientas → Placa → ESP32 Arduino → ESP32 Dev Module
3. **Configurar puerto**: Herramientas → Puerto → [Tu puerto ESP32]
4. **Pegar el código base** en el sketch
5. **Verificar** el código (✓)
6. **Subir** el código (→)

## ✅ Verificación

Después de subir el código:
1. **Abrir Monitor Serial** (Herramientas → Monitor Serial)
2. **Configurar velocidad**: 115200 baud
3. **Reiniciar ESP32** (botón EN)
4. **Verificar mensajes**:
   - "ESP32 Auto-Configuration System"
   - "Portal captivo iniciado"
   - "Red WiFi creada: ESP32_Config"

## 🔧 Configuración Automática

Una vez subido el código base:
1. **Conectar ESP32** a la corriente
2. **Buscar red WiFi** "ESP32_Config"
3. **Conectarse** a esa red (contraseña: 12345678)
4. **Abrir navegador** y ir a cualquier página
5. **Seguir instrucciones** en el portal
6. **¡Listo!** El ESP32 se configurará automáticamente

## 🚨 Solución de Problemas

### Error de compilación
- Verificar que todas las librerías estén instaladas
- Verificar configuración de placa ESP32
- Verificar versión de Arduino IDE (1.8.19+)

### No aparece red WiFi
- Verificar alimentación del ESP32
- Verificar que el código se subió correctamente
- Revisar mensajes en Monitor Serial

### Error de conexión MQTT
- Verificar credenciales MQTT
- Verificar conectividad a internet
- Verificar configuración del broker

## 📞 Soporte

Si tienes problemas:
1. Revisar Monitor Serial para errores
2. Verificar conexiones físicas
3. Contactar soporte técnico
`;
  }
} 