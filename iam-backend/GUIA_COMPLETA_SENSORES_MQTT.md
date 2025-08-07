# 🚀 Guía Completa: Sistema de Sensores MQTT

## 📋 Resumen Ejecutivo

Este documento describe el sistema completo de sensores con integración MQTT que permite a los usuarios:

- ✅ **Crear sensores fácilmente** con configuración automática
- ✅ **Conectar dispositivos físicos** mediante MQTT
- ✅ **Monitorear en tiempo real** las lecturas de sensores
- ✅ **Recibir alertas automáticas** basadas en umbrales
- ✅ **Visualizar datos** en dashboards interactivos

## 🏗️ Arquitectura del Sistema

### **Flujo Completo de Datos**

```
[Sensor Físico] → [MQTT Broker (EMQX)] → [Backend NestJS] → [Frontend React] → [Alertas]
```

### **Componentes Principales**

1. **Frontend (React/Next.js)**
   - Formularios de configuración
   - Dashboard de monitoreo
   - Wizard de configuración MQTT

2. **Backend (NestJS)**
   - Servicio MQTT
   - API REST para sensores
   - WebSockets para tiempo real
   - Sistema de alertas

3. **Base de Datos (PostgreSQL)**
   - Tabla `Sensor`
   - Tabla `SensorLectura`
   - Tabla `AlertHistory`

4. **Broker MQTT (EMQX)**
   - Gestión de dispositivos
   - Autenticación y autorización
   - Routing de mensajes

## 🎯 Funcionalidades Implementadas

### **1. Configuración MQTT**

#### **Componente: `MqttConfigForm`**
- Configuración del broker EMQX
- Gestión de credenciales
- Prueba de conectividad
- Estado en tiempo real

#### **Características:**
- ✅ Configuración automática para EMQX
- ✅ Validación de conexión
- ✅ Gestión de credenciales seguras
- ✅ Interfaz intuitiva

### **2. Wizard de Configuración de Sensores**

#### **Componente: `SensorWizard`**
- 4 pasos guiados para configuración completa
- Generación automática de credenciales MQTT
- Código de ejemplo para dispositivos físicos

#### **Pasos del Wizard:**
1. **Información Básica**: Nombre, tipo, ubicación
2. **Dispositivo**: Fabricante, modelo, configuración
3. **MQTT**: Credenciales y tópicos
4. **Resumen**: Revisión y código de ejemplo

### **3. Dashboard de Monitoreo**

#### **Componente: `MqttDashboard`**
- Estado de conexión MQTT
- Dispositivos conectados
- Lecturas recientes
- Estadísticas en tiempo real

### **4. Formulario Mejorado de Sensores**

#### **Componente: `SensorForm` (Mejorado)**
- Configuración visual por campos
- Validaciones automáticas
- Configuraciones predefinidas por tipo

## 🔧 Configuración Técnica

### **Variables de Entorno Requeridas**

```env
# Configuración MQTT para EMQX Broker
MQTT_ENABLED=true
MQTT_HOST=h02f10fd.ala.us-east-1.emqxsl.com
MQTT_PORT=8883
MQTT_USE_TLS=true
MQTT_USERNAME=tu_usuario
MQTT_PASSWORD=tu_contraseña
MQTT_APP_ID=v2c96220
MQTT_APP_SECRET=tu_app_secret
MQTT_API_ENDPOINT=https://h02f10fd.ala.us-east-1.emqxsl.com:8443/api/v5

# Configuración avanzada MQTT
MQTT_RECONNECT_PERIOD=5000
MQTT_CONNECT_TIMEOUT=10000
MQTT_MAX_RECONNECT_ATTEMPTS=5
```

### **Endpoints API Principales**

#### **Configuración MQTT**
```http
GET /api/mqtt-sensor/status
POST /api/mqtt-sensor/toggle
GET /api/mqtt-sensor/devices
POST /api/mqtt-sensor/devices
```

#### **Gestión de Sensores**
```http
POST /api/mqtt-sensor/sensores/registrar-con-dispositivo
GET /api/sensores/lecturas/recientes
POST /api/sensores/lectura
```

## 📱 Uso del Sistema

### **1. Configurar MQTT**

1. Ir a **Configuración MQTT** en el dashboard
2. Configurar las credenciales del broker EMQX
3. Probar la conexión
4. Habilitar el servicio MQTT

### **2. Crear un Sensor con MQTT**

1. Ir a **Sensores** en el dashboard
2. Hacer clic en **"Sensor con MQTT"**
3. Seguir el wizard de 4 pasos:
   - Información básica del sensor
   - Detalles del dispositivo
   - Configuración MQTT
   - Revisión y código

### **3. Configurar Dispositivo Físico**

1. Copiar las credenciales MQTT generadas
2. Usar el código de ejemplo proporcionado
3. Configurar el dispositivo físico
4. Verificar la conexión en el dashboard

### **4. Monitorear Sensores**

1. Ver el dashboard MQTT para estado general
2. Revisar lecturas en tiempo real
3. Configurar alertas si es necesario
4. Analizar datos históricos

## 🔌 Integración con Dispositivos Físicos

