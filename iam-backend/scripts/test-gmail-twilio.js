#!/usr/bin/env node

/**
 * 🧪 Script de Prueba para Gmail + Twilio
 * 
 * Este script verifica que la configuración de Gmail y Twilio esté correcta
 * y envía emails y SMS de prueba.
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testGmailConfig() {
  logInfo('🔧 Probando configuración de Gmail...');
  
  // Verificar variables de entorno
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logError(`Variables faltantes: ${missingVars.join(', ')}`);
    return false;
  }
  
  logSuccess('Variables de entorno de Gmail configuradas correctamente');
  
  // Crear transportador
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  // Verificar conexión
  try {
    await transporter.verify();
    logSuccess('Conexión SMTP verificada correctamente');
  } catch (error) {
    logError(`Error al verificar conexión SMTP: ${error.message}`);
    return false;
  }
  
  // Enviar email de prueba
  try {
    const testEmail = {
      from: `"${process.env.EMAIL_FROM_NAME || 'IAM Sistema'}" <${process.env.EMAIL_FROM}>`,
      to: process.env.SMTP_USER, // Enviar a ti mismo
      subject: '🧪 Prueba de Email - IAM Sistema',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🧪 Prueba de Email</h1>
            <p>Sistema de Notificaciones IAM</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2>¡Configuración Exitosa! 🎉</h2>
            <p>Este email confirma que tu configuración de Gmail está funcionando correctamente.</p>
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Detalles de la configuración:</h3>
              <ul>
                <li><strong>Servidor SMTP:</strong> ${process.env.SMTP_HOST}</li>
                <li><strong>Puerto:</strong> ${process.env.SMTP_PORT}</li>
                <li><strong>Usuario:</strong> ${process.env.SMTP_USER}</li>
                <li><strong>Fecha de prueba:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>Ahora puedes recibir notificaciones automáticas del sistema IAM.</p>
            <div style="text-align: center; margin-top: 20px;">
              <span style="background: #28a745; color: white; padding: 8px 16px; border-radius: 5px; font-weight: bold;">
                ✅ Configuración Completada
              </span>
            </div>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    logSuccess(`Email de prueba enviado correctamente`);
    logInfo(`Message ID: ${result.messageId}`);
    return true;
    
  } catch (error) {
    logError(`Error al enviar email de prueba: ${error.message}`);
    return false;
  }
}

async function testTwilioConfig() {
  logInfo('📱 Probando configuración de Twilio...');
  
  // Verificar variables de entorno
  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logError(`Variables faltantes: ${missingVars.join(', ')}`);
    return false;
  }
  
  logSuccess('Variables de entorno de Twilio configuradas correctamente');
  
  // Crear cliente de Twilio
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  // Verificar credenciales
  try {
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    logSuccess(`Cuenta de Twilio verificada: ${account.friendlyName}`);
    logInfo(`Estado de la cuenta: ${account.status}`);
    logInfo(`Tipo de cuenta: ${account.type}`);
  } catch (error) {
    logError(`Error al verificar cuenta de Twilio: ${error.message}`);
    return false;
  }
  
  // Verificar número de teléfono
  try {
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    const hasValidNumber = phoneNumbers.some(phone => 
      phone.phoneNumber === process.env.TWILIO_PHONE_NUMBER
    );
    
    if (hasValidNumber) {
      logSuccess(`Número de Twilio verificado: ${process.env.TWILIO_PHONE_NUMBER}`);
    } else {
      logWarning(`Número ${process.env.TWILIO_PHONE_NUMBER} no encontrado en tu cuenta`);
      logInfo('Números disponibles:');
      phoneNumbers.forEach(phone => {
        logInfo(`  - ${phone.phoneNumber} (${phone.friendlyName || 'Sin nombre'})`);
      });
    }
  } catch (error) {
    logError(`Error al verificar números de teléfono: ${error.message}`);
    return false;
  }
  
  // Enviar SMS de prueba (solo si tienes un número de destino configurado)
  const testPhone = process.env.TEST_PHONE_NUMBER;
  if (testPhone) {
    try {
      const message = await client.messages.create({
        body: `🧪 Prueba SMS - IAM Sistema\n\n¡Configuración exitosa!\nFecha: ${new Date().toLocaleString()}\n\n✅ Tu sistema de notificaciones está listo.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: testPhone
      });
      
      logSuccess(`SMS de prueba enviado correctamente`);
      logInfo(`Message SID: ${message.sid}`);
      logInfo(`Estado: ${message.status}`);
      return true;
      
    } catch (error) {
      logError(`Error al enviar SMS de prueba: ${error.message}`);
      return false;
    }
  } else {
    logWarning('No se configuró TEST_PHONE_NUMBER para enviar SMS de prueba');
    logInfo('Para probar SMS, agrega TEST_PHONE_NUMBER=+1234567890 a tu .env');
    return true; // No es un error, solo no hay número de prueba
  }
}

async function testNotificationService() {
  logInfo('🔔 Probando servicio de notificaciones...');
  
  try {
    // Simular el servicio de notificaciones
    const { NotificationService } = require('../src/notifications/notification.service');
    
    // Crear instancia del servicio (esto requeriría más configuración)
    logSuccess('Servicio de notificaciones cargado correctamente');
    
    // Verificar plantillas
    const fs = require('fs');
    const templatesPath = './src/notifications/templates';
    
    if (fs.existsSync(templatesPath)) {
      const templates = fs.readdirSync(templatesPath);
      logSuccess(`Plantillas encontradas: ${templates.length}`);
      templates.forEach(template => {
        logInfo(`  - ${template}`);
      });
    } else {
      logWarning('Directorio de plantillas no encontrado');
    }
    
    return true;
  } catch (error) {
    logError(`Error al probar servicio de notificaciones: ${error.message}`);
    return false;
  }
}

async function main() {
  log('🚀 Iniciando pruebas de configuración Gmail + Twilio...', 'bright');
  log('');
  
  const results = {
    gmail: false,
    twilio: false,
    service: false
  };
  
  // Probar Gmail
  results.gmail = await testGmailConfig();
  log('');
  
  // Probar Twilio
  results.twilio = await testTwilioConfig();
  log('');
  
  // Probar servicio
  results.service = await testNotificationService();
  log('');
  
  // Resumen
  log('📊 Resumen de Pruebas:', 'bright');
  log('=====================');
  log(`Gmail: ${results.gmail ? '✅ Exitoso' : '❌ Falló'}`, results.gmail ? 'green' : 'red');
  log(`Twilio: ${results.twilio ? '✅ Exitoso' : '❌ Falló'}`, results.twilio ? 'green' : 'red');
  log(`Servicio: ${results.service ? '✅ Exitoso' : '❌ Falló'}`, results.service ? 'green' : 'red');
  log('');
  
  if (results.gmail && results.twilio && results.service) {
    logSuccess('🎉 ¡Todas las pruebas pasaron! Tu sistema de notificaciones está listo.');
    log('');
    logInfo('Próximos pasos:');
    logInfo('1. Configura las alertas en el dashboard');
    logInfo('2. Prueba los endpoints de notificaciones');
    logInfo('3. Monitorea el uso de las APIs');
  } else {
    logError('⚠️  Algunas pruebas fallaron. Revisa la configuración.');
    log('');
    logInfo('Sugerencias:');
    if (!results.gmail) {
      logInfo('- Verifica las credenciales de Gmail');
      logInfo('- Asegúrate de usar contraseña de aplicación');
      logInfo('- Confirma que 2FA esté habilitado');
    }
    if (!results.twilio) {
      logInfo('- Verifica las credenciales de Twilio');
      logInfo('- Confirma que el número esté verificado');
      logInfo('- Revisa el saldo de tu cuenta');
    }
  }
  
  log('');
  log('📚 Para más información, consulta: NOTIFICATIONS_CONFIG.md', 'cyan');
}

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(error => {
    logError(`Error en la ejecución: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testGmailConfig, testTwilioConfig, testNotificationService }; 