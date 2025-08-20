#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE PRUEBA COMPLETO DEL SISTEMA DE ALERTAS
 * 
 * Este script prueba:
 * 1. ✅ Endpoints de umbrales del sensor
 * 2. ✅ Endpoints de alertas del sensor
 * 3. ✅ Configuración de alertas
 * 4. ✅ WebSocket para alertas en tiempo real
 * 5. ✅ Simulación de lecturas que generan alertas
 * 
 * USO: node test-sistema-alertas-completo.js
 */

const axios = require('axios')
const { io } = require('socket.io-client')

// Configuración
const CONFIG = {
  BACKEND_URL: 'http://localhost:3001',
  SENSOR_ID: 25,
  EMPRESA_ID: 2,
  JWT_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTUxOTU0MTIsImp0aSI6ImE2YzNhNmYwLTdlMGItNGJmYi1hZDAzLTBlMDUzYmNmYjFkMyIsInN1YiI6IjIiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiRUxFQ1RST05JQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTUyODE4MTIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.au_wRgr9DZsrgq9YvjfTBxEJS5LvqVH6tGQbYZDuddA'
}

// Headers para autenticación
const getHeaders = () => ({
  'Authorization': `Bearer ${CONFIG.JWT_TOKEN}`,
  'Content-Type': 'application/json'
})

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

const logSuccess = (message) => log(`✅ ${message}`, 'green')
const logError = (message) => log(`❌ ${message}`, 'red')
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue')
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow')
const logStep = (message) => log(`\n🔹 ${message}`, 'cyan')

// Función para hacer pausa
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Clase principal de pruebas
class SistemaAlertasTester {
  constructor() {
    this.socket = null
    this.alertasRecibidas = []
    this.testResults = []
  }

  async iniciar() {
    log('\n🚀 INICIANDO PRUEBAS DEL SISTEMA DE ALERTAS', 'bright')
    log('=' * 60, 'bright')
    
    try {
      // 1. Probar endpoints de umbrales
      await this.probarUmbrales()
      
      // 2. Probar endpoints de alertas
      await this.probarAlertas()
      
      // 3. Probar configuración de alertas
      await this.probarConfiguracionAlertas()
      
      // 4. Conectar WebSocket
      await this.conectarWebSocket()
      
      // 5. Simular lecturas que generen alertas
      await this.simularLecturasGeneradorasDeAlertas()
      
      // 6. Esperar alertas por WebSocket
      await this.esperarAlertasWebSocket()
      
      // 7. Resolver alertas
      await this.resolverAlertas()
      
      // 8. Mostrar resumen
      this.mostrarResumen()
      
    } catch (error) {
      logError(`Error en las pruebas: ${error.message}`)
      console.error(error)
    } finally {
      if (this.socket) {
        this.socket.disconnect()
      }
    }
  }

