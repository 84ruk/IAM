const fetch = require('node-fetch');

async function testSetupEndpoint() {
  try {
    console.log('🧪 Probando endpoint de setup...');
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/auth/needs-setup`;
    
    console.log('📡 URL:', url);
    
    // Probar sin token
    console.log('\n1️⃣ Probando sin token...');
    const response1 = await fetch(url);
    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', data1);
    
    // Probar con token inválido
    console.log('\n2️⃣ Probando con token inválido...');
    const response2 = await fetch(url, {
      headers: {
        'Cookie': 'jwt=invalid-token',
        'Content-Type': 'application/json',
      },
    });
    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', data2);
    
    // Probar con Authorization header
    console.log('\n3️⃣ Probando con Authorization header...');
    const response3 = await fetch(url, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
    });
    const data3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', data3);
    
  } catch (error) {
    console.error('❌ Error probando endpoint:', error);
  }
}

testSetupEndpoint();
