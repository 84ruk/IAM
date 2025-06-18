import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoPedido } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis(empresaId: number) {
    const totalProductos = await this.prisma.producto.count({ where: { empresaId } });

    const productos = await this.prisma.producto.findMany({
      where: { empresaId },
      select: { stock: true },
    });

    const stockTotal = productos.reduce((sum, p) => sum + p.stock, 0);
    const stockBajo = productos.filter((p) => p.stock < 10).length;

    const movimientosRecientes = await this.prisma.movimientoInventario.findMany({
      where: { producto: { empresaId } },
      include: { producto: true },
      orderBy: { fecha: 'desc' },
      take: 10,
    });

    const pedidosPendientes = await this.prisma.pedidoInventario.count({
      where: { empresaId, estado: EstadoPedido.PENDIENTE },
    });

    return {
      totalProductos,
      stockTotal,
      stockBajo,
      pedidosPendientes,
      movimientosRecientes,
    };
  }



async getStockChart(empresaId: number) {
  // Stock total agrupado 
  const stockPorCategoria = await this.prisma.producto.groupBy({
    by: ['categoria'],
    where: { empresaId },
    _sum: { stock: true },
  });

  stockPorCategoria.map(item => ({
  categoria: item.categoria ?? 'Sin categoría',
  total: item._sum.stock,
}))


  // Los 5 productos con menor stock
  const productosBajoStock = await this.prisma.producto.findMany({
    where: { empresaId },
    orderBy: { stock: 'asc' },
    /* distinct: ['nombre'] */
    take: 5,
    select: {
      nombre: true,
      stock: true,
    },
  });

  // Movimientos por día en los últimos 7 días
  const hoy = new Date();
  const hace7Dias = new Date(hoy);
  hace7Dias.setDate(hoy.getDate() - 6);
  hace7Dias.setHours(0, 0, 0, 0);

  const movimientos = await this.prisma.movimientoInventario.findMany({
    where: {
      producto: { empresaId },
      fecha: { gte: hace7Dias },
    },
    select: {
      fecha: true,
      tipo: true,
      cantidad: true,
    },
  });

  // Agrupar movimientos por día
  const movimientosPorDia: Record<string, { entradas: number; salidas: number }> = {};
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(hace7Dias);
    fecha.setDate(hace7Dias.getDate() + i);
    const clave = fecha.toISOString().split('T')[0];
    movimientosPorDia[clave] = { entradas: 0, salidas: 0 };
  }

  for (const mov of movimientos) {
    const clave = mov.fecha.toISOString().split('T')[0];
    if (!movimientosPorDia[clave]) continue;

    if (mov.tipo === 'ENTRADA') movimientosPorDia[clave].entradas += mov.cantidad;
    else if (mov.tipo === 'SALIDA') movimientosPorDia[clave].salidas += mov.cantidad;
  }

  return {
    stockPorCategoria,
    productosBajoStock,
    movimientosPorDia: Object.entries(movimientosPorDia).map(([fecha, valores]) => ({
      fecha,
      ...valores,
    })),
  };
}

}
