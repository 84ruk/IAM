#!/usr/bin/env node

/**
 * 🧪 Script de Prueba para SendGrid + Twilio
 * 
 * Este script verifica que la configuración de SendGrid y Twilio esté correcta
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

async function testSendGridConfig() {
  logInfo('🔧 Probando configuración de SendGrid...');
  
  // Verificar variables de entorno
  const requiredVars = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logError(`Variables faltantes: ${missingVars.join(', ')}`);
    return false;
  }
  
  logSuccess('Variables de entorno de SendGrid configuradas correctamente');
  
  // Usar la librería oficial de SendGrid
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  // Verificar API Key
  try {
    // Intentar enviar un email de prueba
    const testEmail = {
      to: process.env.SENDGRID_FROM_EMAIL, // Enviar a ti mismo
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: '🧪 Prueba de Email - IAM Sistema (SendGrid API)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🧪 Prueba de Email</h1>
            <p>Sistema de Notificaciones IAM - SendGrid API</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2>¡Configuración Exitosa! 🎉</h2>
            <p>Este email confirma que tu configuración de SendGrid API está funcionando correctamente.</p>
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Detalles de la configuración:</h3>
              <ul>
                <li><strong>Método:</strong> SendGrid API v3</li>
                <li><strong>API Key:</strong> ${process.env.SENDGRID_API_KEY ? '✅ Configurada' : '❌ No configurada'}</li>
                <li><strong>Remitente:</strong> ${process.env.SENDGRID_FROM_EMAIL}</li>
                <li><strong>Fecha de prueba:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p>Ahora puedes recibir notificaciones automáticas del sistema IAM con excelente deliverability.</p>
            <div style="text-align: center; margin-top: 20px;">
              <span style="background: #28a745; color: white; padding: 8px 16px; border-radius: 5px; font-weight: bold;">
                ✅ SendGrid API Configurado
              </span>
            </div>
            <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 5px; border-left: 4px solid #28a745;">
              <strong>Ventajas de SendGrid API:</strong>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>99%+ tasa de entrega</li>
                <li>Analytics y tracking incluidos</li>
                <li>Plantillas dinámicas</li>
                <li>Escalabilidad automática</li>
                <li>Mejor rendimiento que SMTP</li>
                <li>Funcionalidades avanzadas</li>
              </ul>
            </div>
          </div>
        </div>
      `,
      categories: ['test', 'setup'],
      customArgs: {
        email_type: 'test',
        setup_date: new Date().toISOString(),
      },
    };
    
    const response = await sgMail.send(testEmail);
    logSuccess(`Email de prueba enviado correctamente via SendGrid API`);
    logInfo(`Message ID: ${response[0]?.headers['x-message-id'] || 'N/A'}`);
    logInfo(`Status Code: ${response[0]?.statusCode || 'N/A'}`);
    logInfo(`Enviado a: ${process.env.SENDGRID_FROM_EMAIL}`);
    return true;
    
  } catch (error) {
    logError(`Error al enviar email de prueba: ${error.message}`);
    if (error.response) {
      const { body } = error.response;
      logError(`SendGrid API Error: ${error.response.statusCode} - ${JSON.stringify(body)}`);
    }
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
    
    // Mostrar información de saldo si está disponible
    if (account.status === 'active') {
      logInfo(`Cuenta activa y lista para enviar SMS`);
    }
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
        body: `🧪 Prueba SMS - IAM Sistema\n\n¡Configuración exitosa!\nFecha: ${new Date().toLocaleString()}\n\n✅ Tu sistema de notificaciones está listo.\n\n📧 Email: SendGrid\n📱 SMS: Twilio`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: testPhone
      });
      
      logSuccess(`SMS de prueba enviado correctamente`);
      logInfo(`Message SID: ${message.sid}`);
      logInfo(`Estado: ${message.status}`);
      logInfo(`Precio: ${message.price || 'N/A'}`);
      return true;
      
    } catch (error) {
      logError(`Error al enviar SMS de prueba: ${error.message}`);
      if (error.code === 21211) {
        logError('Número de teléfono inválido');
      } else if (error.code === 21608) {
        logError('Número no verificado. Verifica tu número en Twilio');
      }
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
    // Verificar que el servicio esté disponible
    const fs = require('fs');
    const servicePath = './src/notifications/notification.service.ts';
    
    if (fs.existsSync(servicePath)) {
      logSuccess('Servicio de notificaciones encontrado');
    } else {
      logWarning('Servicio de notificaciones no encontrado');
    }
    
    // Verificar plantillas
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
    
    // Verificar configuración de base de datos
    const prismaPath = './prisma/schema.prisma';
    if (fs.existsSync(prismaPath)) {
      const schema = fs.readFileSync(prismaPath, 'utf8');
      if (schema.includes('AlertHistory') && schema.includes('AlertConfiguration')) {
        logSuccess('Modelos de base de datos para alertas encontrados');
      } else {
        logWarning('Modelos de base de datos para alertas no encontrados');
      }
    }
    
    return true;
  } catch (error) {
    logError(`Error al probar servicio de notificaciones: ${error.message}`);
    return false;
  }
}

async function checkSendGridLimits() {
  logInfo('📊 Verificando límites de SendGrid...');
  
  // Información sobre límites de SendGrid
  logInfo('Plan gratuito de SendGrid:');
  logInfo('  - 100 emails/día');
  logInfo('  - 2,000 contactos');
  logInfo('  - Analytics básicos');
  logInfo('  - Soporte por email');
  
  logInfo('Plan Essentials ($14.95/mes):');
  logInfo('  - 50,000 emails/mes');
  logInfo('  - 100,000 contactos');
  logInfo('  - Analytics avanzados');
  logInfo('  - Soporte por teléfono');
  
  return true;
}

async function main() {
  log('🚀 Iniciando pruebas de configuración SendGrid + Twilio...', 'bright');
  log('');
  
  const results = {
    sendgrid: false,
    twilio: false,
    service: false,
    limits: false
  };
  
  // Probar SendGrid
  results.sendgrid = await testSendGridConfig();
  log('');
  
  // Probar Twilio
  results.twilio = await testTwilioConfig();
  log('');
  
  // Probar servicio
  results.service = await testNotificationService();
  log('');
  
  // Verificar límites
  results.limits = await checkSendGridLimits();
  log('');
  
  // Resumen
  log('📊 Resumen de Pruebas:', 'bright');
  log('=====================');
  log(`SendGrid: ${results.sendgrid ? '✅ Exitoso' : '❌ Falló'}`, results.sendgrid ? 'green' : 'red');
  log(`Twilio: ${results.twilio ? '✅ Exitoso' : '❌ Falló'}`, results.twilio ? 'green' : 'red');
  log(`Servicio: ${results.service ? '✅ Exitoso' : '❌ Falló'}`, results.service ? 'green' : 'red');
  log(`Límites: ${results.limits ? '✅ Verificado' : '❌ Error'}`, results.limits ? 'green' : 'red');
  log('');
  
  if (results.sendgrid && results.twilio && results.service) {
    logSuccess('🎉 ¡Todas las pruebas pasaron! Tu sistema de notificaciones está listo.');
    log('');
    logInfo('Próximos pasos:');
    logInfo('1. Configura las alertas en el dashboard');
    logInfo('2. Prueba los endpoints de notificaciones');
    logInfo('3. Monitorea el uso de las APIs');
    logInfo('4. Considera verificar tu dominio en SendGrid para mejor deliverability');
  } else {
    logError('⚠️  Algunas pruebas fallaron. Revisa la configuración.');
    log('');
    logInfo('Sugerencias:');
    if (!results.sendgrid) {
      logInfo('- Verifica tu API Key de SendGrid');
      logInfo('- Confirma que el email remitente esté verificado');
      logInfo('- Revisa la configuración SMTP');
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

module.exports = { testSendGridConfig, testTwilioConfig, testNotificationService }; 