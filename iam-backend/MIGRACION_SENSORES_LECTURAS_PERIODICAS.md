# 🚀 Migración de Sensores: MQTT a Lecturas Periódicas

## 📋 Resumen Ejecutivo

Este documento describe la migración del sistema de sensores de MQTT (tiempo real) a un sistema basado en lecturas periódicas con comparación de umbrales en el backend.

### **Objetivos:**
- ✅ Simplificar la arquitectura eliminando dependencia de MQTT
- ✅ Mejorar la confiabilidad del sistema
- ✅ Reducir costos de infraestructura
- ✅ Mantener funcionalidad de alertas y monitoreo
- ✅ Reutilizar código existente

## 🔄 **Cambios Principales**

### **Antes (MQTT):**
```
ESP32 → MQTT Broker → Backend (tiempo real)
```

### **Después (Lecturas Periódicas):**
```
ESP32 → HTTP REST API → Backend (cada X segundos/minutos)
```

## 🏗️ **Arquitectura Nueva**

### **1. ESP32 (Dispositivo)**
- **Función**: Leer sensores y enviar datos vía HTTP
- **Frecuencia**: Configurable (30 segundos por defecto)
- **Protocolo**: HTTP REST API
- **Autenticación**: Token Bearer

### **2. Backend (Procesamiento)**
- **Función**: Recibir, procesar y almacenar lecturas
- **Umbrales**: Configurables por empresa/producto
- **Alertas**: Automáticas cuando se exceden umbrales
- **Notificaciones**: Email, SMS, WebSocket

### **3. Base de Datos**
- **Lecturas**: Almacenamiento histórico
- **Sensores**: Configuración y estado
- **Alertas**: Historial de alertas generadas
- **Umbrales**: Configuración por sensor

## 📁 **Archivos Modificados/Creados**

### **Nuevos Archivos:**
```
iam-backend/
├── scripts/
│   ├── esp32-lecturas-periodicas.ino          # Código ESP32
│   └── configurar-esp32-lecturas-periodicas.js # Script configuración
├── src/sensores/dto/
│   └── create-sensor-lectura-multiple.dto.ts  # DTO para múltiples lecturas
└── MIGRACION_SENSORES_LECTURAS_PERIODICAS.md  # Esta documentación
```

### **Archivos Modificados:**
```
iam-backend/src/sensores/
├── sensores.service.ts    # Nuevo método registrarLecturasMultiples()
└── sensores.controller.ts # Nuevo endpoint /lecturas-multiples
```

## 🔧 **Implementación Paso a Paso**

### **Paso 1: Configurar el ESP32**

1. **Ejecutar script de configuración:**
```bash
cd iam-backend
node scripts/configurar-esp32-lecturas-periodicas.js
```

2. **Seguir el wizard interactivo:**
   - Información del dispositivo
   - Configuración WiFi
   - Configuración de sensores
   - Umbrales por sensor

3. **Subir código al ESP32:**
   - Copiar `esp32-lecturas-periodicas.ino` al Arduino IDE
   - Instalar librerías necesarias
   - Subir al dispositivo

### **Paso 2: Configurar el Backend**

1. **Verificar que el backend esté funcionando:**
```bash
npm run start:dev
```

2. **Probar el nuevo endpoint:**
```bash
curl -X POST http://localhost:3000/sensores/lecturas-multiples \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "deviceId": "esp32_test_001",
    "deviceName": "ESP32 Test",
    "ubicacionId": 1,
    "empresaId": 1,
    "timestamp": 1234567890,
    "sensors": {
      "temperatura": 25.5,
      "humedad": 60.0,
      "peso": 15.75
    }
  }'
```

### **Paso 3: Configurar Alertas**

1. **Umbrales por defecto:**
   - **Temperatura**: 15°C - 35°C
   - **Humedad**: 30% - 80%
   - **Peso**: 0kg - 1000kg
   - **Presión**: 900hPa - 1100hPa

2. **Personalizar umbrales:**
   - Via API: `PUT /sensores/sensor/:id`
   - Via Dashboard: Interfaz web
   - Via Script: Modificar configuración

## 📊 **Formato de Datos**

### **Datos Enviados por ESP32:**
```json
{
  "deviceId": "esp32_001",
  "deviceName": "ESP32 Almacén Principal",
  "ubicacionId": 1,
  "empresaId": 1,
  "timestamp": 1234567890,
  "sensors": {
    "temperatura": 25.5,
    "humedad": 60.0,
    "peso": 15.75,
    "presion": 1013.25
  },
  "sensorDetails": [
    {
      "nombre": "temperatura",
      "tipo": "TEMPERATURA",
      "valor": 25.5,
      "unidad": "°C",
      "umbralMin": 15,
      "umbralMax": 35
    }
  ]
}
```

