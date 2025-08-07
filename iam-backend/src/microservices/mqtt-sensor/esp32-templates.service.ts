import { Injectable, Logger } from '@nestjs/common';
import { SensorTipo } from '@prisma/client';

export interface SensorConfig {
  id: number;
  nombre: string;
  tipo: SensorTipo;
  configuracion: any;
  mqttConfig: {
    username: string;
    password: string;
    topic: string;
  };
}

export interface ESP32Template {
  includes: string[];
  libraries: string[];
  pinDefinitions: string[];
  sensorConfigs: string[];
  setupCode: string[];
  loopCode: string[];
  helperFunctions: string[];
  mqttConfig: {
    server: string;
    port: number;
    username: string;
    password: string;
    topics: string[];
  };
}

@Injectable()
export class ESP32TemplatesService {
  private readonly logger = new Logger(ESP32TemplatesService.name);

  // Configuraciones de pines por defecto
  private readonly DEFAULT_PINS = {
    DHT22: { data: 4, vcc: 3.3 },
    MFRC522: { sda: 5, sck: 18, mosi: 23, miso: 19, rst: 22, vcc: 3.3 },
    HX711: { dout: 16, sck: 17, vcc: 3.3 }
  };

  // Librerías necesarias por sensor
  private readonly SENSOR_LIBRARIES = {
    DHT22: ['DHT.h', 'DHT_U.h'],
    MFRC522: ['SPI.h', 'MFRC522.h'],
    HX711: ['HX711.h']
  };

  generateESP32Code(sensors: SensorConfig[], wifiSSID: string, wifiPassword: string): ESP32Template {
    const template: ESP32Template = {
      includes: this.generateIncludes(sensors),
      libraries: this.generateLibraries(sensors),
      pinDefinitions: this.generatePinDefinitions(sensors),
      sensorConfigs: this.generateSensorConfigs(sensors),
      setupCode: this.generateSetupCode(sensors),
      loopCode: this.generateLoopCode(sensors),
      helperFunctions: this.generateHelperFunctions(sensors),
      mqttConfig: this.generateMqttConfig(sensors)
    };

    return template;
  }

  private generateIncludes(sensors: SensorConfig[]): string[] {
    const includes = [
      '#include <WiFi.h>',
      '#include <PubSubClient.h>',
      '#include <ArduinoJson.h>',
      '#include <Wire.h>'
    ];

    // Agregar includes específicos por sensor
    sensors.forEach(sensor => {
      switch (sensor.tipo) {
        case 'TEMPERATURA':
        case 'HUMEDAD':
          if (!includes.includes('#include <DHT.h>')) {
            includes.push('#include <DHT.h>');
            includes.push('#include <DHT_U.h>');
          }
          break;
        case 'PESO':
          if (!includes.includes('#include <HX711.h>')) {
            includes.push('#include <HX711.h>');
          }
          break;
      }
    });

    return includes;
  }

  private generateLibraries(sensors: SensorConfig[]): string[] {
    const libraries = [
      'WiFi',
      'PubSubClient',
      'ArduinoJson'
    ];

    // Agregar librerías específicas por sensor
    sensors.forEach(sensor => {
      switch (sensor.tipo) {
        case 'TEMPERATURA':
        case 'HUMEDAD':
          if (!libraries.includes('DHT')) {
            libraries.push('DHT');
          }
          break;
        case 'PESO':
          if (!libraries.includes('HX711')) {
            libraries.push('HX711');
          }
          break;
      }
    });

    return libraries;
  }

