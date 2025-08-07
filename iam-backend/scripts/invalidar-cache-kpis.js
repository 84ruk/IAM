const axios = require('axios');

// Configuración
const API_BASE_URL = 'http://localhost:3001';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTQ1MTgxMjEsImp0aSI6ImFmZTFkYzZmLTQ4ZWQtNDM5Yy1hZWVhLWYwOTM1MjU5YzgzNSIsInN1YiI6IjEiLCJlbWFpbCI6ImJhcnVrMDY2QGdtYWlsLmNvbSIsInJvbCI6IkFETUlOIiwiZW1wcmVzYUlkIjoyLCJ0aXBvSW5kdXN0cmlhIjoiR0VORVJJQ0EiLCJhdXRoUHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3NTQ2MDQ1MjEsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSJ9.aWsrVr77BeWyujJH-xXQoG0bsuYQRqWzIJjOImUTMhc';

async function invalidarCacheKPIs() {
  console.log('🔄 INVALIDANDO CACHE DE KPIs');
  console.log('============================\n');

  try {
    // Configurar axios para usar cookies
    const axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `jwt=${JWT_TOKEN}`
      }
    });

    // 1. Invalidar cache de KPIs básicos
    console.log('1. Invalidando cache de KPIs básicos...');
    const kpisResponse = await axiosInstance.get('/dashboard-cqrs/kpis?forceRefresh=true');
    
    console.log('✅ KPIs básicos actualizados:');
    console.log('   Total Productos:', kpisResponse.data.totalProductos);
    console.log('   Productos Stock Bajo:', kpisResponse.data.productosStockBajo);
    console.log('   Movimientos Último Mes:', kpisResponse.data.movimientosUltimoMes);
    console.log('   Valor Total Inventario:', kpisResponse.data.valorTotalInventario);
    console.log('   Margen Promedio:', kpisResponse.data.margenPromedio);
    console.log('   Rotación Inventario:', kpisResponse.data.rotacionInventario);

    // 2. Invalidar cache de KPIs financieros
    console.log('\n2. Invalidando cache de KPIs financieros...');
    const financialResponse = await axiosInstance.get('/dashboard-cqrs/financial-kpis?forceRefresh=true');
    
    console.log('✅ KPIs financieros actualizados:');
    console.log('   Margen Bruto:', financialResponse.data.margenBruto + '%');
    console.log('   Margen Neto:', financialResponse.data.margenNeto + '%');
    console.log('   ROI Inventario:', financialResponse.data.roiInventario + '%');
    console.log('   Eficiencia Operativa:', financialResponse.data.eficienciaOperativa + '%');

    // 3. Invalidar cache de endpoint unificado
    console.log('\n3. Invalidando cache de endpoint unificado...');
    const allKPIsResponse = await axiosInstance.get('/dashboard-cqrs/all-kpis?forceRefresh=true');
    
    console.log('✅ Todos los KPIs actualizados:');
    console.log('   KPIs básicos:', allKPIsResponse.data.data.kpis);
    console.log('   KPIs financieros:', allKPIsResponse.data.data.financialKpis);

    // 4. Invalidar cache de movimientos diarios
    console.log('\n4. Invalidando cache de movimientos diarios...');
    const movementsResponse = await axiosInstance.get('/dashboard-cqrs/daily-movements?forceRefresh=true');
    
    console.log('✅ Movimientos diarios actualizados:');
    console.log('   Valor Total Inventario:', movementsResponse.data.summary.valorTotalInventario);
    console.log('   Margen Bruto Promedio:', movementsResponse.data.summary.margenBrutoPromedio + '%');

    console.log('\n🎉 Cache invalidado exitosamente');

  } catch (error) {
    console.error('❌ Error invalidando cache:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

invalidarCacheKPIs(); 