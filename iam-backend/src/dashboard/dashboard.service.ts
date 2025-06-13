import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      where: { empresaId, estado: 'pendiente' },
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
    const productos = await this.prisma.producto.findMany({
      where: { empresaId },
      select: { nombre: true, stock: true },
    });

    return productos.map((p) => ({
      nombre: p.nombre,
      stock: p.stock,
    }));
  }
}
