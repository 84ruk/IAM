/**
 * Script para probar la visualización de errores en importación
 * Ejecutar con: node test-errores-importacion.js
 */

// Simular respuesta del backend con errores
const mockResponseWithErrors = {
  success: false,
  data: {
    registrosProcesados: 2,
    registrosExitosos: 0,
    registrosConError: 2,
    errores: [
      {
        fila: 2,
        columna: 'productoid',
        valor: '123',
        mensaje: 'El producto con ID 123 no existe en la base de datos',
        tipo: 'validacion',
        sugerencia: 'Verificar que el producto existe antes de crear el movimiento',
        valorEsperado: 'ID de producto válido',
        valorRecibido: '123'
      },
      {
        fila: 3,
        columna: 'cantidad',
        valor: '-5',
        mensaje: 'La cantidad no puede ser negativa',
        tipo: 'validacion',
        sugerencia: 'Usar valores positivos para la cantidad',
        valorEsperado: 'Número positivo',
        valorRecibido: '-5'
      }
    ],
    archivoErrores: 'errores-test-123.xlsx',
    processingTime: 1500,
    mode: 'http',
    usuarioId: 1,
    empresaId: 1
  },
  message: 'Importación falló: 2 errores encontrados',
  hasErrors: true,
  errorCount: 2,
  successCount: 0,
  errorFile: 'errores-test-123.xlsx',
  tipoDetectado: 'movimientos',
  tipoUsado: 'movimientos',
  confianzaDetectada: 74,
  mensajeDeteccion: 'Tipo detectado automáticamente: movimientos (confianza: 74%)',
  errores: [
    {
      fila: 2,
      columna: 'productoid',
      valor: '123',
      mensaje: 'El producto con ID 123 no existe en la base de datos',
      tipo: 'validacion',
      sugerencia: 'Verificar que el producto existe antes de crear el movimiento',
      valorEsperado: 'ID de producto válido',
      valorRecibido: '123'
    },
    {
      fila: 3,
      columna: 'cantidad',
      valor: '-5',
      mensaje: 'La cantidad no puede ser negativa',
      tipo: 'validacion',
      sugerencia: 'Usar valores positivos para la cantidad',
      valorEsperado: 'Número positivo',
      valorRecibido: '-5'
    }
  ],
  registrosProcesados: 2,
  registrosExitosos: 0,
  registrosConError: 2
};

// Función para simular la lógica del frontend
function simularLogicaFrontend(resultado) {
  console.log('🧪 Simulando lógica del frontend...\n');
  
  console.log('📊 Datos recibidos:');
  console.log(`   - Success: ${resultado.success}`);
  console.log(`   - Has Errors: ${resultado.hasErrors}`);
  console.log(`   - Error Count: ${resultado.errorCount}`);
  console.log(`   - Registros Procesados: ${resultado.registrosProcesados}`);
  console.log(`   - Registros Exitosos: ${resultado.registrosExitosos}`);
  console.log(`   - Registros Con Error: ${resultado.registrosConError}`);
  console.log(`   - Errores Array: ${Array.isArray(resultado.errores) ? resultado.errores.length : 'No es array'}`);
  console.log(`   - Tipo de errores: ${typeof resultado.errores}`);
  
  console.log('\n🔍 Condiciones de visualización:');
  
  // Condición 1: Mostrar errores detallados
  const condicion1 = (Array.isArray(resultado.errores) && resultado.errores.length > 0) || 
                     (resultado.registrosConError > 0) || 
                     (resultado.hasErrors);
  console.log(`   1. Mostrar errores detallados: ${condicion1}`);
  
  // Condición 2: Mostrar éxito
  const condicion2 = resultado.registrosExitosos > 0;
  console.log(`   2. Mostrar éxito: ${condicion2}`);
  
  // Condición 3: Mostrar error general
  const condicion3 = resultado.registrosExitosos === 0;
  console.log(`   3. Mostrar error general: ${condicion3}`);
  
  console.log('\n📋 Errores encontrados:');
  if (Array.isArray(resultado.errores)) {
    resultado.errores.forEach((error, index) => {
      console.log(`   ${index + 1}. Fila ${error.fila}, Columna ${error.columna}: ${error.mensaje}`);
    });
  } else {
    console.log('   ❌ No se encontraron errores en formato array');
  }
  
  console.log('\n🎯 Resultado esperado:');
  if (condicion1) {
    console.log('   ✅ Se deberían mostrar los errores detallados');
  }
  if (condicion2) {
    console.log('   ✅ Se debería mostrar mensaje de éxito');
  }
  if (condicion3) {
    console.log('   ✅ Se debería mostrar mensaje de error general');
  }
  
  return {
    mostrarErroresDetallados: condicion1,
    mostrarExito: condicion2,
    mostrarErrorGeneral: condicion3
  };
}

// Ejecutar prueba
console.log('🚀 Iniciando prueba de visualización de errores...\n');
const resultado = simularLogicaFrontend(mockResponseWithErrors);

console.log('\n📝 Resumen:');
console.log(`   - Errores detallados: ${resultado.mostrarErroresDetallados ? '✅ SÍ' : '❌ NO'}`);
console.log(`   - Mensaje de éxito: ${resultado.mostrarExito ? '✅ SÍ' : '❌ NO'}`);
console.log(`   - Mensaje de error: ${resultado.mostrarErrorGeneral ? '✅ SÍ' : '❌ NO'}`);

console.log('\n💡 Para probar en el navegador:');
console.log('   1. Abrir las herramientas de desarrollador (F12)');
console.log('   2. Ir a la pestaña Console');
console.log('   3. Realizar una importación con errores');
console.log('   4. Verificar que aparezcan los logs con 🔍');
console.log('   5. Verificar que se muestren los errores en pantalla');

module.exports = {
  mockResponseWithErrors,
  simularLogicaFrontend
}; 