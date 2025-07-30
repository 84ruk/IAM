// Script de prueba para verificar la paginación de productos
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function testPagination() {
  console.log('🧪 Probando paginación de productos...')
  
  try {
    // Test 1: Obtener primera página
    console.log('\n📄 Test 1: Primera página (limit=12)')
    const response1 = await fetch(`${API_URL}/productos?page=1&limit=12`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response1.ok) {
      throw new Error(`Error ${response1.status}: ${response1.statusText}`)
    }
    
    const data1 = await response1.json()
    console.log(`✅ Productos obtenidos: ${data1.productos.length}`)
    console.log(`✅ Total de productos: ${data1.total}`)
    console.log(`✅ Página actual: ${data1.page}`)
    console.log(`✅ Total de páginas: ${data1.totalPages}`)
    
    // Test 2: Obtener segunda página
    if (data1.totalPages > 1) {
      console.log('\n📄 Test 2: Segunda página (limit=12)')
      const response2 = await fetch(`${API_URL}/productos?page=2&limit=12`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response2.ok) {
        throw new Error(`Error ${response2.status}: ${response2.statusText}`)
      }
      
      const data2 = await response2.json()
      console.log(`✅ Productos obtenidos: ${data2.productos.length}`)
      console.log(`✅ Página actual: ${data2.page}`)
      
      // Verificar que los productos sean diferentes
      const ids1 = data1.productos.map(p => p.id)
      const ids2 = data2.productos.map(p => p.id)
      const hasOverlap = ids1.some(id => ids2.includes(id))
      console.log(`✅ Productos diferentes: ${!hasOverlap}`)
    }
    
    // Test 3: Probar con filtros
    console.log('\n🔍 Test 3: Paginación con filtros')
    const response3 = await fetch(`${API_URL}/productos?page=1&limit=12&estado=ACTIVO`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response3.ok) {
      throw new Error(`Error ${response3.status}: ${response3.statusText}`)
    }
    
    const data3 = await response3.json()
    console.log(`✅ Productos activos obtenidos: ${data3.productos.length}`)
    console.log(`✅ Total de productos activos: ${data3.total}`)
    
    // Test 4: Verificar tipos de producto
    console.log('\n🏷️ Test 4: Verificar tipos de producto')
    const tiposEncontrados = new Set(data1.productos.map(p => p.tipoProducto).filter(Boolean))
    console.log(`✅ Tipos de producto encontrados:`, Array.from(tiposEncontrados))
    
    // Verificar si hay productos con tipo MEDICAMENTO
    const medicamentos = data1.productos.filter(p => p.tipoProducto === 'MEDICAMENTO')
    console.log(`✅ Productos tipo MEDICAMENTO: ${medicamentos.length}`)
    
    console.log('\n🎉 Todos los tests completados exitosamente!')
    
  } catch (error) {
    console.error('❌ Error en los tests:', error.message)
    process.exit(1)
  }
}

// Ejecutar el test
testPagination() 