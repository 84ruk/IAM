import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoProducto, UnidadMedida } from '@prisma/client';

export interface ProductoCreatorOptions {
  empresaId: number;
  etiquetas?: string[];
  tipoProducto?: TipoProducto;
  unidad?: UnidadMedida;
  stockInicial?: number;
  precioCompra?: number;
  precioVenta?: number;
  stockMinimo?: number;
}

@Injectable()
export class ProductoCreatorService {
  private readonly logger = new Logger(ProductoCreatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca un producto existente por nombre o ID
   */
  async buscarProducto(identificador: string | number, empresaId: number): Promise<any | null> {
    try {
      if (typeof identificador === 'string' && !isNaN(parseInt(identificador))) {
        // Es un ID numérico en string
        const productoId = parseInt(identificador);
        return await this.prisma.producto.findUnique({
          where: {
            id: productoId,
            empresaId,
            estado: 'ACTIVO'
          },
          select: { id: true, nombre: true, stock: true }
        });
      } else if (typeof identificador === 'number') {
        // Es un ID numérico
        return await this.prisma.producto.findUnique({
          where: {
            id: identificador,
            empresaId,
            estado: 'ACTIVO'
          },
          select: { id: true, nombre: true, stock: true }
        });
      } else {
        // Es un nombre
        const nombre = identificador.toString().trim();
        return await this.prisma.producto.findFirst({
          where: {
            nombre: {
              contains: nombre,
              mode: 'insensitive'
            },
            empresaId,
            estado: 'ACTIVO'
          },
          select: { id: true, nombre: true, stock: true }
        });
      }
    } catch (error) {
      this.logger.error(`Error buscando producto "${identificador}":`, error);
      return null;
    }
  }

  /**
   * Crea un producto automáticamente con datos mínimos
   */
  async crearProductoAutomatico(
    nombre: string, 
    options: ProductoCreatorOptions
  ): Promise<any> {
    // Generar códigos únicos
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codigoUnico = `AUTO-${timestamp}-${randomSuffix}`;
    
    // Limpiar y validar el nombre
    const nombreLimpio = nombre.toString().trim().substring(0, 100);
    
    // Configurar valores por defecto
    const {
      empresaId,
      etiquetas = ['AUTO-CREADO', 'IMPORTACION'],
      tipoProducto = TipoProducto.GENERICO,
      unidad = UnidadMedida.UNIDAD,
      stockInicial = 0,
      precioCompra = 0,
      precioVenta = 0,
      stockMinimo = 10
    } = options;
    
    try {
      const productoNuevo = await this.prisma.producto.create({
        data: {
          nombre: nombreLimpio,
          descripcion: `Producto creado automáticamente durante importación: ${nombreLimpio}`,
          stock: stockInicial,
          precioCompra,
          precioVenta,
          stockMinimo,
          codigoBarras: codigoUnico,
          sku: codigoUnico,
          rfid: codigoUnico,
          tipoProducto,
          unidad,
          estado: 'ACTIVO',
          empresaId,
          etiquetas,
          version: 1,
        },
      });
      
      this.logger.log(`✅ Producto creado automáticamente: ${productoNuevo.nombre} (ID: ${productoNuevo.id})`);
      return productoNuevo;
    } catch (error) {
      this.logger.error(`❌ Error creando producto automático "${nombreLimpio}":`, error);
      throw new Error(`No se pudo crear el producto automáticamente: ${nombreLimpio}`);
    }
  }

  /**
   * Busca o crea un producto automáticamente
   */
  async buscarOCrearProducto(
    identificador: string | number,
    options: ProductoCreatorOptions
  ): Promise<{ producto: any; creado: boolean }> {
    // Primero buscar el producto
    const productoExistente = await this.buscarProducto(identificador, options.empresaId);
    
    if (productoExistente) {
      this.logger.debug(`Producto encontrado: ${productoExistente.nombre} (ID: ${productoExistente.id})`);
      return { producto: productoExistente, creado: false };
    }
    
    // Si no existe, crear automáticamente
    const nombre = typeof identificador === 'string' ? identificador : `Producto ID ${identificador}`;
    const productoNuevo = await this.crearProductoAutomatico(nombre, options);
    
    return { producto: productoNuevo, creado: true };
  }

  /**
   * Crea múltiples productos automáticamente
   */
  async crearProductosAutomaticos(
    productos: Array<{ nombre: string; options: ProductoCreatorOptions }>
  ): Promise<Array<{ producto: any; creado: boolean; error?: string }>> {
    const resultados: Array<{ producto: any; creado: boolean; error?: string }> = [];
    
    for (const { nombre, options } of productos) {
      try {
        const resultado = await this.buscarOCrearProducto(nombre, options);
        resultados.push(resultado);
      } catch (error) {
        this.logger.error(`Error procesando producto "${nombre}":`, error);
        resultados.push({
          producto: null,
          creado: false,
          error: error.message
        });
      }
    }
    
    return resultados;
  }

  /**
   * Actualiza el stock de un producto
   */
  async actualizarStock(productoId: number, cantidad: number, tipo: 'ENTRADA' | 'SALIDA'): Promise<any> {
    try {
      const producto = await this.prisma.producto.findUnique({
        where: { id: productoId }
      });

      if (!producto) {
        throw new Error(`Producto con ID ${productoId} no encontrado`);
      }

      const nuevoStock = tipo === 'ENTRADA' 
        ? producto.stock + cantidad
        : Math.max(0, producto.stock - cantidad);

      const productoActualizado = await this.prisma.producto.update({
        where: { id: productoId },
        data: { stock: nuevoStock }
      });

      this.logger.log(`Stock actualizado: ${producto.nombre} - ${tipo} ${cantidad} unidades - Nuevo stock: ${nuevoStock}`);
      return productoActualizado;
    } catch (error) {
      this.logger.error(`Error actualizando stock del producto ${productoId}:`, error);
      throw error;
    }
  }
} 