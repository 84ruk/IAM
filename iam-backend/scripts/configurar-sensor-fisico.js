const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN || 'tu-jwt-token-aqui';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function configurarSensorFisico() {
  console.log('🔧 Configurando Sensor Físico para el Sistema\n');

  try {
    // 1. Verificar autenticación
    console.log('1️⃣ Verificando autenticación...');
    try {
      const authTest = await api.get('/users/profile');
      console.log('✅ Autenticación correcta');
      console.log('👤 Usuario:', authTest.data.email);
      console.log('🏢 Empresa ID:', authTest.data.empresaId);
    } catch (error) {
      console.log('❌ Error de autenticación. Verifica tu JWT_TOKEN');
      console.log('💡 Ejecuta: export JWT_TOKEN="tu-token-aqui"');
      return;
    }

    // 2. Obtener ubicaciones disponibles
    console.log('\n2️⃣ Obteniendo ubicaciones disponibles...');
    let ubicaciones;
    try {
      const ubicacionesResponse = await api.get('/ubicaciones');
      ubicaciones = ubicacionesResponse.data;
      console.log('✅ Ubicaciones obtenidas:', ubicaciones.length, 'ubicaciones');
      
      if (ubicaciones.length === 0) {
        console.log('⚠️ No hay ubicaciones. Creando ubicación por defecto...');
        const nuevaUbicacion = await api.post('/ubicaciones', {
          nombre: 'Laboratorio IoT',
          descripcion: 'Ubicación para sensores de prototipo',
          direccion: 'Laboratorio de Desarrollo',
          ciudad: 'Ciudad',
          pais: 'País',
          codigoPostal: '00000'
        });
        ubicaciones = [nuevaUbicacion.data];
        console.log('✅ Ubicación creada:', nuevaUbicacion.data.nombre);
      }
    } catch (error) {
      console.log('❌ Error obteniendo ubicaciones:', error.response?.data?.message || error.message);
      return;
    }

    // 3. Mostrar opciones de configuración
    console.log('\n3️⃣ Configuración de Sensor Físico');
    console.log('📋 Tipos de sensores soportados:');
    console.log('   - TEMPERATURA (DHT22, LM35, etc.)');
    console.log('   - HUMEDAD (DHT22, DHT11, etc.)');
    console.log('   - PESO (HX711, Load Cell, etc.)');
    console.log('   - PRESION (BMP280, BME280, etc.)');

    console.log('\n🔧 Configuración MQTT necesaria:');
    console.log('   - Broker: h02f10fd.ala.us-east-1.emqxsl.com:8883');
    console.log('   - Protocolo: mqtts (TLS)');
    console.log('   - Usuario: [configurar en .env]');
    console.log('   - Contraseña: [configurar en .env]');

    // 4. Registrar sensor en el sistema
    console.log('\n4️⃣ Registrando sensor en el sistema...');
    
    const sensorData = {
      nombre: 'Sensor Prototipo',
      tipo: 'TEMPERATURA', // Cambiar según tu sensor
      ubicacionId: ubicaciones[0].id,
      descripcion: 'Sensor físico de prototipo conectado via MQTT'
    };

    try {
      const sensor = await api.post('/mqtt-sensor/sensores/registrar-simple', sensorData);
      console.log('✅ Sensor registrado exitosamente');
      console.log('🔧 Sensor ID:', sensor.data.sensor.id);
      console.log('📝 Nombre:', sensor.data.sensor.nombre);
      console.log('⚙️ Configuración aplicada:', sensor.data.configuracion_aplicada);

      // 5. Generar configuración para el hardware
      console.log('\n5️⃣ Configuración para tu Hardware (ESP32/Arduino)');
      console.log('\n📋 Código Arduino/ESP32:');
      console.log(`
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
const char* mqtt_client_id = "esp32_sensor_${sensor.data.sensor.id}";

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

  // Leer sensor (ejemplo con DHT22)
  float temperatura = leerTemperatura(); // Implementar según tu sensor
  float humedad = leerHumedad();         // Implementar según tu sensor

  // Crear JSON con datos
  StaticJsonDocument<200> doc;
  doc["temperatura"] = temperatura;
  doc["humedad"] = humedad;
  doc["timestamp"] = millis();
  doc["sensor_id"] = ${sensor.data.sensor.id};

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

float leerTemperatura() {
  // Implementar lectura de tu sensor de temperatura
  // Ejemplo: return dht.readTemperature();
  return 25.5; // Valor de ejemplo
}

float leerHumedad() {
  // Implementar lectura de tu sensor de humedad
  // Ejemplo: return dht.readHumidity();
  return 60.0; // Valor de ejemplo
}
      `);

      // 6. Mostrar configuración de librerías
      console.log('\n6️⃣ Librerías necesarias para Arduino/ESP32:');
      console.log(`
📦 Librerías a instalar en Arduino IDE:
   - WiFi (incluida)
   - PubSubClient (por Nick O'Leary)
   - ArduinoJson (por Benoit Blanchon)

🔧 Configuración adicional:
   - En PubSubClient.h, aumentar MAX_PACKET_SIZE a 512
   - Configurar certificados SSL si es necesario
      `);

      // 7. Mostrar comandos de prueba
      console.log('\n7️⃣ Comandos para probar la conexión:');
      console.log(`
🧪 Probar recepción de datos:
   node scripts/test-sensor-reception.js

📊 Ver datos en tiempo real:
   curl -X GET "http://localhost:3000/mqtt-sensor/sensores/sensor/${sensor.data.sensor.id}" \\
     -H "Authorization: Bearer ${JWT_TOKEN}"

📈 Ver analytics:
   curl -X GET "http://localhost:3000/mqtt-sensor/analytics" \\
     -H "Authorization: Bearer ${JWT_TOKEN}"
      `);

      console.log('\n🎉 ¡Configuración completada!');
      console.log('\n📝 PRÓXIMOS PASOS:');
      console.log('   1. Configurar WiFi en el código Arduino/ESP32');
      console.log('   2. Configurar credenciales MQTT');
      console.log('   3. Conectar tu sensor físico');
      console.log('   4. Subir el código al ESP32/Arduino');
      console.log('   5. Verificar recepción de datos en el dashboard');

    } catch (error) {
      console.log('❌ Error registrando sensor:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Error en la configuración:', error.message);
  }
}

// Función para mostrar información específica por tipo de sensor
function mostrarInfoSensor(tipo) {
  console.log(`\n📋 Información para sensor tipo: ${tipo}`);
  
  const infoSensores = {
    TEMPERATURA: {
      librerias: ['DHT sensor library', 'OneWire', 'DallasTemperature'],
      pines: 'DHT22: Pin 4, LM35: Pin A0',
      ejemplo: 'dht.readTemperature()',
      unidad: '°C'
    },
    HUMEDAD: {
      librerias: ['DHT sensor library'],
      pines: 'DHT22: Pin 4, DHT11: Pin 4',
      ejemplo: 'dht.readHumidity()',
      unidad: '%'
    },
    PESO: {
      librerias: ['HX711'],
      pines: 'HX711: DT=Pin 2, SCK=Pin 3',
      ejemplo: 'scale.get_units()',
      unidad: 'kg'
    },
    PRESION: {
      librerias: ['Adafruit BMP280 Library', 'Adafruit BME280 Library'],
      pines: 'BMP280: SDA=Pin 21, SCL=Pin 22 (I2C)',
      ejemplo: 'bmp.readPressure() / 100.0',
      unidad: 'hPa'
    }
  };

  const info = infoSensores[tipo];
  if (info) {
    console.log(`   📦 Librerías: ${info.librerias.join(', ')}`);
    console.log(`   🔌 Pines: ${info.pines}`);
    console.log(`   💻 Ejemplo: ${info.ejemplo}`);
    console.log(`   📏 Unidad: ${info.unidad}`);
  }
}

// Función para mostrar configuración MQTT
function mostrarConfiguracionMQTT() {
  console.log('\n🔧 CONFIGURACIÓN MQTT NECESARIA\n');

  console.log('1️⃣ Variables de entorno (.env):');
  console.log(`
MQTT_ENABLED=true
MQTT_HOST=h02f10fd.ala.us-east-1.emqxsl.com
MQTT_PORT=8883
MQTT_USE_TLS=true
MQTT_USERNAME=tu_usuario_mqtt
MQTT_PASSWORD=tu_password_mqtt
MQTT_APP_ID=v2c96220
MQTT_APP_SECRET=tu_app_secret
MQTT_API_ENDPOINT=https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5
  `);

  console.log('2️⃣ Tópicos MQTT soportados:');
  console.log(`
   - esp32/temperatura_humedad
   - empresa/{empresaId}/ubicacion/{ubicacionId}/sensor/{sensorId}/lectura
   - sensor/{sensorId}/data
   - iot/{deviceId}/sensor/{sensorId}/reading
  `);

  console.log('3️⃣ Formato de mensaje JSON:');
  console.log(`
{
  "temperatura": 25.5,
  "humedad": 60.0,
  "timestamp": 1234567890,
  "sensor_id": 1
}
  `);
}

// Ejecutar configuración
if (require.main === module) {
  if (process.argv.includes('--info')) {
    const tipo = process.argv[3] || 'TEMPERATURA';
    mostrarInfoSensor(tipo);
  } else if (process.argv.includes('--mqtt')) {
    mostrarConfiguracionMQTT();
  } else {
    configurarSensorFisico();
  }
}

module.exports = { configurarSensorFisico, mostrarInfoSensor, mostrarConfiguracionMQTT }; 