### **Código de Ejemplo (Arduino/ESP32)**

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración MQTT
const char* mqtt_server = "h02f10fd.ala.us-east-1.emqxsl.com";
const int mqtt_port = 8883;
const char* mqtt_username = "sensor_temperatura_001";
const char* mqtt_password = "password123";
const char* mqtt_topic = "empresa/sensor/temperatura_001/data";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Leer sensor
  float temperatura = leerTemperatura();
  
  // Crear JSON
  String json = "{\"temperatura\":" + String(temperatura) + ",\"timestamp\":" + String(millis()) + "}";
  
  // Publicar en MQTT
  client.publish(mqtt_topic, json.c_str());
  
  delay(30000); // Enviar cada 30 segundos
}
```

### **Formatos de Mensaje Soportados**

#### **Temperatura**
```json
{
  "temperatura": 25.5,
  "timestamp": 1234567890,
  "sensor_id": 1
}
```

#### **Humedad**
```json
{
  "humedad": 60.0,
  "timestamp": 1234567890,
  "sensor_id": 1
}
```

#### **Peso**
```json
{
  "peso": 15.5,
  "timestamp": 1234567890,
  "sensor_id": 1
}
```

#### **Presión**
```json
{
  "presion": 1013.25,
  "timestamp": 1234567890,
  "sensor_id": 1
}
```

## 🚨 Sistema de Alertas

### **Alertas Automáticas**

El sistema genera alertas automáticamente cuando:

- ✅ **Valores fuera de rango**: Temperatura, humedad, peso, presión
- ✅ **Dispositivos desconectados**: Pérdida de conexión MQTT
- ✅ **Errores de lectura**: Datos inconsistentes o faltantes

### **Configuración de Alertas**

```typescript
// Configuración predefinida por tipo de sensor
const CONFIGURACIONES_PREDEFINIDAS = {
  TEMPERATURA: {
    unidad: '°C',
    rango_min: -20,
    rango_max: 50,
    umbral_alerta: 35,
    umbral_critico: 40
  },
  HUMEDAD: {
    unidad: '%',
    rango_min: 0,
    rango_max: 100,
    umbral_alerta: 80,
    umbral_critico: 90
  }
}
```

## 📊 Dashboard y Visualización

### **Métricas Disponibles**

- **Estado MQTT**: Conectado/Desconectado
- **Dispositivos**: Número de dispositivos conectados
- **Reconexiones**: Intentos de reconexión
- **Lecturas**: Número de lecturas en 24h

### **Gráficos en Tiempo Real**

- **Tendencias**: Evolución de valores en el tiempo
- **Alertas**: Historial de alertas generadas
- **Dispositivos**: Estado de cada dispositivo

## 🔒 Seguridad

### **Medidas Implementadas**

- ✅ **Autenticación JWT**: Para todas las operaciones
- ✅ **Autorización por roles**: ADMIN y SUPERADMIN
- ✅ **Validación de datos**: En frontend y backend
- ✅ **Conexión TLS**: Para MQTT
- ✅ **Credenciales seguras**: Generación automática

### **Buenas Prácticas**

1. **Cambiar credenciales por defecto**
2. **Usar conexiones TLS**
3. **Limitar acceso por IP si es posible**
4. **Monitorear logs regularmente**
5. **Actualizar dispositivos regularmente**

## 🛠️ Mantenimiento

### **Tareas Regulares**

1. **Monitorear logs MQTT**
2. **Verificar conectividad de dispositivos**
3. **Revisar alertas generadas**
4. **Actualizar configuraciones si es necesario**
5. **Respaldar configuraciones**

### **Solución de Problemas**

#### **Dispositivo no se conecta**
1. Verificar credenciales MQTT
2. Comprobar conectividad WiFi
3. Revisar logs del dispositivo
4. Verificar configuración del broker

#### **No se reciben lecturas**
1. Verificar tópico MQTT
2. Comprobar formato de mensaje
3. Revisar logs del backend
4. Verificar configuración del sensor

## 📈 Escalabilidad

### **Características Escalables**

- ✅ **Arquitectura modular**: Componentes independientes
- ✅ **Base de datos optimizada**: Índices y consultas eficientes
- ✅ **WebSockets**: Comunicación en tiempo real
- ✅ **MQTT**: Protocolo ligero y eficiente
- ✅ **Configuración dinámica**: Sin reinicio del sistema

### **Límites Recomendados**

- **Dispositivos por empresa**: 100-500
- **Lecturas por minuto**: 1000-5000
- **Sensores por ubicación**: 10-50
- **Alertas simultáneas**: 100-1000

## 🎉 Conclusión

El sistema de sensores MQTT proporciona una solución completa y escalable para:

- ✅ **Configuración fácil** de sensores físicos
- ✅ **Monitoreo en tiempo real** de datos
- ✅ **Alertas automáticas** basadas en umbrales
- ✅ **Interfaz intuitiva** para usuarios
- ✅ **Arquitectura robusta** y escalable

### **Próximos Pasos**

1. **Implementar más tipos de sensores**
2. **Añadir análisis predictivo**
3. **Integrar con más brokers MQTT**
4. **Desarrollar app móvil**
5. **Añadir machine learning para alertas**

---

**Documento creado el**: 2025-01-08  
**Versión**: 1.0  
**Autor**: Sistema IAM  
**Última actualización**: 2025-01-08 