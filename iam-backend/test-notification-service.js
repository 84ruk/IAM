const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationService() {
  try {
    console.log('🧪 Probando servicio de notificaciones directamente...');
    
    // 1. Verificar configuración de SendGrid
    console.log('\n📧 Verificando configuración de SendGrid:');
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;
    
    if (sendgridApiKey) {
      console.log('  - ✅ SENDGRID_API_KEY configurado');
      console.log(`  - 📧 Longitud: ${sendgridApiKey.length} caracteres`);
    } else {
      console.log('  - ❌ SENDGRID_API_KEY NO configurado');
    }
    
    if (sendgridFromEmail) {
      console.log('  - ✅ SENDGRID_FROM_EMAIL configurado');
      console.log(`  - 📧 Email: ${sendgridFromEmail}`);
    } else {
      console.log('  - ❌ SENDGRID_FROM_EMAIL NO configurado');
    }
    
    // 2. Verificar configuración de Twilio
    console.log('\n📱 Verificando configuración de Twilio:');
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (twilioAccountSid) {
      console.log('  - ✅ TWILIO_ACCOUNT_SID configurado');
    } else {
      console.log('  - ❌ TWILIO_ACCOUNT_SID NO configurado');
    }
    
    if (twilioAuthToken) {
      console.log('  - ✅ TWILIO_AUTH_TOKEN configurado');
    } else {
      console.log('  - ❌ TWILIO_AUTH_TOKEN NO configurado');
    }
    
    if (twilioPhoneNumber) {
      console.log('  - ✅ TWILIO_PHONE_NUMBER configurado');
      console.log(`  - 📱 Número: ${twilioPhoneNumber}`);
    } else {
      console.log('  - ❌ TWILIO_PHONE_NUMBER NO configurado');
    }
    
    // 3. Verificar última alerta para simular notificación
    console.log('\n🚨 Verificando última alerta para simular notificación:');
    const ultimaAlerta = await prisma.alertaHistorial.findFirst({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sensor: {
          select: { nombre: true, tipo: true }
        }
      }
    });
    
    if (ultimaAlerta) {
      console.log(`  - ✅ Alerta encontrada: ${ultimaAlerta.mensaje}`);
      console.log(`  - 📊 Sensor: ${ultimaAlerta.sensor.nombre}`);
      console.log(`  - 🚨 Severidad: ${ultimaAlerta.severidad}`);
      
      // 4. Simular envío de notificación
      console.log('\n📤 Simulando envío de notificación:');
      
      // Simular email
      if (sendgridApiKey && sendgridFromEmail) {
        console.log('  - 📧 EMAIL: Configuración lista para enviar');
        console.log(`    • A: notificaciones@iaminventario.com.mx, baruk066@gmail.com`);
        console.log(`    • Asunto: Alerta: ${ultimaAlerta.severidad} - ${ultimaAlerta.sensor.nombre}`);
        console.log(`    • Mensaje: ${ultimaAlerta.mensaje}`);
      } else {
        console.log('  - ❌ EMAIL: Configuración incompleta');
      }
      
      // Simular SMS
      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        console.log('  - 📱 SMS: Configuración lista para enviar');
        console.log(`    • A: 4441882114`);
        console.log(`    • Mensaje: ${ultimaAlerta.mensaje}`);
      } else {
        console.log('  - ❌ SMS: Configuración incompleta');
      }
      
    } else {
      console.log('  - ❌ No hay alertas recientes para probar');
    }
    
    // 5. Verificar variables de entorno
    console.log('\n🔧 Variables de entorno disponibles:');
    const envVars = [
      'SENDGRID_API_KEY',
      'SENDGRID_FROM_EMAIL',
      'SENDGRID_FROM_NAME',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS'
    ];
    
    envVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`  - ✅ ${varName}: ${varName.includes('KEY') || varName.includes('TOKEN') ? '***' + value.slice(-4) : value}`);
      } else {
        console.log(`  - ❌ ${varName}: NO configurado`);
      }
    });
    
    // 6. Diagnóstico final
    console.log('\n🔍 DIAGNÓSTICO FINAL:');
    
    if (!sendgridApiKey) {
      console.log('  - ❌ PROBLEMA CRÍTICO: SENDGRID_API_KEY no está configurado');
      console.log('  - 🔧 SOLUCIÓN: Configurar la variable de entorno SENDGRID_API_KEY');
    }
    
    if (!sendgridFromEmail) {
      console.log('  - ❌ PROBLEMA: SENDGRID_FROM_EMAIL no está configurado');
      console.log('  - 🔧 SOLUCIÓN: Configurar la variable de entorno SENDGRID_FROM_EMAIL');
    }
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log('  - ❌ PROBLEMA: Configuración de Twilio incompleta');
      console.log('  - 🔧 SOLUCIÓN: Configurar TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_PHONE_NUMBER');
    }
    
    if (sendgridApiKey && sendgridFromEmail) {
      console.log('  - ✅ EMAIL: Configuración lista para funcionar');
    }
    
    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      console.log('  - ✅ SMS: Configuración lista para funcionar');
    }
    
  } catch (error) {
    console.error('❌ Error probando servicio de notificaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationService();

