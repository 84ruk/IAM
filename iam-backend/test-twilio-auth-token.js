#!/usr/bin/env node

require('dotenv').config();
const { Twilio } = require('twilio');

async function testTwilioAuthToken() {
  console.log('🔍 Probando Twilio con Auth Token...\n');
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  
  console.log('📋 Variables:');
  console.log(`  Account SID: ${accountSid}`);
  console.log(`  Auth Token: ${authToken ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`  Phone Number: ${from}`);
  
  if (!accountSid || !authToken) {
    console.log('\n❌ Faltan credenciales');
    return;
  }
  
  try {
    console.log('\n🚀 Inicializando con Auth Token...');
    const client = new Twilio(accountSid, authToken);
    
    console.log('✅ Cliente inicializado');
    
    console.log('\n📊 Verificando cuenta...');
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`  Nombre: ${account.friendlyName}`);
    console.log(`  Estado: ${account.status}`);
    
    console.log('\n📱 Verificando números...');
    const numbers = await client.incomingPhoneNumbers.list({ limit: 5 });
    console.log(`  Números encontrados: ${numbers.length}`);
    
    if (numbers.length > 0) {
      numbers.forEach((num, i) => {
        console.log(`    ${i + 1}. ${num.phoneNumber}`);
      });
    }
    
    console.log('\n✅ Prueba exitosa con Auth Token!');
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log(`  Código: ${error.code || 'N/A'}`);
  }
}

testTwilioAuthToken().catch(console.error);
