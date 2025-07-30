const fetch = require('node-fetch');

async function testProductosAPI() {
  try {
    console.log('Probando API de productos...');
    
    // Probar sin filtros (debería mostrar todos los productos)
    const response1 = await fetch('http://localhost:3001/productos?page=1&limit=50', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response1.ok) {
      console.error('Error en la respuesta:', response1.status, response1.statusText);
      return;
    }
    
    const data1 = await response1.json();
    console.log('Sin filtros:');
    console.log('- Total de productos:', data1.total);
    console.log('- Productos en esta página:', data1.productos.length);
    console.log('- Límite:', data1.limit);
    console.log('- Página:', data1.page);
    console.log('- Total de páginas:', data1.totalPages);
    
    // Probar con filtro de estado ACTIVO
    const response2 = await fetch('http://localhost:3001/productos?page=1&limit=50&estado=ACTIVO', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data2 = await response2.json();
    console.log('\nCon filtro ACTIVO:');
    console.log('- Total de productos activos:', data2.total);
    console.log('- Productos en esta página:', data2.productos.length);
    
    // Probar con filtro de estado INACTIVO
    const response3 = await fetch('http://localhost:3001/productos?page=1&limit=50&estado=INACTIVO', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data3 = await response3.json();
    console.log('\nCon filtro INACTIVO:');
    console.log('- Total de productos inactivos:', data3.total);
    console.log('- Productos en esta página:', data3.productos.length);
    
    console.log('\nResumen:');
    console.log('- Total general:', data1.total);
    console.log('- Activos:', data2.total);
    console.log('- Inactivos:', data3.total);
    console.log('- Verificación:', data2.total + data3.total === data1.total ? '✅ Correcto' : '❌ Incorrecto');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProductosAPI(); 