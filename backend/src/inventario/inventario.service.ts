import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  async getKpis(empresaId: number) {
    const productos = await this.prisma.producto.findMany({
      where: { empresaId },
    });

    const totalProductos = productos.length;
    const totalUnidades = productos.reduce((acc, p) => acc + p.stock, 0);
    const valorTotal = productos.reduce((acc, p) => acc + (p.precio * p.stock), 0);

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: { producto: { empresaId } },
    });

    const entradas = movimientos.filter(m => m.tipo === 'ENTRADA').length;
    const salidas = movimientos.filter(m => m.tipo === 'SALIDA').length;

    const productosBajoStock = productos.filter(p => p.stock < 5); // por ejemplo

    return {
      totalProductos,
      totalUnidades,
      valorTotal,
      entradas,
      salidas,
      productosBajoStock,
    };
  }

    async getAlertas(empresaId: number) {
    const productos = await this.prisma.producto.findMany({
      where: { empresaId },
      select: { id: true, nombre: true, stock: true }
    });

    const bajoStock = productos.filter(p => p.stock < 5);
    const sobreStock = productos.filter(p => p.stock > 100);

    return { bajoStock, sobreStock };
  }


  async getFichasCompra(empresaId: number) {
  const productos = await this.prisma.producto.findMany({
    where: { empresaId },
    select: {
      id: true,
      nombre: true,
      stock: true,
    },
  });

  const hoy = new Date();
  const fechaSugerida = new Date(hoy);
  fechaSugerida.setDate(hoy.getDate() + 3); // Ejemplo de sugerir compra a 3 días, se ajustara segun necesidades

  const fichas = productos
    .filter(p => p.stock < 5)
    .map(p => ({
      productoId: p.id,
      nombre: p.nombre,
      stockActual: p.stock,
      cantidadSugerida: 20, // Se ajustara con IA
      fechaSugerida: fechaSugerida.toISOString().split('T')[0],
      motivo: 'Reposición por bajo stock', //Cambiara con IA
      // proveedor: 'Proveedor sugerido', // Se ajustara con IA
    }));

  return fichas;
}

}

