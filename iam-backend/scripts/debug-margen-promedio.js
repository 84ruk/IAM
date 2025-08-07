const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMargenPromedio() {
  try {
    console.log('🔍 Debuggeando cálculo de margen promedio...');
    
    const empresaId = 2;
    
    // Replicar la consulta corregida
    console.log('\n📊 Ejecutando consulta corregida...');
    const result = await prisma.$queryRaw`
      SELECT COALESCE(
        AVG(
          CASE 
            WHEN p."precioCompra" > 0 THEN 
              ((p."precioVenta" - p."precioCompra") / p."precioCompra") * 100
            ELSE 0 
          END
        ), 0
      ) as margen
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
        AND p."precioCompra" > 0
    `;
    
    console.log('Resultado margen corregido:', result[0]);
    
    // Consulta anterior (incorrecta) para comparar
    console.log('\n📊 Ejecutando consulta antigua (incorrecta)...');
    const resultAntiguo = await prisma.$queryRaw`
      SELECT COALESCE(AVG(p."precioVenta" - p."precioCompra"), 0) as margen
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
        AND p."precioCompra" > 0
    `;
    
    console.log('Resultado margen antiguo:', resultAntiguo[0]);
    
    // Detalles por producto
    console.log('\n📋 Detalles por producto:');
    const productos = await prisma.$queryRaw`
      SELECT 
        p.nombre,
        p."precioCompra",
        p."precioVenta",
        p."precioVenta" - p."precioCompra" as diferencia_absoluta,
        CASE 
          WHEN p."precioCompra" > 0 THEN 
            ((p."precioVenta" - p."precioCompra") / p."precioCompra") * 100
          ELSE 0 
        END as margen_porcentual
      FROM "Producto" p
      WHERE p."empresaId" = ${empresaId}
        AND p.estado = 'ACTIVO'
        AND p."precioCompra" > 0
      ORDER BY p.nombre
    `;
    
    productos.forEach(producto => {
      console.log(`- ${producto.nombre}:`);
      console.log(`  Compra: $${producto.precioCompra}, Venta: $${producto.precioVenta}`);
      console.log(`  Diferencia: $${Number(producto.diferencia_absoluta).toFixed(2)}`);
      console.log(`  Margen: ${Number(producto.margen_porcentual).toFixed(2)}%`);
      console.log('');
    });
    
    const margenPromedio = Number(result[0].margen);
    console.log(`🎯 Margen promedio correcto: ${margenPromedio.toFixed(2)}%`);
    
    if (margenPromedio > 100) {
      console.log('⚠️  ADVERTENCIA: El margen sigue siendo >100%. Revisar datos de productos.');
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar debug
if (require.main === module) {
  debugMargenPromedio()
    .then(() => {
      console.log('\n✅ Debug completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando debug:', error);
      process.exit(1);
    });
}

module.exports = { debugMargenPromedio };
