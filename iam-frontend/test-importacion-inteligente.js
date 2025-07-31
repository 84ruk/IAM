/**
 * Script de prueba para verificar la importación inteligente
 * Ejecutar con: node test-importacion-inteligente.js
 */

const fs = require('fs');
const path = require('path');

// Simular datos de prueba
const testData = {
  productos: [
    ['nombre', 'stock', 'precio', 'categoria'],
    ['Laptop HP', '10', '1200', 'Electrónicos'],
    ['Mouse Logitech', '50', '25', 'Accesorios'],
    ['Teclado Mecánico', '30', '150', 'Accesorios']
  ],
  proveedores: [
    ['nombre', 'email', 'telefono', 'direccion'],
    ['Distribuidora ABC', 'contacto@abc.com', '555-1234', 'CDMX'],
    ['Electrónicos XYZ', 'ventas@xyz.com', '555-5678', 'Guadalajara']
  ],
  movimientos: [
    ['producto', 'tipo', 'cantidad', 'fecha'],
    ['Laptop HP', 'entrada', '5', '2024-01-15'],
    ['Mouse Logitech', 'salida', '10', '2024-01-16']
  ]
};

// Función para crear archivo de prueba
function crearArchivoPrueba(tipo, datos) {
  const nombreArchivo = `test-${tipo}-${Date.now()}.csv`;
  const contenido = datos.map(fila => fila.join(',')).join('\n');
  
  fs.writeFileSync(nombreArchivo, contenido);
  console.log(`✅ Archivo de prueba creado: ${nombreArchivo}`);
  return nombreArchivo;
}

// Función para simular detección automática
function simularDeteccionAutomatica(columnas) {
  const patrones = {
    productos: ['nombre', 'stock', 'precio', 'categoria'],
    proveedores: ['nombre', 'email', 'telefono', 'direccion'],
    movimientos: ['producto', 'tipo', 'cantidad', 'fecha']
  };
  
  let mejorCoincidencia = { tipo: null, confianza: 0 };
  
  Object.entries(patrones).forEach(([tipo, patron]) => {
    const coincidencias = columnas.filter(col => 
      patron.some(p => col.toLowerCase().includes(p.toLowerCase()))
    );
    const confianza = (coincidencias.length / patron.length) * 100;
    
    if (confianza > mejorCoincidencia.confianza) {
      mejorCoincidencia = { tipo, confianza };
    }
  });
  
  return mejorCoincidencia;
}

// Función principal de prueba
function ejecutarPruebas() {
  console.log('🧪 Iniciando pruebas de importación inteligente...\n');
  
  Object.entries(testData).forEach(([tipo, datos]) => {
    console.log(`📋 Probando detección para: ${tipo}`);
    
    const columnas = datos[0];
    const deteccion = simularDeteccionAutomatica(columnas);
    
    console.log(`   Columnas: ${columnas.join(', ')}`);
    console.log(`   Tipo detectado: ${deteccion.tipo}`);
    console.log(`   Confianza: ${deteccion.confianza.toFixed(1)}%`);
    console.log(`   ✅ Coincidencia: ${deteccion.tipo === tipo ? 'CORRECTA' : 'INCORRECTA'}`);
    console.log('');
    
    // Crear archivo de prueba
    const archivo = crearArchivoPrueba(tipo, datos);
    
    // Limpiar archivo después de la prueba
    setTimeout(() => {
      if (fs.existsSync(archivo)) {
        fs.unlinkSync(archivo);
        console.log(`🗑️ Archivo de prueba eliminado: ${archivo}`);
      }
    }, 1000);
  });
  
  console.log('🎉 Pruebas completadas. Verifica que:');
  console.log('   1. La detección automática funcione correctamente');
  console.log('   2. No se reporten discrepancias falsas');
  console.log('   3. La importación se complete exitosamente');
  console.log('   4. Se muestre la información de detección en la UI');
}

// Ejecutar pruebas
if (require.main === module) {
  ejecutarPruebas();
}

module.exports = {
  testData,
  simularDeteccionAutomatica,
  crearArchivoPrueba
}; 