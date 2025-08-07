const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPreciosProductos() {
  try {
    console.log('🔧 Iniciando corrección de precios de productos...');
    
    // Obtener todos los productos activos con precios iguales
    const productos = await prisma.producto.findMany({
      where: {
        estado: 'ACTIVO',
        // Productos donde precio de venta = precio de compra
        precioVenta: {
          equals: prisma.producto.fields.precioCompra
        }
      },
      select: {
        id: true,
        nombre: true,
        precioCompra: true,
        precioVenta: true,
        tipoProducto: true,
        etiquetas: true
      }
    });

    console.log(`📦 Encontrados ${productos.length} productos con precios iguales`);

    if (productos.length === 0) {
      console.log('✅ No se encontraron productos que requieran corrección');
      return;
    }

    // Función para calcular margen según tipo de producto
    function calcularMargenPorTipo(tipoProducto, etiquetas) {
      // Márgenes realistas por categoría de producto
      const margenes = {
        'TECNOLOGIA': { min: 15, max: 35 }, // 15-35%
        'ELECTRODOMESTICOS': { min: 20, max: 40 }, // 20-40%
        'ROPA': { min: 50, max: 100 }, // 50-100%
        'ALIMENTOS': { min: 10, max: 30 }, // 10-30%
        'MEDICAMENTOS': { min: 15, max: 25 }, // 15-25%
        'OFICINA': { min: 25, max: 50 }, // 25-50%
        'HOGAR': { min: 30, max: 60 }, // 30-60%
        'DEPORTES': { min: 40, max: 80 }, // 40-80%
        'AUTOMOTRIZ': { min: 15, max: 30 }, // 15-30%
        'CONSTRUCCION': { min: 20, max: 40 }, // 20-40%
        'GENERAL': { min: 20, max: 40 } // 20-40% para productos generales
      };

      // Detectar categoría por etiquetas si no hay tipo específico
      let categoria = 'GENERAL';
      if (tipoProducto) {
        categoria = tipoProducto.toUpperCase();
      } else if (etiquetas && etiquetas.length > 0) {
        // Detectar por etiquetas
        const etiquetasStr = etiquetas.join(' ').toLowerCase();
        if (etiquetasStr.includes('tecnolog') || etiquetasStr.includes('electronic') || 
            etiquetasStr.includes('computador') || etiquetasStr.includes('software')) {
          categoria = 'TECNOLOGIA';
        } else if (etiquetasStr.includes('ropa') || etiquetasStr.includes('vestir') || 
                   etiquetasStr.includes('textil')) {
          categoria = 'ROPA';
        } else if (etiquetasStr.includes('alimento') || etiquetasStr.includes('comida') || 
                   etiquetasStr.includes('bebida')) {
          categoria = 'ALIMENTOS';
        } else if (etiquetasStr.includes('medicina') || etiquetasStr.includes('farmac') || 
                   etiquetasStr.includes('salud')) {
          categoria = 'MEDICAMENTOS';
        } else if (etiquetasStr.includes('oficina') || etiquetasStr.includes('papeler')) {
          categoria = 'OFICINA';
        } else if (etiquetasStr.includes('hogar') || etiquetasStr.includes('casa') || 
                   etiquetasStr.includes('domestico')) {
          categoria = 'HOGAR';
        }
      }

      const margen = margenes[categoria] || margenes['GENERAL'];
      
      // Generar margen aleatorio dentro del rango
      const margenPorcentaje = Math.random() * (margen.max - margen.min) + margen.min;
      return margenPorcentaje;
    }

    // Procesar productos en lotes
    const batchSize = 10;
    let procesados = 0;
    let actualizados = 0;

    for (let i = 0; i < productos.length; i += batchSize) {
      const batch = productos.slice(i, i + batchSize);
      
      const updatePromises = batch.map(async (producto) => {
        try {
          // Calcular nuevo precio de venta con margen
          const margenPorcentaje = calcularMargenPorTipo(producto.tipoProducto, producto.etiquetas);
          const nuevoPrecioVenta = parseFloat((producto.precioCompra * (1 + margenPorcentaje / 100)).toFixed(2));
          
          // Actualizar el producto
          await prisma.producto.update({
            where: { id: producto.id },
            data: {
              precioVenta: nuevoPrecioVenta
            }
          });

          console.log(`✅ ${producto.nombre}: $${producto.precioCompra} → $${nuevoPrecioVenta} (${margenPorcentaje.toFixed(1)}%)`);
          return true;
        } catch (error) {
          console.error(`❌ Error actualizando ${producto.nombre}:`, error.message);
          return false;
        }
      });

      const results = await Promise.allSettled(updatePromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      
      procesados += batch.length;
      actualizados += successCount;
      
      console.log(`📊 Progreso: ${procesados}/${productos.length} (${actualizados} exitosos)`);
      
      // Pausa pequeña entre lotes para no sobrecargar la DB
      if (i + batchSize < productos.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n🎉 Corrección completada!');
    console.log(`📈 Productos actualizados: ${actualizados}/${productos.length}`);
    
    // Verificar los nuevos márgenes
    const productosActualizados = await prisma.producto.findMany({
      where: {
        estado: 'ACTIVO',
        precioCompra: { gt: 0 }
      },
      select: {
        precioCompra: true,
        precioVenta: true
      }
    });

    if (productosActualizados.length > 0) {
      const margenPromedio = productosActualizados.reduce((acc, p) => {
        const margen = ((p.precioVenta - p.precioCompra) / p.precioCompra) * 100;
        return acc + margen;
      }, 0) / productosActualizados.length;

      console.log(`📊 Nuevo margen promedio: ${margenPromedio.toFixed(2)}%`);
    }

  } catch (error) {
    console.error('❌ Error en la corrección de precios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  fixPreciosProductos()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { fixPreciosProductos };
