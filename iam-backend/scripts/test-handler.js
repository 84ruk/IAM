const { PrismaClient } = require('@prisma/client');
const { GetDailyMovementsHandler } = require('../src/dashboard/handlers/get-daily-movements.handler');
const { GetDailyMovementsQuery } = require('../src/dashboard/queries/get-daily-movements.query');
const { KPICacheService } = require('../src/common/services/kpi-cache.service');
const { KPIErrorHandler } = require('../src/common/services/kpi-error-handler.service');

async function testHandler() {
  console.log('🧪 Probando handler de daily-movements directamente...\n');

  try {
    const prisma = new PrismaClient();
    const cacheService = new KPICacheService();
    const errorHandler = new KPIErrorHandler();
    
    const handler = new GetDailyMovementsHandler(prisma, cacheService, errorHandler);
    
    const query = new GetDailyMovementsQuery(8, 'ADMIN', 7, true);
    
    console.log('Query creada:', {
      empresaId: query.empresaId,
      userRole: query.userRole,
      days: query.days,
      forceRefresh: query.forceRefresh
    });
    
    const result = await handler.execute(query);
    
    console.log('✅ Resultado del handler:');
    console.log(JSON.stringify(result, null, 2));
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testHandler();
}

module.exports = { testHandler }; 