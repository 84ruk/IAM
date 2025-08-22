/**
 * 🚀 EJEMPLO COMPLETO: Como implementar POST /sensores en el frontend
 * ✅ Con credentials: 'include' y estructura completa
 */

// ===========================================
// 📝 1. ESTRUCTURA COMPLETA DEL DTO
// ===========================================

const createSensorDto = {
  // 🔴 CAMPOS OBLIGATORIOS
  nombre: "Sensor Temperatura Bodega A",
  tipo: "TEMPERATURA", // TEMPERATURA | HUMEDAD | PESO | PRESION
  ubicacionId: 1,

  // 🟡 CAMPOS OPCIONALES
  descripcion: "Sensor de temperatura para monitoreo de bodega principal",
  activo: true,
  modo: "AUTOMATICO", // AUTOMATICO | MANUAL

  // 🟢 CONFIGURACIÓN BÁSICA (OPCIONAL)
  configuracion: {
    unidad: "°C",
    precision: 0.1,
    intervalo_lectura: 30000
  },

  // 🚀 NUEVO: UMBRALES PERSONALIZADOS (OPCIONAL)
  umbralesPersonalizados: {
    rango_min: 15.0,
    rango_max: 25.0,
    umbral_alerta_bajo: 18.0,
    umbral_alerta_alto: 22.0,
    umbral_critico_bajo: 15.0,
    umbral_critico_alto: 25.0,
    severidad: "MEDIA", // BAJA | MEDIA | ALTA | CRITICA
    intervalo_lectura: 10000,
    alertasActivas: true
  },

  // 🚀 NUEVO: CONFIGURACIÓN DE NOTIFICACIONES (OPCIONAL)
  configuracionNotificaciones: {
    email: true,
    sms: true,
    webSocket: true
  }
};

// ===========================================
// 🔧 2. IMPLEMENTACIÓN CON FETCH
// ===========================================

const crearSensor = async (sensorData) => {
  try {
    const response = await fetch('http://localhost:3001/sensores', {
      method: 'POST',
      
      // 🔑 HEADERS OBLIGATORIOS
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // O donde tengas el token
      },
      
      // 🍪 CREDENTIALS INCLUDE (como solicitado)
      credentials: 'include',
      
      // 📝 DATOS COMPLETOS
      body: JSON.stringify(sensorData)
    });

    // 🔍 VERIFICAR RESPUESTA
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${errorData.message}`);
    }

    const result = await response.json();
    console.log('✅ Sensor creado exitosamente:', result);
    return result;

  } catch (error) {
    console.error('❌ Error creando sensor:', error);
    throw error;
  }
};

// ===========================================
// 🔧 3. IMPLEMENTACIÓN CON AXIOS
// ===========================================

const crearSensorConAxios = async (sensorData) => {
  try {
    const response = await axios.post('http://localhost:3001/sensores', sensorData, {
      
      // 🔑 HEADERS
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      
      // 🍪 CREDENTIALS INCLUDE
      withCredentials: true,
      
      // ⏱️ TIMEOUT
      timeout: 10000
    });

    console.log('✅ Sensor creado exitosamente:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Error creando sensor:', error.response?.data || error.message);
    throw error;
  }
};

// ===========================================
// 🔧 4. IMPLEMENTACIÓN CON SERVICIO REUTILIZABLE
// ===========================================

class SensorService {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  // 🚀 Obtener token de autenticación
  getAuthToken() {
    return localStorage.getItem('authToken') || 
           sessionStorage.getItem('authToken') ||
           document.cookie.match(/authToken=([^;]+)/)?.[1];
  }

  // 🚀 Headers base para todas las peticiones
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`,
    };
  }

  // 🚀 Crear sensor con estructura completa
  async crearSensor(sensorData) {
    const response = await fetch(`${this.baseUrl}/sensores`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include', // 🍪 CREDENTIALS INCLUDE
      body: JSON.stringify(sensorData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${errorData.message}`);
    }

    return response.json();
  }

  // 🚀 Obtener todos los sensores
  async obtenerSensores(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const url = `${this.baseUrl}/sensores${params ? `?${params}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${errorData.message}`);
    }

    return response.json();
  }
}

// ===========================================
// 🧪 5. EJEMPLO DE USO COMPLETO
// ===========================================

const ejemploCompleto = async () => {
  const sensorService = new SensorService();

  try {
    // 📝 Crear sensor con datos completos
    const nuevoSensor = await sensorService.crearSensor({
      nombre: "Sensor Humedad Laboratorio",
      tipo: "HUMEDAD",
      ubicacionId: 2,
      descripcion: "Monitor de humedad para laboratorio de calidad",
      umbralesPersonalizados: {
        rango_min: 40.0,
        rango_max: 70.0,
        umbral_alerta_bajo: 45.0,
        umbral_alerta_alto: 65.0,
        umbral_critico_bajo: 40.0,
        umbral_critico_alto: 70.0,
        severidad: "ALTA",
        intervalo_lectura: 15000,
        alertasActivas: true
      },
      configuracionNotificaciones: {
        email: true,
        sms: true,
        webSocket: true
      }
    });

    console.log('🎉 Sensor creado:', nuevoSensor);

    // 📖 Obtener todos los sensores
    const sensores = await sensorService.obtenerSensores();
    console.log('📋 Lista de sensores:', sensores);

  } catch (error) {
    console.error('💥 Error en ejemplo:', error);
  }
};

// ===========================================
// 📋 6. ERRORES COMUNES Y SOLUCIONES
// ===========================================

/*
❌ ERROR 401: Token inválido o expirado
SOLUCIÓN: Verificar que el token JWT esté presente y sea válido

❌ ERROR 403: Forbidden  
SOLUCIÓN: Verificar que el usuario tenga rol ADMIN o SUPERADMIN

❌ ERROR 400: Bad Request
SOLUCIÓN: Verificar que los datos del DTO sean correctos

❌ ERROR 404: Cannot POST /sensores
SOLUCIÓN: ✅ YA RESUELTO - El endpoint ahora existe

🔑 REQUISITOS:
1. Token JWT válido en el header Authorization
2. Usuario con rol ADMIN o SUPERADMIN  
3. Empresa asignada al usuario
4. Datos del sensor válidos (nombre, tipo, ubicacionId)

🍪 CREDENTIALS INCLUDE:
- Incluye cookies automáticamente
- Necesario para sesiones basadas en cookies
- Funciona con CORS configurado correctamente
*/

// 🚀 Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SensorService, crearSensor, ejemploCompleto };
}
