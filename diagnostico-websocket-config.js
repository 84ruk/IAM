const http = require('http');
const https = require('https');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function checkBackendHealth() {
  console.log('🔍 Verificando salud del backend...');
  
  return new Promise((resolve) => {
    const url = new URL('/health', BACKEND_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`✅ Backend saludable: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ Backend no disponible: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Timeout conectando al backend');
      req.destroy();
      resolve(false);
    });
  });
}

async function checkAuthEndpoint() {
  console.log('🔍 Verificando endpoint de autenticación...');
  
  return new Promise((resolve) => {
    const url = new URL('/auth/me', BACKEND_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`✅ Endpoint de auth disponible: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ Endpoint de auth no disponible: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Timeout en endpoint de auth');
      req.destroy();
      resolve(false);
    });
  });
}

async function checkWebSocketEndpoint() {
  console.log('🔍 Verificando endpoint de WebSocket...');
  
  return new Promise((resolve) => {
    const url = new URL('/importacion', BACKEND_URL.replace('http', 'ws'));
    const client = require('ws');
    
    try {
      const ws = new client(url.toString());
      
      ws.on('open', () => {
        console.log('✅ WebSocket endpoint disponible');
        ws.close();
        resolve(true);
      });
      
      ws.on('error', (err) => {
        console.log(`❌ WebSocket endpoint no disponible: ${err.message}`);
        resolve(false);
      });
      
      ws.on('close', () => {
        console.log('🔌 WebSocket cerrado');
      });
      
      setTimeout(() => {
        console.log('❌ Timeout en WebSocket');
        ws.close();
        resolve(false);
      }, 5000);
      
    } catch (error) {
      console.log(`❌ Error conectando WebSocket: ${error.message}`);
      resolve(false);
    }
  });
}

async function checkEnvironmentVariables() {
  console.log('🔍 Verificando variables de entorno...');
  
  const requiredVars = [
    'JWT_SECRET',
    'JWT_ISSUER', 
    'JWT_AUDIENCE',
    'FRONTEND_URL',
    'BACKEND_URL'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(`❌ Variables de entorno faltantes: ${missingVars.join(', ')}`);
    return false;
  } else {
    console.log('✅ Todas las variables de entorno están configuradas');
    return true;
  }
}

async function checkPorts() {
  console.log('🔍 Verificando puertos...');
  
  const ports = [
    { port: 3000, service: 'Frontend' },
    { port: 3001, service: 'Backend' }
  ];
  
  for (const { port, service } of ports) {
    const isOpen = await new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      
      socket.setTimeout(2000);
      
      socket.on('connect', () => {
        console.log(`✅ Puerto ${port} (${service}) está abierto`);
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        console.log(`❌ Puerto ${port} (${service}) no está disponible`);
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        console.log(`❌ Puerto ${port} (${service}) no está disponible`);
        socket.destroy();
        resolve(false);
      });
      
      socket.connect(port, 'localhost');
    });
    
    if (!isOpen) {
      return false;
    }
  }
  
  return true;
}

async function runDiagnostic() {
  console.log('🚀 Iniciando diagnóstico de WebSocket...\n');
  
  const results = {
    backendHealth: await checkBackendHealth(),
    authEndpoint: await checkAuthEndpoint(),
    websocketEndpoint: await checkWebSocketEndpoint(),
    environmentVars: await checkEnvironmentVariables(),
    ports: await checkPorts()
  };
  
  console.log('\n📊 Resumen del diagnóstico:');
  console.log('========================');
  
  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}: ${result ? 'OK' : 'FALLO'}`);
  }
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 Todos los tests pasaron. El WebSocket debería funcionar correctamente.');
  } else {
    console.log('\n⚠️ Algunos tests fallaron. Revisa la configuración antes de continuar.');
  }
  
  return allPassed;
}

// Ejecutar diagnóstico si se llama directamente
if (require.main === module) {
  runDiagnostic().catch(console.error);
}

module.exports = { runDiagnostic }; 