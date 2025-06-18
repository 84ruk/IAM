import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // KPIs principales
  async getKpis(empresaId: number) {
    const [totalProductos, stockTotal, pedidosPendientes] = await Promise.all([
      this.prisma.producto.count({ where: { empresaId } }),
      this.prisma.producto.aggregate({
        where: { empresaId },
        _sum: { stock: true },
      }),
      this.prisma.pedidoInventario.count({
        where: { empresaId, estado: 'PENDIENTE' },
      }),
    ]);
    return {
      totalProductos,
      stockTotal: stockTotal._sum.stock || 0,
      pedidosPendientes,
    };
  }

  // Stock por producto
  async getStockPorProducto(empresaId: number) {
    return this.prisma.producto.findMany({
      where: { empresaId },
      select: { id: true, nombre: true, stock: true, categoria: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // Movimientos recientes
  async getMovimientosRecientes(empresaId: number, take = 10) {
    return this.prisma.movimientoInventario.findMany({
      where: { empresaId },
      orderBy: { fecha: 'desc' },
      take,
      include: {
        producto: { select: { nombre: true } },
      },
    });
  }

  // Pedidos pendientes
  async getPedidosPendientes(empresaId: number) {
    return this.prisma.pedidoInventario.findMany({
      where: { empresaId, estado: 'PENDIENTE' },
      orderBy: { fechaPedido: 'desc' },
      include: {
        producto: { select: { nombre: true } },
        proveedor: { select: { nombre: true } },
      },
    });
  }

  // Lecturas recientes de sensores por producto
  async getLecturasSensores(empresaId: number, take = 20) {
    return this.prisma.sensorLectura.findMany({
      where: {
        producto: { empresaId },
      },
      orderBy: { fecha: 'desc' },
      take,
      include: {
        producto: { select: { nombre: true } },
      },
    });
  }

  // Toda la información del dashboard
  async getDashboardData(empresaId: number) {
    const [kpis, stockPorProducto, movimientosRecientes, pedidosPendientes, lecturasSensores] = await Promise.all([
      this.getKpis(empresaId),
      this.getStockPorProducto(empresaId),
      this.getMovimientosRecientes(empresaId),
      this.getPedidosPendientes(empresaId),
      this.getLecturasSensores(empresaId),
    ]);
    return {
      kpis,
      stockPorProducto,
      movimientosRecientes,
      pedidosPendientes,
      lecturasSensores,
    };
  }
}