  private generatePinDefinitions(sensors: SensorConfig[]): string[] {
    const definitions = [
      '// Configuración WiFi',
      'const char* ssid = "' + this.generateWiFiSSID() + '";',
      'const char* password = "' + this.generateWiFiPassword() + '";',
      '',
      '// Configuración MQTT',
      'const char* mqtt_server = "h02f10fd.ala.us-east-1.emqxsl.com";',
      'const int mqtt_port = 8883;',
      '',
      '// Variables globales',
      'WiFiClient espClient;',
      'PubSubClient client(espClient);',
      'unsigned long lastMsg = 0;',
      'const long interval = 30000; // 30 segundos',
      ''
    ];

    // Definir pines por sensor
    sensors.forEach((sensor, index) => {
      switch (sensor.tipo) {
        case 'TEMPERATURA':
        case 'HUMEDAD':
          definitions.push(`// Sensor ${sensor.nombre} (DHT22)`);
          definitions.push(`#define DHTPIN_${index} ${this.DEFAULT_PINS.DHT22.data}`);
          definitions.push(`#define DHTTYPE DHT22`);
          definitions.push(`DHT dht_${index}(DHTPIN_${index}, DHTTYPE);`);
          break;
        case 'PESO':
          definitions.push(`// Sensor ${sensor.nombre} (HX711)`);
          definitions.push(`#define DOUT_PIN_${index} ${this.DEFAULT_PINS.HX711.dout}`);
          definitions.push(`#define SCK_PIN_${index} ${this.DEFAULT_PINS.HX711.sck}`);
          definitions.push(`HX711 scale_${index};`);
          break;
      }
      definitions.push('');
    });

    return definitions;
  }

  private generateSensorConfigs(sensors: SensorConfig[]): string[] {
    const configs = [
      '// Configuración de sensores',
      'struct SensorConfig {',
      '  String name;',
      '  String type;',
      '  String topic;',
      '  float calibration_factor;',
      '  float offset;',
      '  unsigned long lastRead;',
      '  unsigned long readInterval;',
      '};',
      '',
      `SensorConfig sensors[${sensors.length}] = {`
    ];

    sensors.forEach((sensor, index) => {
      let config = `  {"${sensor.nombre}", "${sensor.tipo}", "${sensor.mqttConfig.topic}", `;
      
      switch (sensor.tipo) {
        case 'PESO':
          config += '1.0, 0.0, 0, 60000'; // Factor de calibración, offset, último read, intervalo
          break;
        default:
          config += '1.0, 0.0, 0, 30000'; // Para temperatura y humedad
      }
      
      configs.push(config + '}');
    });

    configs.push('};');
    configs.push('');

    return configs;
  }

  private generateSetupCode(sensors: SensorConfig[]): string[] {
    const setup = [
      'void setup() {',
      '  Serial.begin(115200);',
      '  Serial.println("Iniciando ESP32 con sensores...");',
      '',
      '  // Inicializar sensores',
    ];

    // Inicializar cada sensor
    sensors.forEach((sensor, index) => {
      switch (sensor.tipo) {
        case 'TEMPERATURA':
        case 'HUMEDAD':
          setup.push(`  dht_${index}.begin();`);
          setup.push(`  Serial.println("DHT22 ${index} inicializado en pin ${this.DEFAULT_PINS.DHT22.data}");`);
          break;
        case 'PESO':
          setup.push(`  scale_${index}.begin(DOUT_PIN_${index}, SCK_PIN_${index});`);
          setup.push(`  scale_${index}.set_scale(sensors[${index}].calibration_factor);`);
          setup.push(`  scale_${index}.tare();`);
          setup.push(`  Serial.println("HX711 ${index} inicializado");`);
          break;
      }
    });

    setup.push('');
    setup.push('  // Conectar WiFi');
    setup.push('  setupWiFi();');
    setup.push('');
    setup.push('  // Configurar MQTT');
    setup.push('  client.setServer(mqtt_server, mqtt_port);');
    setup.push('  client.setCallback(callback);');
    setup.push('');
    setup.push('  Serial.println("Configuración completada");');
    setup.push('}');

    return setup;
  }

