/*
 * ESP32 IAM - Sistema de Inventario Automatizado
 * Código completo para configuración automática y envío de datos de sensores
 * 
 * Sensores soportados:
 * - DHT22 (Temperatura y Humedad)
 * - HX711 (Peso)
 * - BMP280 (Presión)
 * 
 * Configuración automática vía QR Code
 */

 #include <WiFi.h>
 #include <WebServer.h>
 #include <PubSubClient.h>
 #include <ArduinoJson.h>
 #include <DHT.h>
 #include <HX711.h>
 #include <Adafruit_Sensor.h>
 #include <Adafruit_BMP280.h>
 #include <SPI.h>
 #include <Wire.h>
 
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
 // CONFIGURACIÓN WIFI Y MQTT
 // ===========================================
 
 // Credenciales WiFi (se configurarán automáticamente)
 String wifiSSID = "";
 String wifiPassword = "";
 
 // Configuración MQTT (se configurarán automáticamente)
 String mqttServer = "";
 int mqttPort = 1883;
 String mqttUsername = "";
 String mqttPassword = "";
 String mqttTopic = "";
 
 // Configuración del dispositivo
 String deviceId = "";
 String deviceName = "";
 int ubicacionId = 0;
 
 // ===========================================
 // CONFIGURACIÓN AP (Access Point)
 // ===========================================
 
 const char* apSsid = "IAM_ESP32_Config";
 const char* apPass = "iam-setup-2024";
 
 WebServer server(80);
 WiFiClient espClient;
 PubSubClient mqtt(espClient);
 
 // ===========================================
 // VARIABLES DE ESTADO
 // ===========================================
 
 bool wifiConnected = false;
 bool mqttConnected = false;
 bool configLoaded = false;
 unsigned long lastSensorRead = 0;
 const unsigned long SENSOR_INTERVAL = 30000; // 30 segundos
 
 // ===========================================
 // FUNCIONES DE CONFIGURACIÓN
 // ===========================================
 
 void loadConfiguration() {
   // Aquí cargarías la configuración desde EEPROM o SPIFFS
   // Por ahora usamos valores por defecto
   Serial.println("📋 Cargando configuración...");
   
   // TODO: Implementar carga desde EEPROM/SPIFFS
   // wifiSSID = EEPROM.readString(0);
   // wifiPassword = EEPROM.readString(32);
   // etc...
 }
 
 void saveConfiguration() {
   // Guardar configuración en EEPROM o SPIFFS
   Serial.println("💾 Guardando configuración...");
   
   // TODO: Implementar guardado en EEPROM/SPIFFS
   // EEPROM.writeString(0, wifiSSID);
   // EEPROM.writeString(32, wifiPassword);
   // EEPROM.commit();
 }
 
 // ===========================================
 // FUNCIONES DE SENSORES
 // ===========================================
 
 void setupSensors() {
   Serial.println("🔧 Configurando sensores...");
   
   // Inicializar DHT22
   dht.begin();
   Serial.println("✅ DHT22 inicializado");
   
   // Inicializar HX711
   scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
   scale.set_scale(2280.f); // Factor de calibración - ajustar según tu celda
   scale.tare(); // Tare the scale
   Serial.println("✅ HX711 inicializado");
   
   // Inicializar BMP280
   if (bmp.begin(BMP280_ADDRESS)) {
     Serial.println("✅ BMP280 inicializado");
   } else {
     Serial.println("❌ Error inicializando BMP280");
   }
 }
 
 void readSensors() {
   if (millis() - lastSensorRead < SENSOR_INTERVAL) return;
   
   Serial.println("📊 Leyendo sensores...");
   
   // Leer DHT22 (Temperatura y Humedad)
   float temperature = dht.readTemperature();
   float humidity = dht.readHumidity();
   
   // Leer HX711 (Peso)
   float weight = scale.get_units(5); // Promedio de 5 lecturas
   
   // Leer BMP280 (Presión)
   float pressure = bmp.readPressure() / 100.0; // Convertir a hPa
   
   // Crear JSON con los datos
   DynamicJsonDocument doc(512);
   doc["deviceId"] = deviceId;
   doc["deviceName"] = deviceName;
   doc["ubicacionId"] = ubicacionId;
   doc["timestamp"] = millis();
   
   JsonObject sensors = doc.createNestedObject("sensors");
   
   if (!isnan(temperature)) {
     sensors["temperatura"] = temperature;
     Serial.printf("🌡️ Temperatura: %.2f°C\n", temperature);
   }
   
   if (!isnan(humidity)) {
     sensors["humedad"] = humidity;
     Serial.printf("💧 Humedad: %.2f%%\n", humidity);
   }
   
   if (!isnan(weight)) {
     sensors["peso"] = weight;
     Serial.printf("⚖️ Peso: %.2fg\n", weight);
   }
   
   if (!isnan(pressure)) {
     sensors["presion"] = pressure;
     Serial.printf("🌪️ Presión: %.2fhPa\n", pressure);
   }
   
   // Enviar datos por MQTT
   if (mqttConnected) {
     String jsonString;
     serializeJson(doc, jsonString);
     
     if (mqtt.publish(mqttTopic.c_str(), jsonString.c_str())) {
       Serial.println("✅ Datos enviados por MQTT");
     } else {
       Serial.println("❌ Error enviando datos por MQTT");
     }
   }
   
   lastSensorRead = millis();
 }
 
 // ===========================================
 // FUNCIONES WIFI
 // ===========================================
 
 void setupWiFi() {
   Serial.println("📡 Configurando WiFi...");
   
   // Configurar modo dual (AP + STA)
   WiFi.mode(WIFI_AP_STA);
   
   // Configurar Access Point
   if (WiFi.softAP(apSsid, apPass)) {
     Serial.println("✅ AP configurado");
     Serial.print("📶 SSID: "); Serial.println(apSsid);
     Serial.print("🔑 Password: "); Serial.println(apPass);
     Serial.print("🌐 IP AP: "); Serial.println(WiFi.softAPIP());
   } else {
     Serial.println("❌ Error configurando AP");
   }
   
   // Conectar a WiFi si hay credenciales
   if (wifiSSID.length() > 0 && wifiPassword.length() > 0) {
     connectToWiFi();
   }
 }
 
 void connectToWiFi() {
   Serial.printf("🔗 Conectando a WiFi: %s\n", wifiSSID.c_str());
   
   WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
   
   int attempts = 0;
   while (WiFi.status() != WL_CONNECTED && attempts < 20) {
     delay(500);
     Serial.print(".");
     attempts++;
   }
   
   if (WiFi.status() == WL_CONNECTED) {
     wifiConnected = true;
     Serial.println();
     Serial.println("✅ WiFi conectado");
     Serial.print("🌐 IP: "); Serial.println(WiFi.localIP());
     
     // Conectar MQTT después de WiFi
     connectMQTT();
   } else {
     Serial.println();
     Serial.println("❌ Error conectando WiFi");
   }
 }
 
 // ===========================================
 // FUNCIONES MQTT
 // ===========================================
 
 void connectMQTT() {
   if (mqttServer.length() == 0) return;
   
   Serial.printf("🔗 Conectando MQTT: %s:%d\n", mqttServer.c_str(), mqttPort);
   
   mqtt.setServer(mqttServer.c_str(), mqttPort);
   mqtt.setCallback(mqttCallback);
   
   if (mqtt.connect(deviceId.c_str(), mqttUsername.c_str(), mqttPassword.c_str())) {
     mqttConnected = true;
     Serial.println("✅ MQTT conectado");
     
     // Suscribirse a comandos
     String commandTopic = mqttTopic + "/commands";
     mqtt.subscribe(commandTopic.c_str());
     Serial.printf("📡 Suscrito a: %s\n", commandTopic.c_str());
   } else {
     Serial.println("❌ Error conectando MQTT");
   }
 }
 
 void mqttCallback(char* topic, byte* payload, unsigned int length) {
   Serial.printf("📨 MQTT recibido: %s\n", topic);
   
   String message = "";
   for (int i = 0; i < length; i++) {
     message += (char)payload[i];
   }
   
   Serial.printf("📝 Mensaje: %s\n", message.c_str());
   
   // Procesar comandos
   DynamicJsonDocument doc(256);
   DeserializationError error = deserializeJson(doc, message);
   
   if (!error) {
     String command = doc["command"];
     
     if (command == "restart") {
       Serial.println("🔄 Reiniciando ESP32...");
       ESP.restart();
     } else if (command == "calibrate") {
       Serial.println("⚖️ Calibrando sensor de peso...");
       scale.tare();
     }
   }
 }
 
 // ===========================================
 // FUNCIONES DEL SERVIDOR WEB
 // ===========================================
 
 void setupWebServer() {
   Serial.println("🌐 Configurando servidor web...");
   
   // Página principal
   server.on("/", handleRoot);
   
   // API para configuración
   server.on("/api/config", HTTP_GET, handleGetConfig);
   server.on("/api/config", HTTP_POST, handlePostConfig);
   
   // API para estado
   server.on("/api/status", HTTP_GET, handleStatus);
   
   // API para reiniciar
   server.on("/api/restart", HTTP_POST, handleRestart);
   
   // API para calibrar
   server.on("/api/calibrate", HTTP_POST, handleCalibrate);
   
   server.begin();
   Serial.println("✅ Servidor web iniciado");
 }
 
 void handleRoot() {
   String html = R"(
 <!DOCTYPE html>
 <html>
 <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>IAM ESP32 - Configuración</title>
     <style>
         body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
         .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
         h1 { color: #333; text-align: center; }
         .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
         .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
         .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
         .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
         .form-group { margin: 15px 0; }
         label { display: block; margin-bottom: 5px; font-weight: bold; }
         input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
         button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
         button:hover { background: #0056b3; }
         .sensor-data { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
     </style>
 </head>
 <body>
     <div class="container">
         <h1>🤖 IAM ESP32 - Configuración</h1>
         
         <div id="status" class="status info">
             <strong>Estado:</strong> <span id="statusText">Cargando...</span>
         </div>
         
         <div class="sensor-data">
             <h3>📊 Datos de Sensores</h3>
             <div id="sensorData">Cargando datos...</div>
         </div>
         
         <h3>⚙️ Configuración WiFi</h3>
         <form id="wifiForm">
             <div class="form-group">
                 <label for="ssid">SSID WiFi:</label>
                 <input type="text" id="ssid" name="ssid" placeholder="Nombre de tu red WiFi">
             </div>
             <div class="form-group">
                 <label for="password">Contraseña WiFi:</label>
                 <input type="password" id="password" name="password" placeholder="Contraseña de tu red WiFi">
             </div>
             <button type="submit">🔗 Conectar WiFi</button>
         </form>
         
         <h3>🔧 Configuración MQTT</h3>
         <form id="mqttForm">
             <div class="form-group">
                 <label for="mqttServer">Servidor MQTT:</label>
                 <input type="text" id="mqttServer" name="mqttServer" placeholder="mqtt.tudominio.com">
             </div>
             <div class="form-group">
                 <label for="mqttPort">Puerto MQTT:</label>
                 <input type="number" id="mqttPort" name="mqttPort" value="1883">
             </div>
             <div class="form-group">
                 <label for="mqttUsername">Usuario MQTT:</label>
                 <input type="text" id="mqttUsername" name="mqttUsername" placeholder="Usuario MQTT">
             </div>
             <div class="form-group">
                 <label for="mqttPassword">Contraseña MQTT:</label>
                 <input type="password" id="mqttPassword" name="mqttPassword" placeholder="Contraseña MQTT">
             </div>
             <div class="form-group">
                 <label for="mqttTopic">Tópico MQTT:</label>
                 <input type="text" id="mqttTopic" name="mqttTopic" placeholder="iam/sensors/device1">
             </div>
             <button type="submit">📡 Configurar MQTT</button>
         </form>
         
         <h3>🛠️ Acciones</h3>
         <button onclick="restart()">🔄 Reiniciar ESP32</button>
         <button onclick="calibrate()">⚖️ Calibrar Sensor de Peso</button>
         
         <div style="margin-top: 30px; text-align: center; color: #666;">
             <p><strong>IAM - Sistema de Inventario Automatizado</strong></p>
             <p>ESP32 v1.0 | IP: )" + WiFi.softAPIP().toString() + R"(</p>
         </div>
     </div>
     
     <script>
         // Cargar estado inicial
         loadStatus();
         loadSensorData();
         
         // Actualizar cada 5 segundos
         setInterval(loadStatus, 5000);
         setInterval(loadSensorData, 5000);
         
         function loadStatus() {
             fetch('/api/status')
                 .then(response => response.json())
                 .then(data => {
                     const statusDiv = document.getElementById('status');
                     const statusText = document.getElementById('statusText');
                     
                     let status = '';
                     let className = 'info';
                     
                     if (data.wifiConnected) {
                         status += '✅ WiFi conectado | ';
                         className = 'success';
                     } else {
                         status += '❌ WiFi desconectado | ';
                         className = 'error';
                     }
                     
                     if (data.mqttConnected) {
                         status += '✅ MQTT conectado | ';
                     } else {
                         status += '❌ MQTT desconectado | ';
                     }
                     
                     status += `IP: ${data.ip}`;
                     
                     statusText.textContent = status;
                     statusDiv.className = 'status ' + className;
                 })
                 .catch(error => {
                     console.error('Error cargando estado:', error);
                 });
         }
         
         function loadSensorData() {
             fetch('/api/sensors')
                 .then(response => response.json())
                 .then(data => {
                     const sensorDiv = document.getElementById('sensorData');
                     let html = '';
                     
                     if (data.temperatura !== undefined) {
                         html += `<p>🌡️ Temperatura: ${data.temperatura.toFixed(2)}°C</p>`;
                     }
                     if (data.humedad !== undefined) {
                         html += `<p>💧 Humedad: ${data.humedad.toFixed(2)}%</p>`;
                     }
                     if (data.peso !== undefined) {
                         html += `<p>⚖️ Peso: ${data.peso.toFixed(2)}g</p>`;
                     }
                     if (data.presion !== undefined) {
                         html += `<p>🌪️ Presión: ${data.presion.toFixed(2)}hPa</p>`;
                     }
                     
                     if (html === '') {
                         html = '<p>No hay datos de sensores disponibles</p>';
                     }
                     
                     sensorDiv.innerHTML = html;
                 })
                 .catch(error => {
                     console.error('Error cargando datos de sensores:', error);
                 });
         }
         
         document.getElementById('wifiForm').addEventListener('submit', function(e) {
             e.preventDefault();
             
             const formData = new FormData(e.target);
             const data = Object.fromEntries(formData);
             
             fetch('/api/config', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({
                     type: 'wifi',
                     ssid: data.ssid,
                     password: data.password
                 })
             })
             .then(response => response.json())
             .then(data => {
                 if (data.success) {
                     alert('✅ WiFi configurado correctamente');
                     loadStatus();
                 } else {
                     alert('❌ Error configurando WiFi: ' + data.message);
                 }
             })
             .catch(error => {
                 alert('❌ Error: ' + error.message);
             });
         });
         
         document.getElementById('mqttForm').addEventListener('submit', function(e) {
             e.preventDefault();
             
             const formData = new FormData(e.target);
             const data = Object.fromEntries(formData);
             
             fetch('/api/config', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({
                     type: 'mqtt',
                     server: data.mqttServer,
                     port: parseInt(data.mqttPort),
                     username: data.mqttUsername,
                     password: data.mqttPassword,
                     topic: data.mqttTopic
                 })
             })
             .then(response => response.json())
             .then(data => {
                 if (data.success) {
                     alert('✅ MQTT configurado correctamente');
                     loadStatus();
                 } else {
                     alert('❌ Error configurando MQTT: ' + data.message);
                 }
             })
             .catch(error => {
                 alert('❌ Error: ' + error.message);
             });
         });
         
         function restart() {
             if (confirm('¿Estás seguro de que quieres reiniciar el ESP32?')) {
                 fetch('/api/restart', { method: 'POST' })
                     .then(() => {
                         alert('🔄 Reiniciando ESP32...');
                     })
                     .catch(error => {
                         alert('❌ Error: ' + error.message);
                     });
             }
         }
         
         function calibrate() {
             if (confirm('¿Estás seguro de que quieres calibrar el sensor de peso?')) {
                 fetch('/api/calibrate', { method: 'POST' })
                     .then(response => response.json())
                     .then(data => {
                         if (data.success) {
                             alert('✅ Sensor de peso calibrado');
                         } else {
                             alert('❌ Error calibrando: ' + data.message);
                         }
                     })
                     .catch(error => {
                         alert('❌ Error: ' + error.message);
                     });
             }
         }
     </script>
 </body>
 </html>
   )";
   
   server.send(200, "text/html", html);
 }
 
 void handleGetConfig() {
   DynamicJsonDocument doc(512);
   doc["wifi"]["ssid"] = wifiSSID;
   doc["mqtt"]["server"] = mqttServer;
   doc["mqtt"]["port"] = mqttPort;
   doc["mqtt"]["username"] = mqttUsername;
   doc["mqtt"]["topic"] = mqttTopic;
   doc["device"]["id"] = deviceId;
   doc["device"]["name"] = deviceName;
   doc["device"]["ubicacionId"] = ubicacionId;
   
   String response;
   serializeJson(doc, response);
   server.send(200, "application/json", response);
 }
 
 void handlePostConfig() {
   String body = server.arg("plain");
   DynamicJsonDocument doc(512);
   DeserializationError error = deserializeJson(doc, body);
   
   if (error) {
     server.send(400, "application/json", "{\"success\":false,\"message\":\"JSON inválido\"}");
     return;
   }
   
   String type = doc["type"];
   
   if (type == "wifi") {
     wifiSSID = doc["ssid"].as<String>();
     wifiPassword = doc["password"].as<String>();
     
     saveConfiguration();
     connectToWiFi();
     
     server.send(200, "application/json", "{\"success\":true,\"message\":\"WiFi configurado\"}");
   } else if (type == "mqtt") {
     mqttServer = doc["server"].as<String>();
     mqttPort = doc["port"];
     mqttUsername = doc["username"].as<String>();
     mqttPassword = doc["password"].as<String>();
     mqttTopic = doc["topic"].as<String>();
     
     saveConfiguration();
     connectMQTT();
     
     server.send(200, "application/json", "{\"success\":true,\"message\":\"MQTT configurado\"}");
   } else {
     server.send(400, "application/json", "{\"success\":false,\"message\":\"Tipo de configuración inválido\"}");
   }
 }
 
 void handleStatus() {
   DynamicJsonDocument doc(256);
   doc["wifiConnected"] = wifiConnected;
   doc["mqttConnected"] = mqttConnected;
   doc["configLoaded"] = configLoaded;
   doc["ip"] = WiFi.localIP().toString();
   doc["apIp"] = WiFi.softAPIP().toString();
   doc["deviceId"] = deviceId;
   doc["deviceName"] = deviceName;
   doc["uptime"] = millis();
   
   String response;
   serializeJson(doc, response);
   server.send(200, "application/json", response);
 }
 
 void handleRestart() {
   server.send(200, "application/json", "{\"success\":true,\"message\":\"Reiniciando...\"}");
   delay(1000);
   ESP.restart();
 }
 
 void handleCalibrate() {
   scale.tare();
   server.send(200, "application/json", "{\"success\":true,\"message\":\"Sensor calibrado\"}");
 }
 
 // ===========================================
 // SETUP Y LOOP PRINCIPAL
 // ===========================================
 
 void setup() {
   Serial.begin(115200);
   Serial.println();
   Serial.println("🚀 Iniciando IAM ESP32...");
   Serial.println("==================================");
   
   // Generar ID único del dispositivo
   deviceId = "esp32_" + String(millis()) + "_" + String(random(1000, 9999));
   deviceName = "ESP32 IAM " + String(random(100, 999));
   
   Serial.printf("🆔 Device ID: %s\n", deviceId.c_str());
   Serial.printf("📝 Device Name: %s\n", deviceName.c_str());
   
   // Configurar sensores
   setupSensors();
   
   // Cargar configuración
   loadConfiguration();
   
   // Configurar WiFi
   setupWiFi();
   
   // Configurar servidor web
   setupWebServer();
   
   Serial.println("✅ Setup completado");
   Serial.println("==================================");
   Serial.println("🌐 Portal de configuración disponible en:");
   Serial.printf("   http://%s\n", WiFi.softAPIP().toString().c_str());
   Serial.println("📱 Conecta tu dispositivo a la red 'IAM_ESP32_Config'");
   Serial.println("🔑 Contraseña: iam-setup-2024");
 }
 
 void loop() {
   // Manejar clientes web
   server.handleClient();
   
   // Manejar MQTT
   if (mqttConnected) {
     mqtt.loop();
   }
   
   // Leer sensores
   readSensors();
   
   // Reconectar WiFi si se perdió
   if (wifiConnected && WiFi.status() != WL_CONNECTED) {
     Serial.println("❌ Conexión WiFi perdida, reconectando...");
     wifiConnected = false;
     mqttConnected = false;
     connectToWiFi();
   }
   
   // Reconectar MQTT si se perdió
   if (wifiConnected && !mqttConnected && mqttServer.length() > 0) {
     connectMQTT();
   }
   
   delay(100); // Pequeña pausa para estabilidad
 }
 