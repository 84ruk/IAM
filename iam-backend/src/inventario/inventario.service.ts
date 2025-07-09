import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}


  async getKpis(empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, devolver KPIs vacíos
    if (!empresaId) {
      return {
        totalProductos: 0,
        totalUnidades: 0,
        valorTotal: 0,
        entradas: 0,
        salidas: 0,
        productosBajoStock: [],
      };
    }

    const productos = await this.prisma.producto.findMany({
      where: { empresaId },
    });

    const totalProductos = productos.length;
    const totalUnidades = productos.reduce((acc, p) => acc + p.stock, 0);
    const valorTotal = productos.reduce((acc, p) => acc + (p.precioVenta * p.stock), 0);

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



    async getAlertas(empresaId: number | undefined) {
    // Si el usuario no tiene empresa configurada, devolver alertas vacías
    if (!empresaId) {
      return { bajoStock: [], sobreStock: [] };
    }

    const productos = await this.prisma.producto.findMany({
      where: { empresaId },
      select: { id: true, nombre: true, stock: true }
    });

    const bajoStock = productos.filter(p => p.stock < 5);
    const sobreStock = productos.filter(p => p.stock > 100);

    return { bajoStock, sobreStock };
  }


  async getFichasCompra(empresaId: number | undefined) {
  // Si el usuario no tiene empresa configurada, devolver fichas vacías
  if (!empresaId) {
    return [];
  }

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
  fechaSugerida.setDate(hoy.getDate() + 3); // Ejemplo de sugerir compra a 3 días

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


async predecirQuiebre(empresaId: number | undefined) {
  // Si el usuario no tiene empresa configurada, devolver predicciones vacías
  if (!empresaId) {
    return [];
  }

  const productos = await this.prisma.producto.findMany({
    where: { empresaId },
    select: {
      id: true,
      nombre: true,
      stock: true,
    },
  });

  const hoy = new Date();
  const fechaInicio = new Date();
  fechaInicio.setDate(hoy.getDate() - 15); // últimos 15 días

  const movimientos = await this.prisma.movimientoInventario.findMany({
    where: {
      tipo: 'SALIDA',
      fecha: { gte: fechaInicio },
      producto: { empresaId },
    },
    select: {
      cantidad: true,
      productoId: true,
      fecha: true,
    },
  });

  const porProducto = productos.map(p => {
    const salidas = movimientos.filter(m => m.productoId === p.id);
    const totalDias = 15;

    const totalSalidas = salidas.reduce((acc, m) => acc + m.cantidad, 0);
    const promedioDiario = totalSalidas / totalDias;

    const diasRestantes = promedioDiario > 0
      ? Math.floor(p.stock / promedioDiario)
      : null;

    return {
      productoId: p.id,
      nombre: p.nombre,
      stockActual: p.stock,
      promedioSalidasDiarias: +promedioDiario.toFixed(2),
      diasEstimadosAntesDeAgotarStock: diasRestantes,
    };
  });

  return porProducto.filter(p => p.diasEstimadosAntesDeAgotarStock !== null);
}

async getSerieHistorica(productoId: number, dias: number = 30) {
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - dias);

  const movimientos = await this.prisma.movimientoInventario.findMany({
    where: {
      productoId,
      tipo: 'SALIDA',
      fecha: {
        gte: fechaInicio,
      },
    },
    select: {
      fecha: true,
      cantidad: true,
    },
  });

  // Agrupar por día
  const mapa = new Map<string, number>();

  for (let i = 0; i <= dias; i++) {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fechaInicio.getDate() + i);
    const key = fecha.toISOString().split('T')[0];
    mapa.set(key, 0);
  }

  movimientos.forEach(mov => {
    const key = mov.fecha.toISOString().split('T')[0];
    mapa.set(key, (mapa.get(key) || 0) + mov.cantidad);
  });

  return Array.from(mapa.entries()).map(([fecha, salidas]) => ({
    fecha,
    salidas,
  }));
}


}

