const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProductTypes() {
  console.log('🔍 Verificando tipos de producto en la base de datos...')
  
  try {
    // Obtener todos los productos
    const productos = await prisma.producto.findMany({
      select: {
        id: true,
        nombre: true,
        tipoProducto: true,
        empresaId: true
      }
    })
    
    console.log(`📊 Total de productos encontrados: ${productos.length}`)
    
    // Contar tipos de producto
    const tiposCount = {}
    const tiposInvalidos = []
    
    productos.forEach(producto => {
      const tipo = producto.tipoProducto
      tiposCount[tipo] = (tiposCount[tipo] || 0) + 1
      
      // Verificar si el tipo es válido según el enum
      const tiposValidos = [
        'GENERICO', 'ROPA', 'ALIMENTO', 'ELECTRONICO', 
        'MEDICAMENTO', 'SUPLEMENTO', 'EQUIPO_MEDICO', 
        'CUIDADO_PERSONAL', 'BIOLOGICO', 'MATERIAL_QUIRURGICO',
        'SOFTWARE', 'HARDWARE'
      ]
      
      if (!tiposValidos.includes(tipo)) {
        tiposInvalidos.push({
          id: producto.id,
          nombre: producto.nombre,
          tipoProducto: tipo
        })
      }
    })
    
    console.log('\n📈 Distribución de tipos de producto:')
    Object.entries(tiposCount).forEach(([tipo, count]) => {
      console.log(`  ${tipo}: ${count} productos`)
    })
    
    if (tiposInvalidos.length > 0) {
      console.log('\n❌ Tipos de producto inválidos encontrados:')
      tiposInvalidos.forEach(producto => {
        console.log(`  - ID: ${producto.id}, Nombre: ${producto.nombre}, Tipo: ${producto.tipoProducto}`)
      })
    } else {
      console.log('\n✅ Todos los tipos de producto son válidos')
    }
    
    // Verificar productos con tipo MEDICAMENTO
    const medicamentos = productos.filter(p => p.tipoProducto === 'MEDICAMENTO')
    console.log(`\n💊 Productos tipo MEDICAMENTO: ${medicamentos.length}`)
    
    if (medicamentos.length > 0) {
      console.log('  Ejemplos:')
      medicamentos.slice(0, 5).forEach(med => {
        console.log(`    - ${med.nombre} (ID: ${med.id})`)
      })
    }
    
    console.log('\n🎉 Verificación completada')
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProductTypes() 