  async probarUmbrales() {
    logStep('1. PROBANDO ENDPOINTS DE UMBRALES')
    
    try {
      // GET /sensores/:id/umbrales
      logInfo('Obteniendo umbrales actuales del sensor...')
      const response = await axios.get(
        `${CONFIG.BACKEND_URL}/sensores/${CONFIG.SENSOR_ID}/umbrales`,
        { headers: getHeaders() }
      )
      
      if (response.status === 200) {
        logSuccess(`Umbrales obtenidos: ${JSON.stringify(response.data, null, 2)}`)
        this.testResults.push({ test: 'GET Umbrales', status: 'PASS' })
      }
    } catch (error) {
      logError(`Error obteniendo umbrales: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
      this.testResults.push({ test: 'GET Umbrales', status: 'FAIL', error: error.message })
    }

    try {
      // POST /sensores/:id/umbrales
      logInfo('Actualizando umbrales del sensor...')
      const nuevosUmbrales = {
        temperaturaMin: 15,
        temperaturaMax: 35,
        humedadMin: 30,
        humedadMax: 80,
        alertasActivas: true,
        mensajeAlerta: '⚠️ Temperatura fuera de rango normal',
        mensajeCritico: '🚨 Temperatura crítica - acción inmediata requerida',
        severidad: 'ALTA',
        intervaloVerificacionMinutos: 5,
        notificacionEmail: true,
        notificacionSMS: false,
        notificacionWebSocket: true
      }
      
      const response = await axios.post(
        `${CONFIG.BACKEND_URL}/sensores/${CONFIG.SENSOR_ID}/umbrales`,
        nuevosUmbrales,
        { headers: getHeaders() }
      )
      
      if (response.status === 200) {
        logSuccess(`Umbrales actualizados: ${JSON.stringify(response.data, null, 2)}`)
        this.testResults.push({ test: 'POST Umbrales', status: 'PASS' })
      }
    } catch (error) {
      logError(`Error actualizando umbrales: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
      this.testResults.push({ test: 'POST Umbrales', status: 'FAIL', error: error.message })
    }
  }

  async probarAlertas() {
    logStep('2. PROBANDO ENDPOINTS DE ALERTAS')
    
    try {
      // GET /sensores/:id/alertas
      logInfo('Obteniendo alertas del sensor...')
      const response = await axios.get(
        `${CONFIG.BACKEND_URL}/sensores/${CONFIG.SENSOR_ID}/alertas`,
        { headers: getHeaders() }
      )
      
      if (response.status === 200) {
        logSuccess(`Alertas obtenidas: ${JSON.stringify(response.data, null, 2)}`)
        this.testResults.push({ test: 'GET Alertas', status: 'PASS' })
      }
    } catch (error) {
      logError(`Error obteniendo alertas: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
      this.testResults.push({ test: 'GET Alertas', status: 'FAIL', error: error.message })
    }

    try {
      // GET /sensores/:id/alertas/activas
      logInfo('Obteniendo alertas activas...')
      const response = await axios.get(
        `${CONFIG.BACKEND_URL}/sensores/${CONFIG.SENSOR_ID}/alertas/activas`,
        { headers: getHeaders() }
      )
      
      if (response.status === 200) {
        logSuccess(`Alertas activas obtenidas: ${JSON.stringify(response.data, null, 2)}`)
        this.testResults.push({ test: 'GET Alertas Activas', status: 'PASS' })
      }
    } catch (error) {
      logError(`Error obteniendo alertas activas: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
      this.testResults.push({ test: 'GET Alertas Activas', status: 'FAIL', error: error.message })
    }

    try {
      // GET /sensores/:id/alertas/historico
      logInfo('Obteniendo historial de alertas...')
      const response = await axios.get(
        `${CONFIG.BACKEND_URL}/sensores/${CONFIG.SENSOR_ID}/alertas/historico?dias=30`,
        { headers: getHeaders() }
      )
      
      if (response.status === 200) {
        logSuccess(`Historial obtenido: ${JSON.stringify(response.data, null, 2)}`)
        this.testResults.push({ test: 'GET Historial', status: 'PASS' })
      }
    } catch (error) {
      logError(`Error obteniendo historial: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
      this.testResults.push({ test: 'GET Historial', status: 'FAIL', error: error.message })
    }
  }

  async probarConfiguracionAlertas() {
    logStep('3. PROBANDO CONFIGURACIÓN DE ALERTAS')
    
    try {
      // GET /sensores/:id/alertas/configuracion
      logInfo('Obteniendo configuración de alertas...')
      const response = await axios.get(
        `${CONFIG.BACKEND_URL}/sensores/${CONFIG.SENSOR_ID}/alertas/configuracion`,
        { headers: getHeaders() }
      )
      
      if (response.status === 200) {
        logSuccess(`Configuración obtenida: ${JSON.stringify(response.data, null, 2)}`)
        this.testResults.push({ test: 'GET Configuración', status: 'PASS' })
      }
    } catch (error) {
      logError(`Error obteniendo configuración: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
      this.testResults.push({ test: 'GET Configuración', status: 'FAIL', error: error.message })
    }

    try {
      // POST /sensores/:id/alertas/configuracion
      logInfo('Guardando configuración de alertas...')
      const configuracion = {
        sensorId: CONFIG.SENSOR_ID,
        tiposNotificacion: {
          email: true,
          sms: false,
          webSocket: true,
          push: false
        },
        destinatarios: [
          {
            id: '1',
            nombre: 'Administrador',
            email: 'admin@empresa.com',
            telefono: '+52 55 1234 5678',
            tipo: 'EMAIL',
            prioridad: 'ALTA',
            activo: true
          }
        ],
        escalamiento: {
          activo: true,
          tiempoEscalamientoMinutos: 30,
          niveles: [
            {
              id: '1',
              nivel: 1,
              tiempoMinutos: 15,
              destinatarios: ['1'],
              mensaje: 'Primera notificación de escalamiento'
            }
          ]
        },
        horario: {
          activo: false,
          horaInicio: '08:00',
          horaFin: '18:00',
          diasSemana: [1, 2, 3, 4, 5],
          zonaHoraria: 'America/Mexico_City'
        },
        retrasoNotificacionMinutos: 0,
        maxIntentosNotificacion: 3
      }
      
      const response = await axios.post(
        `${CONFIG.BACKEND_URL}/sensores/${CONFIG.SENSOR_ID}/alertas/configuracion`,
        configuracion,
        { headers: getHeaders() }
      )
      
      if (response.status === 200) {
        logSuccess(`Configuración guardada: ${JSON.stringify(response.data, null, 2)}`)
        this.testResults.push({ test: 'POST Configuración', status: 'PASS' })
      }
    } catch (error) {
      logError(`Error guardando configuración: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
      this.testResults.push({ test: 'POST Configuración', status: 'FAIL', error: error.message })
    }
  }

  async conectarWebSocket() {
    logStep('4. CONECTANDO WEBSOCKET PARA ALERTAS')
    
    try {
      this.socket = io(CONFIG.BACKEND_URL, {
        auth: {
          token: CONFIG.JWT_TOKEN
        },
        transports: ['websocket']
      })

      this.socket.on('connect', () => {
        logSuccess('WebSocket conectado exitosamente')
        this.testResults.push({ test: 'WebSocket Connect', status: 'PASS' })
      })

      this.socket.on('connect_error', (error) => {
        logError(`Error de conexión WebSocket: ${error.message}`)
        this.testResults.push({ test: 'WebSocket Connect', status: 'FAIL', error: error.message })
      })

      this.socket.on('nueva-alerta', (alerta) => {
        logWarning(`🚨 NUEVA ALERTA RECIBIDA: ${JSON.stringify(alerta, null, 2)}`)
        this.alertasRecibidas.push(alerta)
      })

      this.socket.on('estado-sensores', (estado) => {
        if (estado.tipo === 'ALERTA') {
          logWarning(`📡 ESTADO DE ALERTA: ${JSON.stringify(estado, null, 2)}`)
        }
      })

      // Suscribirse al sensor
      this.socket.emit('suscribir-sensor', { sensorId: CONFIG.SENSOR_ID })
      logInfo('Suscrito al sensor para alertas en tiempo real')
      
      // Esperar a que se establezca la conexión
      await sleep(2000)
      
    } catch (error) {
      logError(`Error configurando WebSocket: ${error.message}`)
      this.testResults.push({ test: 'WebSocket Setup', status: 'FAIL', error: error.message })
    }
  }

  async simularLecturasGeneradorasDeAlertas() {
    logStep('5. SIMULANDO LECTURAS QUE GENEREN ALERTAS')
    
    try {
      // Simular lectura con temperatura crítica (fuera de umbrales)
      const lecturaCritica = {
        sensorId: CONFIG.SENSOR_ID,
        empresaId: CONFIG.EMPRESA_ID,
        tipo: 'TEMPERATURA',
        valor: 40, // Temperatura muy alta
        unidad: '°C',
        fecha: new Date().toISOString(),
        ubicacionId: 1,
        metadata: {
          dispositivo: 'ESP32-TEST',
          bateria: 85,
          señal: -45
        }
      }
      
      logInfo('Enviando lectura crítica que debería generar alerta...')
      const response = await axios.post(
        `${CONFIG.BACKEND_URL}/iot/lecturas`,
        lecturaCritica,
        { headers: getHeaders() }
      )
      
      if (response.status === 200 || response.status === 201) {
        logSuccess(`Lectura crítica enviada: ${JSON.stringify(response.data, null, 2)}`)
        this.testResults.push({ test: 'Lectura Crítica', status: 'PASS' })
      }
    } catch (error) {
      logError(`Error enviando lectura crítica: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
      this.testResults.push({ test: 'Lectura Crítica', status: 'FAIL', error: error.message })
    }

    // Simular otra lectura crítica después de un tiempo
    setTimeout(async () => {
      try {
        const lecturaCritica2 = {
          sensorId: CONFIG.SENSOR_ID,
          empresaId: CONFIG.EMPRESA_ID,
          tipo: 'TEMPERATURA',
          valor: 45, // Temperatura aún más crítica
          unidad: '°C',
          fecha: new Date().toISOString(),
          ubicacionId: 1,
          metadata: {
            dispositivo: 'ESP32-TEST',
            bateria: 85,
            señal: -45
          }
        }
        
        logInfo('Enviando segunda lectura crítica...')
        await axios.post(
          `${CONFIG.BACKEND_URL}/iot/lecturas`,
          lecturaCritica2,
          { headers: getHeaders() }
        )
        logSuccess('Segunda lectura crítica enviada')
      } catch (error) {
        logError(`Error enviando segunda lectura: ${error.message}`)
      }
    }, 3000)
  }

  async esperarAlertasWebSocket() {
    logStep('6. ESPERANDO ALERTAS POR WEBSOCKET')
    
    logInfo('Esperando 10 segundos para recibir alertas...')
    await sleep(10000)
    
    if (this.alertasRecibidas.length > 0) {
      logSuccess(`Se recibieron ${this.alertasRecibidas.length} alertas por WebSocket`)
      this.testResults.push({ test: 'WebSocket Alertas', status: 'PASS', count: this.alertasRecibidas.length })
      
      // Mostrar las alertas recibidas
      this.alertasRecibidas.forEach((alerta, index) => {
        logInfo(`Alerta ${index + 1}: ${JSON.stringify(alerta, null, 2)}`)
      })
    } else {
      logWarning('No se recibieron alertas por WebSocket')
      this.testResults.push({ test: 'WebSocket Alertas', status: 'FAIL', error: 'No se recibieron alertas' })
    }
  }

  async resolverAlertas() {
    logStep('7. RESOLVIENDO ALERTAS')
    
    try {
      // Obtener alertas activas
      const response = await axios.get(
        `${CONFIG.BACKEND_URL}/sensores/${CONFIG.SENSOR_ID}/alertas/activas`,
        { headers: getHeaders() }
      )
      
      if (response.status === 200 && response.data.data.alertasActivas.length > 0) {
        const alertasActivas = response.data.data.alertasActivas
        
        logInfo(`Resolviendo ${alertasActivas.length} alertas activas...`)
        
        for (const alerta of alertasActivas) {
          try {
            const resolveResponse = await axios.post(
              `${CONFIG.BACKEND_URL}/sensores/alertas/${alerta.id}/resolver`,
              { comentario: 'Resuelta por script de prueba' },
              { headers: getHeaders() }
            )
            
            if (resolveResponse.status === 200) {
              logSuccess(`Alerta ${alerta.id} resuelta exitosamente`)
            }
          } catch (error) {
            logError(`Error resolviendo alerta ${alerta.id}: ${error.message}`)
          }
        }
        
        this.testResults.push({ test: 'Resolver Alertas', status: 'PASS', count: alertasActivas.length })
      } else {
        logInfo('No hay alertas activas para resolver')
        this.testResults.push({ test: 'Resolver Alertas', status: 'PASS', count: 0 })
      }
    } catch (error) {
      logError(`Error resolviendo alertas: ${error.message}`)
      this.testResults.push({ test: 'Resolver Alertas', status: 'FAIL', error: error.message })
    }
  }

  mostrarResumen() {
    logStep('8. RESUMEN DE PRUEBAS')
    
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length
    const failedTests = totalTests - passedTests
    
    log('\n📊 RESULTADOS FINALES:', 'bright')
    log('=' * 40, 'bright')
    
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌'
      const details = result.count ? ` (${result.count})` : ''
      const error = result.error ? ` - ${result.error}` : ''
      
      log(`${status} ${index + 1}. ${result.test}${details}${error}`)
    })
    
    log('\n' + '=' * 40, 'bright')
    log(`Total: ${totalTests} | ✅ Exitosos: ${passedTests} | ❌ Fallidos: ${failedTests}`, 'bright')
    
    if (failedTests === 0) {
      log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!', 'green')
    } else {
      log('\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.', 'yellow')
    }
    
    log('\n🔍 Alertas recibidas por WebSocket:', 'cyan')
    if (this.alertasRecibidas.length > 0) {
      this.alertasRecibidas.forEach((alerta, index) => {
        log(`  ${index + 1}. ${alerta.mensaje || alerta.tipo}`, 'cyan')
      })
    } else {
      log('  Ninguna alerta recibida', 'yellow')
    }
  }
}

// Ejecutar las pruebas
async function main() {
  const tester = new SistemaAlertasTester()
  await tester.iniciar()
}

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`)
  process.exit(1)
})

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(error => {
    logError(`Error fatal: ${error.message}`)
    process.exit(1)
  })
}

module.exports = SistemaAlertasTester
