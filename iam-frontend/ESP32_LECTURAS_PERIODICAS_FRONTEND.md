# 🚀 ESP32 Lecturas Periódicas - Configuración desde Frontend

## 📋 Resumen

Este documento describe el nuevo sistema de configuración ESP32 que permite a los usuarios generar tanto la configuración JSON como el código Arduino personalizado directamente desde el frontend, eliminando la necesidad de scripts manuales.

## 🎯 Características Principales

### ✅ **Configuración Completa desde Frontend**
- Wizard interactivo de 5 pasos
- Configuración de WiFi automática
- Selección de sensores con umbrales personalizables
- Generación automática de token de API

### ✅ **Generación de Código Personalizado**
- Código Arduino (.ino) generado automáticamente
- Configuración JSON para tarjeta SD
- Librerías incluidas según sensores seleccionados
- Pines configurados automáticamente

### ✅ **Descarga y Copia Fácil**
- Descarga directa de archivos
- Copia al portapapeles
- Vista previa de código y configuración
- Instrucciones paso a paso

## 🔧 **Flujo de Trabajo**

### **1. Acceso al Sistema**
```
Dashboard → Sensores → "ESP32 Lecturas Periódicas"
```

### **2. Wizard de Configuración (5 Pasos)**

#### **Paso 1: Información del Dispositivo**
- Nombre del dispositivo ESP32
- Selección de ubicación
- Intervalo de lectura configurable

#### **Paso 2: Configuración WiFi**
- SSID de la red WiFi
- Contraseña WiFi (con opción de mostrar/ocultar)
- Validación automática

#### **Paso 3: Configuración de Sensores**
- Selección de sensores disponibles:
  - 🌡️ **Temperatura (DHT22)** - Pin 4
  - 💧 **Humedad (DHT22)** - Pin 4
  - ⚖️ **Peso (HX711)** - Pines 16, 17
  - 🌪️ **Presión (BMP280)** - Pines 21, 22
- Configuración de umbrales por sensor
- Intervalos de lectura personalizables

#### **Paso 4: Resumen de Configuración**
- Revisión de todos los parámetros
- Validación antes de generar

#### **Paso 5: Descarga de Archivos**
- Descarga de configuración JSON
- Descarga de código Arduino (.ino)
- Instrucciones de instalación

## 📁 **Archivos Generados**

