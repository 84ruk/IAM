/*
 * ESP32 Multi-Sensor Configuration for IAM
 * Generated: 2025-08-04T23:46:14.490Z
 * 
 * Sensors:
 * - DHT22 (Temperature/Humidity)
 * - MFRC522 (RFID)
 * - HX711 (Load Cell 50Kg)
 */

// WiFi Configuration
const char* ssid = "a";
const char* password = "jaj";

// MQTT Configuration
const char* mqtt_server = "h02f10fd.ala.us-east-1.emqxsl.com";
const int mqtt_port = 8883;
const char* mqtt_username = "esp32_1754351166938";
const char* mqtt_password = "pass_epc52b0rsd8";
const char* mqtt_topic = "empresa/sensor/esp32_multi/data";

// Pin Configuration
#define DHTPIN 4
#define DHTTYPE DHT22

#define RST_PIN 22
#define SS_PIN 21

#define LOADCELL_DOUT_PIN 16
#define LOADCELL_SCK_PIN 17

// Load Cell Configuration
float calibration_factor = -7050; // Adjust for your 50Kg load cell

// Include the complete ESP32 code here...
// (Copy the full code from esp32-complete-sensor.ino)