  private generateLoopCode(sensors: SensorConfig[]): string[] {
    const loop = [
      'void loop() {',
      '  // Reconectar MQTT si es necesario',
      '  if (!client.connected()) {',
      '    reconnect();',
      '  }',
      '  client.loop();',
      '',
      '  // Leer sensores cada intervalo',
      '  unsigned long now = millis();',
      '  if (now - lastMsg > interval) {',
      '    lastMsg = now;',
      '    readAndPublishSensors();',
      '  }',
      '}',
      ''
    ];

    return loop;
  }

  private generateHelperFunctions(sensors: SensorConfig[]): string[] {
    const functions = [
      '// Función para conectar WiFi',
      'void setupWiFi() {',
      '  Serial.print("Conectando a WiFi");',
      '  WiFi.begin(ssid, password);',
      '',
      '  while (WiFi.status() != WL_CONNECTED) {',
      '    delay(500);',
      '    Serial.print(".");',
      '  }',
      '',
      '  Serial.println("");',
      '  Serial.println("WiFi conectado");',
      '  Serial.println("Dirección IP: ");',
      '  Serial.println(WiFi.localIP());',
      '}',
      '',
      '// Función para reconectar MQTT',
      'void reconnect() {',
      '  while (!client.connected()) {',
      '    Serial.print("Intentando conexión MQTT...");',
      '    String clientId = "ESP32Client-";',
      '    clientId += String(random(0xffff), HEX);',
      '',
      '    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {',
      '      Serial.println("conectado");',
      '    } else {',
      '      Serial.print("falló, rc=");',
      '      Serial.print(client.state());',
      '      Serial.println(" reintentando en 5 segundos");',
      '      delay(5000);',
      '    }',
      '  }',
      '}',
      '',
      '// Callback para mensajes MQTT recibidos',
      'void callback(char* topic, byte* payload, unsigned int length) {',
      '  Serial.print("Mensaje recibido [");',
      '  Serial.print(topic);',
      '  Serial.print("] ");',
      '  for (int i = 0; i < length; i++) {',
      '    Serial.print((char)payload[i]);',
      '  }',
      '  Serial.println();',
      '}',
      '',
      '// Función para leer y publicar datos de sensores',
      'void readAndPublishSensors() {',
      '  DynamicJsonDocument doc(1024);',
      '  unsigned long now = millis();',
      '',
      '  doc["timestamp"] = now;',
      '  doc["device_id"] = "ESP32_Sensor_Array";',
      ''
    ];

    // Agregar código de lectura para cada sensor
    sensors.forEach((sensor, index) => {
      functions.push(`  // Leer sensor ${sensor.nombre}`);
      functions.push(`  if (now - sensors[${index}].lastRead > sensors[${index}].readInterval) {`);
      functions.push(`    sensors[${index}].lastRead = now;`);
      
      switch (sensor.tipo) {
        case 'TEMPERATURA':
          functions.push(`    float temperatura_${index} = dht_${index}.readTemperature();`);
          functions.push(`    if (!isnan(temperatura_${index})) {`);
          functions.push(`      doc["${sensor.nombre}_temperatura"] = temperatura_${index};`);
          functions.push(`      Serial.print("Temperatura ${index}: ");`);
          functions.push(`      Serial.println(temperatura_${index});`);
          functions.push(`    }`);
          break;
        case 'HUMEDAD':
          functions.push(`    float humedad_${index} = dht_${index}.readHumidity();`);
          functions.push(`    if (!isnan(humedad_${index})) {`);
          functions.push(`      doc["${sensor.nombre}_humedad"] = humedad_${index};`);
          functions.push(`      Serial.print("Humedad ${index}: ");`);
          functions.push(`      Serial.println(humedad_${index});`);
          functions.push(`    }`);
          break;
        case 'PESO':
          functions.push(`    if (scale_${index}.is_ready()) {`);
          functions.push(`      float peso_${index} = scale_${index}.get_units(5);`);
          functions.push(`      if (peso_${index} > 0) {`);
          functions.push(`        doc["${sensor.nombre}_peso"] = peso_${index};`);
          functions.push(`        Serial.print("Peso ${index}: ");`);
          functions.push(`        Serial.println(peso_${index});`);
          functions.push(`      }`);
          functions.push(`    }`);
          break;
      }
      functions.push(`  }`);
      functions.push('');
    });

    functions.push('  // Publicar datos si hay información');
    functions.push('  if (doc.size() > 2) { // Más que timestamp y device_id');
    functions.push('    String jsonString;');
    functions.push('    serializeJson(doc, jsonString);');
    functions.push('    Serial.println("Publicando: " + jsonString);');
    functions.push('    client.publish("empresa/sensores/esp32/data", jsonString.c_str());');
    functions.push('  }');
    functions.push('}');

    return functions;
  }

