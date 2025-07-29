import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportacionCacheService } from '../../importacion/servicios/importacion-cache.service';
import { AdvancedLoggingService } from '../../importacion/services/advanced-logging.service';
import { SmartErrorResolverService } from '../../importacion/services/smart-error-resolver.service';
import { ImportacionProgressTrackerService } from '../../importacion/services/importacion-progress-tracker.service';
import { ImportacionWebSocketService } from '../../importacion/servicios/importacion-websocket.service';
import { TrabajoImportacion, ResultadoImportacion, ErrorImportacion, EstadoTrabajo, MovimientoImportacion } from '../interfaces/trabajo-importacion.interface';
import { EnhancedBaseProcesadorService } from '../services/enhanced-base-procesador.service';
import { LoteProcesador } from '../interfaces/base-procesador.interface';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportacionMovimientosProcesador extends EnhancedBaseProcesadorService {
  constructor(
    prisma: PrismaService,
    cacheService: ImportacionCacheService,
    advancedLogging: AdvancedLoggingService,
    smartErrorResolver: SmartErrorResolverService,
    progressTracker: ImportacionProgressTrackerService,
    websocketService: ImportacionWebSocketService
  ) {
    super(
      prisma, 
      cacheService, 
      advancedLogging,
      smartErrorResolver,
      progressTracker,
      websocketService,
      'ImportacionMovimientosProcesador', 
      {
        loteSize: 100,
        maxRetries: 3,
        timeout: 30000,
        enableCache: true,
        cacheTTL: 1800,
      }
    );
  }

  async procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion> {
    const loteProcesador: LoteProcesador = {
      procesarLote: this.procesarLoteMovimientos.bind(this),
      validarRegistro: this.validarRegistroMovimiento.bind(this),
      guardarRegistro: this.guardarMovimiento.bind(this),
    };

    return this.procesarArchivoBase(trabajo, job, loteProcesador);
  }

  protected obtenerCamposRequeridos(): string[] {
    return ['productoId', 'tipo', 'cantidad', 'fecha'];
  }

  private validarEstructuraArchivo(datos: MovimientoImportacion[]): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];
    const columnasRequeridas = this.obtenerCamposRequeridos();

    if (datos.length === 0) {
      errores.push({
        fila: 1,
        columna: 'archivo',
        valor: '',
        mensaje: 'El archivo está vacío',
        tipo: 'validacion',
      });
      return errores;
    }

    // Verificar columnas requeridas en el primer registro
    const primerRegistro = datos[0];
    columnasRequeridas.forEach(columna => {
      if (!(columna in primerRegistro)) {
        errores.push({
          fila: 1,
          columna: 'estructura',
          valor: columna,
          mensaje: `Columna requerida no encontrada: ${columna}`,
          tipo: 'validacion',
        });
      }
    });

    return errores;
  }

  private async cargarProductosEmpresaConCache(empresaId: number): Promise<Map<string, any>> {
    // Intentar obtener del cache primero
    const cached = await this.cacheService.getProductosEmpresaCache(empresaId);
    if (cached) {
      this.logger.log(`✅ Productos de empresa ${empresaId} obtenidos del cache`);
      return cached;
    }

    // Si no está en cache, cargar de la base de datos
    const productos = await this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
      },
      select: {
        id: true,
        nombre: true,
        stock: true,
        codigoBarras: true,
        sku: true,
      },
    });

    const productosMap = new Map<string, any>();
    productos.forEach(producto => {
      productosMap.set(producto.nombre.toLowerCase().trim(), producto);
      if (producto.codigoBarras) {
        productosMap.set(producto.codigoBarras.trim(), producto);
      }
      if (producto.sku) {
        productosMap.set(producto.sku.trim(), producto);
      }
    });

    // Guardar en cache
    await this.cacheService.setProductosEmpresaCache(empresaId, productosMap);
    this.logger.log(`✅ Productos de empresa ${empresaId} guardados en cache`);

    return productosMap;
  }

  private async cargarProductosEmpresa(empresaId: number): Promise<Map<string, any>> {
    const productos = await this.prisma.producto.findMany({
      where: {
        empresaId,
        estado: 'ACTIVO',
      },
      select: {
        id: true,
        nombre: true,
        stock: true,
        codigoBarras: true,
        sku: true,
      },
    });

    const productosMap = new Map<string, any>();
    productos.forEach(producto => {
      productosMap.set(producto.nombre.toLowerCase().trim(), producto);
      if (producto.codigoBarras) {
        productosMap.set(producto.codigoBarras.trim(), producto);
      }
      if (producto.sku) {
        productosMap.set(producto.sku.trim(), producto);
      }
    });

    return productosMap;
  }

  private async procesarLoteMovimientos(
    lote: MovimientoImportacion[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job,
    productosEmpresa: Map<string, any>
  ): Promise<void> {
    for (const registro of lote) {
      try {
        // Validar registro
        const erroresValidacion = this.validarRegistroMovimiento(registro, productosEmpresa);
        if (erroresValidacion.length > 0) {
          resultado.errores.push(...erroresValidacion);
          resultado.estadisticas.errores++;
          continue;
        }

        // Buscar producto
        let producto = productosEmpresa.get(String(registro.productoId));
        if (!producto && registro.codigoBarras) {
          producto = productosEmpresa.get(String(registro.codigoBarras).trim());
        }

        if (!producto) {
          resultado.errores.push({
            fila: registro._filaOriginal,
            columna: 'productoId',
            valor: String(registro.productoId),
            mensaje: `Producto no encontrado: ${registro.productoId}`,
            tipo: 'validacion',
          });
          resultado.estadisticas.errores++;
          continue;
        }

        // Validar stock para salidas
        if (registro.tipo.toUpperCase() === 'SALIDA' && producto.stock < parseInt(String(registro.cantidad))) {
          resultado.errores.push({
            fila: registro._filaOriginal,
            columna: 'cantidad',
            valor: String(registro.cantidad),
            mensaje: `Stock insuficiente. Disponible: ${producto.stock}, Solicitado: ${registro.cantidad}`,
            tipo: 'validacion',
          });
          resultado.estadisticas.errores++;
          continue;
        }

        // Crear movimiento
        await this.guardarMovimiento(registro, trabajo, producto);
        resultado.estadisticas.exitosos++;

      } catch (error) {
        this.logger.error(`Error procesando movimiento en fila ${registro._filaOriginal}:`, error);
        resultado.errores.push({
          fila: registro._filaOriginal,
          columna: 'sistema',
          valor: '',
          mensaje: `Error del sistema: ${error.message}`,
          tipo: 'sistema',
        });
        resultado.estadisticas.errores++;
      }
    }
  }

  private validarRegistroMovimiento(registro: MovimientoImportacion, productosEmpresa: Map<string, any>): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    // Validar productoId
    if (!registro.productoId) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'productoId',
        valor: String(registro.productoId),
        mensaje: 'ID de producto es requerido',
        tipo: 'validacion',
      });
    }

    // Validar tipo
    const tipo = String(registro.tipo).toUpperCase();
    if (!['ENTRADA', 'SALIDA'].includes(tipo)) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'tipo',
        valor: String(registro.tipo),
        mensaje: 'Tipo debe ser: ENTRADA o SALIDA',
        tipo: 'validacion',
      });
    }

    // Validar cantidad
    const cantidad = parseInt(String(registro.cantidad));
    if (isNaN(cantidad) || cantidad <= 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'cantidad',
        valor: String(registro.cantidad),
        mensaje: 'Cantidad debe ser un número positivo',
        tipo: 'validacion',
      });
    }

    return errores;
  }

  private async guardarMovimiento(registro: MovimientoImportacion, trabajo: TrabajoImportacion, producto: any): Promise<void> {
    const cantidad = parseInt(String(registro.cantidad));
    const tipo = String(registro.tipo).toUpperCase() as 'ENTRADA' | 'SALIDA';

    // Crear movimiento
    await this.prisma.movimientoInventario.create({
      data: {
        productoId: producto.id,
        tipo,
        cantidad,
        descripcion: registro.descripcion ? String(registro.descripcion).trim() : null,
        fecha: new Date(registro.fecha || new Date()),
        empresaId: trabajo.empresaId,
        estado: 'ACTIVO',
      },
    });

    // Actualizar stock del producto
    let nuevoStock = producto.stock;
    if (tipo === 'ENTRADA') {
      nuevoStock += cantidad;
    } else if (tipo === 'SALIDA') {
      nuevoStock -= cantidad;
    }

    await this.prisma.producto.update({
      where: { id: producto.id },
      data: { stock: nuevoStock },
    });
  }
} 