### **Respuesta del Backend:**
```json
{
  "totalLecturas": 4,
  "alertasGeneradas": 1,
  "lecturas": [
    {
      "id": 123,
      "tipo": "TEMPERATURA",
      "valor": 25.5,
      "unidad": "°C",
      "fecha": "2024-01-15T10:30:00Z",
      "estado": "NORMAL",
      "mensaje": "Valor dentro del rango normal"
    }
  ]
}
```

## 🚨 **Sistema de Alertas**

### **Tipos de Alertas:**
1. **Umbral Excedido**: Valor fuera del rango configurado
2. **Estado Crítico**: Valor muy lejos del umbral
3. **Dispositivo Desconectado**: No hay lecturas recientes

### **Notificaciones:**
- **Email**: Configurable por empresa
- **SMS**: Para alertas críticas
- **WebSocket**: Tiempo real en dashboard
- **Push**: Notificaciones móviles

### **Configuración de Alertas:**
```json
{
  "tipo": "SENSOR_TEMPERATURA",
  "severidad": "ALTA",
  "titulo": "Alerta de Temperatura",
  "mensaje": "Sensor temperatura: 25.5°C (Umbral: 15-35)",
  "destinatarios": ["admin@empresa.com"],
  "condicionActivacion": {
    "sensorId": 1,
    "sensorNombre": "temperatura",
    "valor": 25.5,
    "umbralMin": 15,
    "umbralMax": 35,
    "tipo": "TEMPERATURA"
  }
}
```

## 🔄 **Migración Gradual**

### **Fase 1: Implementación Paralela**
- ✅ Mantener sistema MQTT funcionando
- ✅ Implementar nuevo sistema HTTP
- ✅ Probar con dispositivos de prueba

### **Fase 2: Migración de Dispositivos**
- ✅ Migrar dispositivos uno por uno
- ✅ Verificar funcionamiento
- ✅ Actualizar documentación

### **Fase 3: Desactivación MQTT**
- ✅ Desactivar sistema MQTT
- ✅ Limpiar código no utilizado
- ✅ Optimizar recursos

## 📈 **Ventajas del Nuevo Sistema**

### **Técnicas:**
- ✅ **Simplicidad**: Sin broker MQTT
- ✅ **Confiabilidad**: HTTP más estable
- ✅ **Escalabilidad**: Fácil agregar dispositivos
- ✅ **Mantenimiento**: Menos componentes

### **Operacionales:**
- ✅ **Costos**: Sin costos de broker MQTT
- ✅ **Configuración**: Más fácil de configurar
- ✅ **Debugging**: Logs más claros
- ✅ **Flexibilidad**: Frecuencia configurable

### **Funcionales:**
- ✅ **Alertas**: Sistema de alertas mejorado
- ✅ **Umbrales**: Configurables por sensor
- ✅ **Histórico**: Mejor almacenamiento
- ✅ **Analytics**: Más datos para análisis

## 🛠️ **Mantenimiento**

### **Monitoreo:**
- **Logs**: Revisar logs del backend
- **Alertas**: Verificar generación de alertas
- **Dispositivos**: Estado de conexión
- **Rendimiento**: Tiempo de respuesta

### **Backup:**
- **Configuración**: Backup de configuraciones
- **Datos**: Backup de lecturas históricas
- **Código**: Versionado del código ESP32

### **Actualizaciones:**
- **Firmware**: Actualizar código ESP32
- **Backend**: Actualizar dependencias
- **Configuración**: Actualizar umbrales

## 🚀 **Próximos Pasos**

### **Corto Plazo:**
1. ✅ Implementar código ESP32
2. ✅ Probar con dispositivos de prueba
3. ✅ Configurar alertas básicas
4. ✅ Documentar procedimientos

### **Mediano Plazo:**
1. 🔄 Migrar dispositivos existentes
2. 🔄 Optimizar rendimiento
3. 🔄 Mejorar interfaz de configuración
4. 🔄 Implementar analytics avanzados

### **Largo Plazo:**
1. 🔮 Machine Learning para predicción
2. 🔮 Integración con otros sistemas
3. 🔮 Dashboard avanzado
4. 🔮 API pública para terceros

## 📞 **Soporte**

### **Contacto:**
- **Desarrollador**: Equipo de desarrollo
- **Documentación**: Este archivo
- **Issues**: GitHub Issues
- **Chat**: Slack/Discord

### **Recursos:**
- **Código ESP32**: `scripts/esp32-lecturas-periodicas.ino`
- **Script Configuración**: `scripts/configurar-esp32-lecturas-periodicas.js`
- **API Docs**: Swagger/OpenAPI
- **Ejemplos**: Carpeta `examples/`

---

**Fecha de Creación**: Enero 2024  
**Versión**: 1.0  
**Autor**: Equipo de Desarrollo IAM  
**Estado**: Implementado ✅