  private generateMqttConfig(sensors: SensorConfig[]): any {
    return {
      server: 'h02f10fd.ala.us-east-1.emqxsl.com',
      port: 8883,
      username: sensors[0]?.mqttConfig.username || 'esp32_user',
      password: sensors[0]?.mqttConfig.password || 'esp32_pass',
      topics: sensors.map(s => s.mqttConfig.topic)
    };
  }

  private generateWiFiSSID(): string {
    return 'TU_WIFI_SSID';
  }

  private generateWiFiPassword(): string {
    return 'TU_WIFI_PASSWORD';
  }

  // Generar código completo como string
  generateCompleteCode(sensors: SensorConfig[]): string {
    const template = this.generateESP32Code(sensors, '', '');
    
    let code = '';
    
    // Includes
    code += template.includes.join('\n') + '\n\n';
    
    // Definiciones de pines
    code += template.pinDefinitions.join('\n') + '\n';
    
    // Configuraciones de sensores
    code += template.sensorConfigs.join('\n') + '\n';
    
    // Variables MQTT
    code += `const char* mqtt_username = "${template.mqttConfig.username}";\n`;
    code += `const char* mqtt_password = "${template.mqttConfig.password}";\n\n`;
    
    // Funciones helper
    code += template.helperFunctions.join('\n') + '\n';
    
    // Setup
    code += template.setupCode.join('\n') + '\n';
    
    // Loop
    code += template.loopCode.join('\n') + '\n';
    
    return code;
  }

  // Generar archivo de configuración JSON
  generateConfigFile(sensors: SensorConfig[]): string {
    const config = {
      device: {
        name: 'ESP32_Sensor_Array',
        version: '1.0.0',
        description: 'ESP32 con múltiples sensores'
      },
      wifi: {
        ssid: 'TU_WIFI_SSID',
        password: 'TU_WIFI_PASSWORD'
      },
      mqtt: {
        server: 'h02f10fd.ala.us-east-1.emqxsl.com',
        port: 8883,
        username: sensors[0]?.mqttConfig.username || 'esp32_user',
        password: sensors[0]?.mqttConfig.password || 'esp32_pass',
        topic: 'empresa/sensores/esp32/data'
      },
      sensors: sensors.map(sensor => ({
        id: sensor.id,
        name: sensor.nombre,
        type: sensor.tipo,
        config: sensor.configuracion,
        mqtt_topic: sensor.mqttConfig.topic
      })),
      pins: this.generatePinConfig(sensors),
      intervals: {
        read_interval: 30000,
        publish_interval: 30000
      }
    };

    return JSON.stringify(config, null, 2);
  }

  private generatePinConfig(sensors: SensorConfig[]): any {
    const pins = {};
    
    sensors.forEach((sensor, index) => {
      switch (sensor.tipo) {
        case 'TEMPERATURA':
        case 'HUMEDAD':
          pins[`dht_${index}`] = {
            data: this.DEFAULT_PINS.DHT22.data,
            vcc: this.DEFAULT_PINS.DHT22.vcc
          };
          break;
        case 'PESO':
          pins[`hx711_${index}`] = {
            dout: this.DEFAULT_PINS.HX711.dout,
            sck: this.DEFAULT_PINS.HX711.sck,
            vcc: this.DEFAULT_PINS.HX711.vcc
          };
          break;
      }
    });

    return pins;
  }
} 