// Script para debuggear los filtros de estado
console.log('🔍 Debug de filtros de estado');

// Simular los valores que deberían enviarse
const filtros = [
  { estado: '', descripcion: 'Todos los estados' },
  { estado: 'ACTIVO', descripcion: 'Solo activos' },
  { estado: 'INACTIVO', descripcion: 'Solo inactivos' }
];

filtros.forEach(filtro => {
  const params = new URLSearchParams();
  if (filtro.estado) {
    params.set('estado', filtro.estado);
  }
  params.set('page', '1');
  params.set('limit', '50');
  
  const url = `/productos${params.toString() ? `?${params.toString()}` : ''}`;
  console.log(`\n${filtro.descripcion}:`);
  console.log('- Estado:', filtro.estado || '(vacío)');
  console.log('- URL:', url);
  console.log('- Parámetros:', params.toString());
});

console.log('\n📝 Instrucciones para probar:');
console.log('1. Abre la consola del navegador (F12)');
console.log('2. Ve a la página de productos');
console.log('3. Cambia el filtro de estado a "Inactivos"');
console.log('4. Revisa los logs en la consola');
console.log('5. Verifica que la URL incluya "estado=INACTIVO"'); 