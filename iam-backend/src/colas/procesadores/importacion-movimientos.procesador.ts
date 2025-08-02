import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportacionCacheService } from '../../importacion/servicios/importacion-cache.service';
import { AdvancedLoggingService } from '../../importacion/services/advanced-logging.service';
import { SmartErrorResolverService } from '../../importacion/services/smart-error-resolver.service';
import { ImportacionProgressTrackerService } from '../../importacion/services/importacion-progress-tracker.service';
import { ImportacionWebSocketService } from '../../importacion/servicios/importacion-websocket.service';
import { RelacionCreatorService, RelacionCreatorOptions } from '../../importacion/services/relacion-creator.service';
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
    websocketService: ImportacionWebSocketService,
    private readonly relacionCreator: RelacionCreatorService
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
    // Leer y normalizar los datos antes de la validación
    const datos = await this.leerArchivoExcel(trabajo.archivoOriginal);
    const datosNormalizados = this.normalizarColumnas(datos);
    
    // Crear un trabajo modificado con los datos normalizados
    const trabajoModificado = {
      ...trabajo,
      datosNormalizados
    };

    const loteProcesador: LoteProcesador = {
      procesarLote: async (lote: any[], trabajo: TrabajoImportacion, resultado: ResultadoImportacion, job: Job) => {
        // Los datos ya están normalizados, procesar directamente
        await this.procesarLoteMovimientos(lote, trabajo, resultado, job, new Map());
      },
      validarRegistro: this.validarRegistroMovimiento.bind(this),
      guardarRegistro: this.guardarMovimiento.bind(this),
    };

    // Usar el procesador base pero con datos normalizados
    return this.procesarArchivoBaseConDatos(trabajoModificado, job, loteProcesador, datosNormalizados);
  }

  /**
   * Procesa el archivo con datos ya normalizados
   */
  private async procesarArchivoBaseConDatos(
    trabajo: TrabajoImportacion & { datosNormalizados?: any[] }, 
    job: Job,
    loteProcesador: LoteProcesador,
    datosNormalizados: any[]
  ): Promise<ResultadoImportacion> {
    const resultado: ResultadoImportacion = {
      trabajoId: trabajo.id,
      estado: EstadoTrabajo.PROCESANDO,
      estadisticas: {
        total: datosNormalizados.length,
        exitosos: 0,
        errores: 0,
        duplicados: 0,
      },
      errores: [],
      tiempoProcesamiento: 0,
    };

    try {
      // Validar estructura con datos normalizados
      const erroresValidacion = this.validarEstructuraArchivoBase(datosNormalizados);
      if (erroresValidacion.length > 0) {
        resultado.errores.push(...erroresValidacion);
        resultado.estadisticas.errores = erroresValidacion.length;
        resultado.estado = EstadoTrabajo.ERROR;
        return resultado;
      }

      // Procesar registros en lotes
      for (let i = 0; i < datosNormalizados.length; i += this.config.loteSize) {
        const lote = datosNormalizados.slice(i, i + this.config.loteSize);
        await loteProcesador.procesarLote(lote, trabajo, resultado, job);
        
        // Actualizar progreso
        const progreso = Math.round(((i + this.config.loteSize) / datosNormalizados.length) * 100);
        await job.updateProgress(Math.min(progreso, 100));
      }

      resultado.estado = EstadoTrabajo.COMPLETADO;
      return resultado;

    } catch (error) {
      this.logger.error('Error en procesamiento:', error);
      resultado.estado = EstadoTrabajo.ERROR;
      resultado.errores.push({
        fila: 0,
        columna: 'sistema',
        valor: '',
        mensaje: `Error del sistema: ${error.message}`,
        tipo: 'sistema',
      });
      return resultado;
    }
  }

  protected obtenerCamposRequeridos(): string[] {
    return ['tipo', 'cantidad', 'producto'];
  }

  /**
   * Normaliza los nombres de columnas para ser más flexibles
   */
  private normalizarColumnas(datos: any[]): any[] {
    return datos.map(registro => {
      const normalizado = { ...registro };
      
      // Mapear diferentes nombres de columnas para producto
      if (registro.producto && !registro.productoId) {
        normalizado.productoId = registro.producto;
      }
      if (registro.productoId && !registro.producto) {
        normalizado.producto = registro.productoId;
      }
      
      // Mapear diferentes nombres de columnas para fecha
      if (registro.fechaMovimiento && !registro.fecha) {
        normalizado.fecha = registro.fechaMovimiento;
      }
      
      return normalizado;
    });
  }

  /**
   * Sobrescribe la validación de estructura para ser más flexible con nombres de columnas
   */
  protected validarEstructuraArchivoBase(datos: MovimientoImportacion[]): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

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

    // Normalizar los datos antes de validar
    const datosNormalizados = this.normalizarColumnas(datos);
    
    // Verificar columnas requeridas en el primer registro normalizado
    const primerRegistro = datosNormalizados[0];
    const columnasRequeridas = this.obtenerCamposRequeridos();
    
    columnasRequeridas.forEach(columna => {
      if (!(columna in primerRegistro) || primerRegistro[columna] === null || primerRegistro[columna] === undefined) {
        errores.push({
          fila: 1,
          columna: 'estructura',
          valor: columna,
          mensaje: `Columna requerida no encontrada: ${columna}. Asegúrate de incluir 'tipo' y 'cantidad'`,
          tipo: 'validacion',
        });
      }
    });

    return errores;
  }

  private validarEstructuraArchivo(datos: MovimientoImportacion[]): ErrorImportacion[] {
    return this.validarEstructuraArchivoBase(datos);
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
        // Validar registro básico
        const erroresValidacion = this.validarRegistroMovimiento(registro);
        if (erroresValidacion.length > 0) {
          resultado.errores.push(...erroresValidacion);
          resultado.estadisticas.errores++;
          continue;
        }

        // Configurar opciones para creación automática
        const opcionesRelacion: RelacionCreatorOptions = {
          empresaId: trabajo.empresaId,
          etiquetas: ['AUTO-CREADO', 'IMPORTACION-MOVIMIENTOS'],
          stockInicial: 0,
          precioCompra: 0,
          precioVenta: 0,
          stockMinimo: 10,
          crearProveedorSiNoExiste: Boolean(trabajo.opciones.configuracionEspecifica?.crearProveedorSiNoExiste ?? true),
          generarSKUAutomatico: Boolean(trabajo.opciones.configuracionEspecifica?.generarSKUAutomatico ?? true),
          prefijoSKU: String(trabajo.opciones.configuracionEspecifica?.prefijoSKU ?? 'PROD')
        };

        // Buscar o crear producto usando el nuevo servicio
        const resultadoProducto = await this.relacionCreator.buscarOCrearProducto(
          String(registro.productoId || registro.producto),
          opcionesRelacion
        );

        if (resultadoProducto.error || !resultadoProducto.entidad) {
          resultado.errores.push({
            fila: registro._filaOriginal,
            columna: 'productoId',
            valor: String(registro.productoId),
            mensaje: resultadoProducto.error || 'No se pudo procesar el producto',
            tipo: 'validacion',
          });
          resultado.estadisticas.errores++;
          continue;
        }

        const producto = resultadoProducto.entidad;

        // Buscar o crear proveedor si se especifica
        let proveedorId = null;
        if (registro.proveedor && opcionesRelacion.crearProveedorSiNoExiste) {
          const resultadoProveedor = await this.relacionCreator.buscarOCrearProveedor(
            String(registro.proveedor),
            trabajo.empresaId
          );

          if (resultadoProveedor.entidad) {
            proveedorId = resultadoProveedor.entidad.id;
            if (resultadoProveedor.creado) {
              this.logger.log(`✅ Proveedor creado automáticamente: ${resultadoProveedor.entidad.nombre}`);
            }
          }
        }

        // Validar stock para salidas (solo si no se permite stock negativo)
        const permitirStockNegativo = trabajo.opciones.configuracionEspecifica?.permitirStockNegativo ?? false;
        if (registro.tipo.toUpperCase() === 'SALIDA' && !permitirStockNegativo) {
          const stockActual = producto.stock || 0;
          const cantidadSolicitada = parseInt(String(registro.cantidad));
          
          if (stockActual < cantidadSolicitada) {
            resultado.errores.push({
              fila: registro._filaOriginal,
              columna: 'cantidad',
              valor: String(registro.cantidad),
              mensaje: `Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${cantidadSolicitada}`,
              tipo: 'validacion',
            });
            resultado.estadisticas.errores++;
            continue;
          }
        }

        // Crear movimiento con información completa
        await this.guardarMovimiento(registro, trabajo, producto, proveedorId || undefined);
        resultado.estadisticas.exitosos++;

        // Log de éxito
        if (resultadoProducto.creado) {
          this.logger.log(`✅ Producto creado automáticamente: ${producto.nombre} (ID: ${producto.id})`);
        }

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

  private validarRegistroMovimiento(registro: MovimientoImportacion): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    // Validar productoId
    if (!registro.productoId) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'productoId',
        valor: String(registro.productoId),
        mensaje: 'Identificador de producto es requerido',
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

    // Validar fecha si se proporciona
    if (registro.fecha) {
      const fecha = new Date(registro.fecha);
      if (isNaN(fecha.getTime())) {
        errores.push({
          fila: registro._filaOriginal,
          columna: 'fecha',
          valor: String(registro.fecha),
          mensaje: 'Formato de fecha inválido',
          tipo: 'validacion',
        });
      }
    }

    return errores;
  }

  private async guardarMovimiento(
    registro: MovimientoImportacion, 
    trabajo: TrabajoImportacion, 
    producto: any, 
    proveedorId?: number
  ): Promise<void> {
    const cantidad = parseInt(String(registro.cantidad));
    const tipo = String(registro.tipo).toUpperCase() as 'ENTRADA' | 'SALIDA';
    const fecha = registro.fecha ? new Date(registro.fecha) : new Date();

    // Preparar datos del movimiento
    const datosMovimiento: any = {
      productoId: producto.id,
      tipo,
      cantidad,
      descripcion: registro.descripcion ? String(registro.descripcion).trim() : null,
      fecha,
      empresaId: trabajo.empresaId,
      estado: 'ACTIVO',
    };

    // Agregar proveedor si se especifica
    if (proveedorId) {
      datosMovimiento.proveedorId = proveedorId;
    }

    // Agregar precios si están disponibles en el registro
    if (registro.precioUnitario) {
      datosMovimiento.precioUnitario = parseFloat(String(registro.precioUnitario));
    }
    if (registro.precioTotal) {
      datosMovimiento.precioTotal = parseFloat(String(registro.precioTotal));
    }
    if (registro.tipoPrecio) {
      datosMovimiento.tipoPrecio = String(registro.tipoPrecio);
    }

    // Crear movimiento
    await this.prisma.movimientoInventario.create({
      data: datosMovimiento,
    });

    // Actualizar stock del producto
    const stockActual = producto.stock || 0;
    let nuevoStock = stockActual;
    
    if (tipo === 'ENTRADA') {
      nuevoStock += cantidad;
    } else if (tipo === 'SALIDA') {
      nuevoStock = Math.max(0, stockActual - cantidad); // Evitar stock negativo
    }

    await this.prisma.producto.update({
      where: { id: producto.id },
      data: { stock: nuevoStock },
    });

    this.logger.log(`✅ Movimiento creado: ${tipo} ${cantidad} unidades de ${producto.nombre} - Stock actualizado: ${nuevoStock}`);
  }
} 