### **1. Configuración JSON**
```json
{
  "deviceId": "esp32_1234567890_abc123",
  "deviceName": "ESP32 Almacén Principal",
  "ubicacionId": 1,
  "empresaId": 1,
  "wifi": {
    "ssid": "MiRedWiFi",
    "password": "miContraseña"
  },
  "api": {
    "baseUrl": "http://localhost:3000",
    "token": "abc123def456...",
    "endpoint": "/sensores/lecturas-multiples"
  },
  "sensores": [
    {
      "tipo": "TEMPERATURA",
      "nombre": "Temperatura (DHT22)",
      "pin": 4,
      "pin2": 0,
      "enabled": true,
      "umbralMin": 15,
      "umbralMax": 35,
      "unidad": "°C",
      "intervalo": 30000
    }
  ],
  "intervalo": 30000,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### **2. Código Arduino (.ino)**
```cpp
/*
 * ESP32 IAM - Sistema de Lecturas Periódicas
 * Código generado automáticamente para: ESP32 Almacén Principal
 * Dispositivo ID: esp32_1234567890_abc123
 * Fecha de generación: 2024-01-15T10:30:00Z
 * 
 * Sensores configurados:
 * - Temperatura (DHT22) (TEMPERATURA)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPIFFS.h>
#include <DHT.h>
#include <SPI.h>
#include <Wire.h>

// ===========================================
// CONFIGURACIÓN DEL DISPOSITIVO
// ===========================================

// Información del dispositivo
#define DEVICE_ID "esp32_1234567890_abc123"
#define DEVICE_NAME "ESP32 Almacén Principal"
#define UBICACION_ID 1
#define EMPRESA_ID 1

// Configuración WiFi
const char* WIFI_SSID = "MiRedWiFi";
const char* WIFI_PASSWORD = "miContraseña";

// Configuración API
const char* API_BASE_URL = "http://localhost:3000";
const char* API_TOKEN = "abc123def456...";
const char* API_ENDPOINT = "/sensores/lecturas-multiples";

// Intervalo de lectura
const unsigned long SENSOR_INTERVAL = 30000; // 30 segundos

// ... resto del código generado automáticamente
```

## 🚀 **Instalación y Uso**

### **Paso 1: Configurar desde Frontend**
1. Ve a **Dashboard → Sensores**
2. Haz clic en **"ESP32 Lecturas Periódicas"**
3. Completa el wizard de 5 pasos
4. Descarga los archivos generados

### **Paso 2: Preparar el ESP32**
1. **Código Arduino:**
   - Abre Arduino IDE
   - Pega el código descargado
   - Instala las librerías necesarias:
     - `WiFi`
     - `HTTPClient`
     - `ArduinoJson`
     - `SPIFFS`
     - `DHT sensor library`
     - `HX711` (si usas sensor de peso)
     - `Adafruit BMP280 Library` (si usas sensor de presión)

2. **Configuración JSON:**
   - Copia el archivo JSON a la tarjeta SD del ESP32
   - Nombra el archivo como `config.json`
   - Coloca la tarjeta SD en el ESP32

### **Paso 3: Subir Código**
1. Conecta el ESP32 a tu computadora
2. Selecciona la placa correcta en Arduino IDE
3. Sube el código al ESP32
4. Abre el Monitor Serial para ver los logs

### **Paso 4: Verificar Funcionamiento**
1. El ESP32 se conectará automáticamente al WiFi
2. Cargará la configuración desde la tarjeta SD
3. Iniciará las lecturas de sensores
4. Enviará datos al backend cada X segundos

## 📊 **Monitoreo en Tiempo Real**

### **Dashboard de Sensores**
- Ver lecturas en tiempo real
- Historial de lecturas
- Alertas automáticas
- Gráficos de tendencias

### **Logs del ESP32**
```
🚀 ESP32 IAM - Sistema de Lecturas Periódicas
📱 Dispositivo: ESP32 Almacén Principal
🆔 ID: esp32_1234567890_abc123
✅ Configuración cargada: 1 sensores
✅ Sensores inicializados
📶 Conectando a WiFi: MiRedWiFi
✅ WiFi conectado
📡 IP: 192.168.1.100
✅ Sistema iniciado correctamente
📊 Leyendo sensores...
📊 Temperatura (DHT22): 25.50 °C
📤 Enviando datos: {"deviceId":"esp32_1234567890_abc123",...}
✅ Datos enviados. Código: 200, Respuesta: {"totalLecturas":1,"alertasGeneradas":0}
```

## 🔧 **Configuración Avanzada**

### **Umbrales Personalizables**
- **Temperatura:** 15°C - 35°C (por defecto)
- **Humedad:** 30% - 80% (por defecto)
- **Peso:** 0kg - 1000kg (por defecto)
- **Presión:** 900hPa - 1100hPa (por defecto)

### **Intervalos de Lectura**
- **Mínimo:** 10 segundos
- **Máximo:** 300 segundos
- **Por defecto:** 30 segundos

### **Sensores Soportados**
- **DHT22:** Temperatura y humedad
- **HX711:** Peso con celda de carga
- **BMP280:** Presión atmosférica
- **Extensible:** Fácil agregar nuevos sensores

## 🚨 **Sistema de Alertas**

### **Alertas Automáticas**
- Valores fuera de umbral
- Dispositivo desconectado
- Errores de lectura
- Notificaciones por email/SMS

### **Tipos de Alertas**
- **NORMAL:** Valor dentro del rango
- **ALERTA:** Valor cerca del umbral
- **CRÍTICO:** Valor muy fuera del rango

## 🔄 **Migración desde MQTT**

### **Ventajas del Nuevo Sistema**
- ✅ **Simplicidad:** Sin broker MQTT
- ✅ **Confiabilidad:** HTTP más estable
- ✅ **Costos:** Sin costos de broker
- ✅ **Configuración:** Más fácil desde frontend
- ✅ **Mantenimiento:** Menos componentes

### **Compatibilidad**
- Mantiene sistema MQTT para dispositivos existentes
- Migración gradual opcional
- Misma funcionalidad de alertas y monitoreo

## 🛠️ **Solución de Problemas**

### **Problemas Comunes**

#### **ESP32 no se conecta al WiFi**
- Verificar SSID y contraseña
- Revisar logs en Monitor Serial
- Comprobar que la red WiFi esté disponible

#### **No se envían datos**
- Verificar conexión a internet
- Revisar URL del API
- Comprobar token de autenticación

#### **Lecturas incorrectas**
- Verificar conexiones físicas
- Comprobar pines configurados
- Revisar librerías instaladas

#### **Error de configuración**
- Verificar archivo JSON en tarjeta SD
- Comprobar formato del archivo
- Revisar permisos de archivo

### **Logs de Debug**
```cpp
// Habilitar logs detallados
#define DEBUG_MODE true

// En el código generado
if (DEBUG_MODE) {
  Serial.printf("Debug: %s\n", mensaje);
}
```

## 📈 **Próximas Mejoras**

### **Funcionalidades Planificadas**
- 🔮 **Portal Captivo:** Configuración vía web
- 🔮 **OTA Updates:** Actualizaciones inalámbricas
- 🔮 **Backup Local:** Almacenamiento en SPIFFS
- 🔮 **Múltiples Redes WiFi:** Fallback automático
- 🔮 **Modo Batería:** Optimización de energía

### **Integraciones Futuras**
- 🔮 **Cloud IoT:** Integración con AWS IoT
- 🔮 **Machine Learning:** Predicción de valores
- 🔮 **Dashboard Avanzado:** Gráficos en tiempo real
- 🔮 **API Pública:** Acceso para terceros

---

**Fecha de Creación:** Enero 2024  
**Versión:** 1.0  
**Autor:** Equipo de Desarrollo IAM  
**Estado:** Implementado ✅

