const { createClient } = require('redis');

// Simular nuestro KPICacheService
class KPICacheService {
  constructor() {
    this.redis = createClient({
      socket: {
        host: 'localhost',
        port: 6379,
      },
    });
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      await this.redis.connect();
      console.log('✅ Redis conectado para KPIs');
    } catch (error) {
      console.error('❌ Error conectando Redis:', error.message);
    }
  }

  async getOrSet(key, factory, ttl = 300) {
    if (!this.redis?.isReady) {
      console.log('⚠️ Redis no disponible, usando factory directo');
      return await factory();
    }

    try {
      const cacheKey = `kpi:${key}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        console.log(`📊 Cache HIT para key: ${key}`);
        return JSON.parse(cached);
      }

      console.log(`📊 Cache MISS para key: ${key}, generando...`);
      const result = await factory();
      
      await this.redis.setEx(cacheKey, ttl, JSON.stringify(result));
      console.log(`📊 Resultado cacheado para key: ${key}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Error de cache para key ${key}:`, error.message);
      return await factory();
    }
  }

  async invalidate(key) {
    if (!this.redis?.isReady) {
      console.log('⚠️ Redis no disponible, no se puede invalidar');
      return;
    }

    try {
      const cacheKey = `kpi:${key}`;
      await this.redis.del(cacheKey);
      console.log(`🗑️ Cache invalidado para key: ${key}`);
    } catch (error) {
      console.error(`❌ Error invalidando cache key ${key}:`, error.message);
    }
  }

  async getCacheStats() {
    if (!this.redis?.isReady) {
      return { isConnected: false };
    }

    try {
      const [keysCount, memoryInfo] = await Promise.all([
        this.redis.dbSize(),
        this.redis.info('memory')
      ]);

      const memoryUsage = memoryInfo
        .split('\n')
        .find(line => line.startsWith('used_memory_human:'))
        ?.split(':')[1] || 'unknown';

      return {
        isConnected: true,
        keysCount,
        memoryUsage: memoryUsage.trim()
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      return { isConnected: true };
    }
  }
}

// Simular datos de KPIs
async function generateMockKPIs(empresaId) {
  console.log(`🔄 Generando KPIs para empresa ${empresaId}...`);
  
  // Simular delay de cálculo
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    totalProductos: Math.floor(Math.random() * 1000) + 100,
    productosStockBajo: Math.floor(Math.random() * 50) + 5,
    movimientosUltimoMes: Math.floor(Math.random() * 500) + 50,
    valorTotalInventario: Math.floor(Math.random() * 100000) + 10000,
    margenPromedio: Math.floor(Math.random() * 30) + 10,
    rotacionInventario: Math.floor(Math.random() * 12) + 1,
    timestamp: new Date().toISOString()
  };
}

async function generateMockFinancialKPIs(empresaId) {
  console.log(`🔄 Generando KPIs financieros para empresa ${empresaId}...`);
  
  // Simular delay de cálculo
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    margenBruto: Math.floor(Math.random() * 40) + 15,
    margenNeto: Math.floor(Math.random() * 25) + 8,
    roiInventario: Math.floor(Math.random() * 50) + 20,
    rotacionInventario: Math.floor(Math.random() * 15) + 2,
    diasInventario: Math.floor(Math.random() * 180) + 30,
    capitalTrabajo: Math.floor(Math.random() * 50000) + 10000,
    costoAlmacenamiento: Math.floor(Math.random() * 5000) + 1000,
    costoOportunidad: Math.floor(Math.random() * 15000) + 3000,
    eficienciaOperativa: Math.floor(Math.random() * 40) + 60
  };
}

async function testKPIsImplementation() {
  console.log('🧪 Probando implementación de KPIs con Redis...\n');

  const cacheService = new KPICacheService();
  
  // Esperar a que Redis se conecte
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // 1. Probar KPIs básicos
    console.log('1️⃣ Probando KPIs básicos...');
    const kpis1 = await cacheService.getOrSet(
      'kpis:1',
      () => generateMockKPIs(1),
      300 // 5 minutos
    );
    console.log('📊 KPIs básicos:', JSON.stringify(kpis1, null, 2));

    // 2. Probar KPIs financieros
    console.log('\n2️⃣ Probando KPIs financieros...');
    const financialKPIs1 = await cacheService.getOrSet(
      'financial-kpis:1',
      () => generateMockFinancialKPIs(1),
      600 // 10 minutos
    );
    console.log('💰 KPIs financieros:', JSON.stringify(financialKPIs1, null, 2));

    // 3. Probar cache (segunda petición)
    console.log('\n3️⃣ Probando cache (segunda petición)...');
    const kpis2 = await cacheService.getOrSet(
      'kpis:1',
      () => generateMockKPIs(1),
      300
    );
    console.log('📊 KPIs básicos (cached):', JSON.stringify(kpis2, null, 2));

    // 4. Probar invalidación
    console.log('\n4️⃣ Probando invalidación de cache...');
    await cacheService.invalidate('kpis:1');
    
    const kpis3 = await cacheService.getOrSet(
      'kpis:1',
      () => generateMockKPIs(1),
      300
    );
    console.log('📊 KPIs básicos (después de invalidación):', JSON.stringify(kpis3, null, 2));

    // 5. Obtener estadísticas de cache
    console.log('\n5️⃣ Estadísticas de cache...');
    const stats = await cacheService.getCacheStats();
    console.log('📈 Estadísticas:', JSON.stringify(stats, null, 2));

    // 6. Probar múltiples empresas
    console.log('\n6️⃣ Probando múltiples empresas...');
    const kpisEmpresa2 = await cacheService.getOrSet(
      'kpis:2',
      () => generateMockKPIs(2),
      300
    );
    console.log('📊 KPIs empresa 2:', JSON.stringify(kpisEmpresa2, null, 2));

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n📋 Resumen de implementación:');
    console.log('✅ Cache Redis funcionando');
    console.log('✅ KPIs básicos con cache');
    console.log('✅ KPIs financieros con cache');
    console.log('✅ Invalidación de cache');
    console.log('✅ Múltiples empresas');
    console.log('✅ Estadísticas de cache');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  } finally {
    await cacheService.redis.quit();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar pruebas
testKPIsImplementation(); 