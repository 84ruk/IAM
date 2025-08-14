export const ESP32_WEBSOCKET_TEMPLATE = `
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración WebSocket
const char* websocketServer = "tu-backend.fly.dev";
const int websocketPort = 443;
const char* websocketPath = "/iot";

// Configuración del dispositivo
const char* deviceId = "ESP32_001";
const int empresaId = 1; // Cambiar por tu empresa ID
const char* deviceType = "ESP32";

// Instancia WebSocket
WebSocketsClient webSocket;

// Variables para sensores
float temperatura = 0.0;
float humedad = 0.0;
unsigned long lastReading = 0;
const unsigned long readingInterval = 30000; // 30 segundos

void setup() {
  Serial.begin(115200);
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  Serial.println("Conectando a WiFi...");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Configurar WebSocket
  webSocket.beginSSL(websocketServer, websocketPort, websocketPath);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  // Configurar headers personalizados
  webSocket.setExtraHeaders(("x-device-id: " + String(deviceId) + "\\r\\nx-empresa-id: " + String(empresaId) + "\\r\\nx-device-type: " + String(deviceType)).c_str());
  
  Serial.println("WebSocket configurado");
}

void loop() {
  webSocket.loop();
  
  // Enviar lecturas periódicas
  if (millis() - lastReading > readingInterval) {
    enviarLectura();
    lastReading = millis();
  }
  
  // Mantener conexión activa con ping
  static unsigned long lastPing = 0;
  if (millis() - lastPing > 30000) { // Ping cada 30 segundos
    webSocket.sendTXT("ping");
    lastPing = millis();
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("Desconectado del WebSocket");
      break;
      
    case WStype_CONNECTED:
      Serial.println("Conectado al WebSocket IoT!");
      Serial.printf("URL: %s\\n", payload);
      
      // Enviar mensaje de conexión exitosa
      webSocket.sendTXT("ping");
      break;
      
    case WStype_TEXT:
      procesarMensaje((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.println("Error en WebSocket");
      break;
      
    case WStype_PING:
      Serial.println("Ping recibido");
      break;
      
    case WStype_PONG:
      Serial.println("Pong recibido");
      break;
  }
}

void procesarMensaje(String mensaje) {
  Serial.print("Mensaje recibido: ");
  Serial.println(mensaje);
  
  // Aquí puedes procesar mensajes del servidor
  // Por ejemplo, comandos para cambiar configuración
}

void enviarLectura() {
  // Simular lecturas de sensores (reemplazar con sensores reales)
  temperatura = random(20, 30) + random(0, 100) / 100.0;
  humedad = random(40, 80) + random(0, 100) / 100.0;
  
  // Crear JSON con la lectura
  StaticJsonDocument<200> doc;
  doc["tipo"] = "TEMPERATURA";
  doc["valor"] = temperatura;
  doc["unidad"] = "°C";
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Enviar lectura por WebSocket
  webSocket.sendTXT(jsonString);
  
  Serial.print("Lectura enviada: ");
  Serial.println(jsonString);
  
  // Enviar también humedad
  delay(100);
  
  doc.clear();
  doc["tipo"] = "HUMEDAD";
  doc["valor"] = humedad;
  doc["unidad"] = "%";
  doc["timestamp"] = millis();
  
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  
  Serial.print("Lectura enviada: ");
  Serial.println(jsonString);
}

// Función para enviar comando específico
void enviarComando(String comando, String valor) {
  StaticJsonDocument<200> doc;
  doc["comando"] = comando;
  doc["valor"] = valor;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  webSocket.sendTXT(jsonString);
  Serial.print("Comando enviado: ");
  Serial.println(jsonString);
}

// Función para obtener estado del dispositivo
void obtenerEstado() {
  webSocket.sendTXT("obtener-estado");
}

// Función para reconectar manualmente
void reconectar() {
  Serial.println("Reconectando...");
  webSocket.disconnect();
  delay(1000);
  webSocket.beginSSL(websocketServer, websocketPort, websocketPath);
}
`;

export const ESP32_WEBSOCKET_CONFIG = {
  librerias: [
    "WiFi.h",
    "WebSocketsClient.h", 
    "ArduinoJson.h"
  ],
  configuracion: {
    puerto: 443,
    protocolo: "wss://",
    namespace: "/iot",
    eventos: [
      "conexion-exitosa",
      "lectura-confirmada", 
      "dispositivo-conectado",
      "dispositivo-desconectado",
      "error"
    ],
    mensajes: [
      "enviar-lectura",
      "ping",
      "obtener-estado"
    ]
  },
  ventajas: [
    "Conexión persistente",
    "Latencia muy baja",
    "Comunicación bidireccional",
    "Sin límites de rate",
    "Actualizaciones en tiempo real"
  ]
};
