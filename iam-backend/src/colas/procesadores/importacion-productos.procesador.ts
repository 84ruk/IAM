import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportacionCacheService } from '../../importacion/servicios/importacion-cache.service';
import { TrabajoImportacion, ResultadoImportacion, ErrorImportacion, EstadoTrabajo, ProductoImportacion } from '../interfaces/trabajo-importacion.interface';
import { BaseProcesadorService } from '../services/base-procesador.service';
import { LoteProcesador } from '../interfaces/base-procesador.interface';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportacionProductosProcesador extends BaseProcesadorService {
  constructor(
    prisma: PrismaService,
    cacheService: ImportacionCacheService
  ) {
    super(prisma, cacheService, 'ImportacionProductosProcesador', {
      loteSize: 100,
      maxRetries: 3,
      timeout: 30000,
      enableCache: true,
      cacheTTL: 1800,
    });
  }

  async procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion> {
    const loteProcesador: LoteProcesador = {
      procesarLote: this.procesarLoteProductos.bind(this),
      validarRegistro: this.validarRegistroProducto.bind(this),
      guardarRegistro: this.guardarProducto.bind(this),
    };

    return this.procesarArchivoBase(trabajo, job, loteProcesador);
  }



  private validarEstructuraArchivo(datos: ProductoImportacion[]): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];
    const columnasRequeridas = ['nombre', 'descripcion', 'stock', 'precioCompra', 'precioVenta', 'stockMinimo'];

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

  private async procesarLoteProductos(
    lote: ProductoImportacion[], 
    trabajo: TrabajoImportacion, 
    resultado: ResultadoImportacion, 
    job: Job
  ): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    this.logger.log(`🔄 Procesando lote de ${lote.length} productos para empresa ${trabajo.empresaId}`);

    while (retryCount < maxRetries) {
      try {
        // Usar transacción para garantizar consistencia
        await this.prisma.$transaction(async (tx) => {
          for (const registro of lote) {
            try {
              this.logger.log(`📋 Procesando producto: ${String(registro.nombre)} (fila ${registro._filaOriginal})`);
              
              // Validar datos del registro
              const erroresValidacion = this.validarRegistroProducto(registro);
              if (erroresValidacion.length > 0) {
                this.logger.warn(`⚠️ Errores de validación en producto ${String(registro.nombre)}:`, erroresValidacion);
                resultado.errores.push(...erroresValidacion);
                resultado.estadisticas.errores++;
                continue;
              }

              // Verificar si el producto ya existe
              const productoExistente = await this.verificarProductoExistente(registro, trabajo.empresaId);
              if (productoExistente && !trabajo.opciones.sobrescribirExistentes) {
                this.logger.warn(`⚠️ Producto existente no sobrescrito: ${String(registro.nombre)}`);
                resultado.errores.push({
                  fila: registro._filaOriginal,
                  columna: 'nombre',
                  valor: String(registro.nombre),
                  mensaje: 'Producto ya existe y no se permite sobrescribir',
                  tipo: 'duplicado',
                });
                resultado.estadisticas.duplicados++;
                continue;
              }

              // Crear o actualizar producto
              await this.guardarProducto(registro, trabajo, productoExistente);
              resultado.estadisticas.exitosos++;

            } catch (error) {
              this.logger.error(`Error procesando registro ${registro._filaOriginal}:`, error);
              resultado.errores.push({
                fila: registro._filaOriginal,
                columna: 'sistema',
                valor: '',
                mensaje: `Error procesando registro: ${error.message}`,
                tipo: 'sistema',
              });
              resultado.estadisticas.errores++;
            }
          }
        });
        
        // Si llegamos aquí, la transacción fue exitosa
        break;
        
      } catch (error) {
        retryCount++;
        this.logger.error(`Error en transacción de lote (intento ${retryCount}/${maxRetries}):`, error);
        
        // Si es un error de conexión, reintentar
        if ((error.message.includes('connection') || error.message.includes('timeout') || error.message.includes('pool')) && retryCount < maxRetries) {
          this.logger.warn(`Reintentando lote debido a error de conexión... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Backoff exponencial
          continue;
        }
        
        // Si no es un error de conexión o se agotaron los reintentos, procesar sin transacción
        this.logger.warn(`Procesando lote sin transacción debido a errores de conexión persistentes`);
        for (const registro of lote) {
          try {
            // Validar datos del registro
            const erroresValidacion = this.validarRegistroProducto(registro);
            if (erroresValidacion.length > 0) {
              resultado.errores.push(...erroresValidacion);
              resultado.estadisticas.errores++;
              continue;
            }

            // Verificar si el producto ya existe
            const productoExistente = await this.verificarProductoExistente(registro, trabajo.empresaId);
            if (productoExistente && !trabajo.opciones.sobrescribirExistentes) {
              resultado.errores.push({
                fila: registro._filaOriginal,
                columna: 'nombre',
                valor: String(registro.nombre),
                mensaje: 'Producto ya existe y no se permite sobrescribir',
                tipo: 'duplicado',
              });
              resultado.estadisticas.duplicados++;
              continue;
            }

            // Crear o actualizar producto
            await this.guardarProducto(registro, trabajo, productoExistente);
            this.logger.log(`✅ Producto guardado exitosamente: ${String(registro.nombre)}`);
            resultado.estadisticas.exitosos++;

          } catch (error) {
            this.logger.error(`Error procesando registro ${registro._filaOriginal}:`, error);
            resultado.errores.push({
              fila: registro._filaOriginal,
              columna: 'sistema',
              valor: '',
              mensaje: `Error procesando registro: ${error.message}`,
              tipo: 'sistema',
            });
            resultado.estadisticas.errores++;
          }
        }
        break;
      }
    }
  }

  private validarRegistroProducto(registro: ProductoImportacion): ErrorImportacion[] {
    const errores: ErrorImportacion[] = [];

    // Validar nombre
    const nombre = String(registro.nombre);
    if (!nombre || nombre.trim().length === 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'nombre',
        valor: nombre,
        mensaje: 'El nombre es requerido y debe ser un texto válido',
        tipo: 'validacion',
      });
    }

    // Validar stock
    const stock = parseInt(String(registro.stock));
    if (isNaN(stock) || stock < 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'stock',
        valor: String(registro.stock),
        mensaje: 'El stock debe ser un número entero mayor o igual a 0',
        tipo: 'validacion',
      });
    }

    // Validar precios
    const precioCompra = parseFloat(String(registro.precioCompra));
    const precioVenta = parseFloat(String(registro.precioVenta));
    
    if (isNaN(precioCompra) || precioCompra < 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'precioCompra',
        valor: String(registro.precioCompra),
        mensaje: 'El precio de compra debe ser un número válido mayor o igual a 0',
        tipo: 'validacion',
      });
    }

    if (isNaN(precioVenta) || precioVenta < 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'precioVenta',
        valor: String(registro.precioVenta),
        mensaje: 'El precio de venta debe ser un número válido mayor o igual a 0',
        tipo: 'validacion',
      });
    }

    // Validar stock mínimo
    const stockMinimo = parseInt(String(registro.stockMinimo));
    if (isNaN(stockMinimo) || stockMinimo < 0) {
      errores.push({
        fila: registro._filaOriginal,
        columna: 'stockMinimo',
        valor: String(registro.stockMinimo),
        mensaje: 'El stock mínimo debe ser un número entero mayor o igual a 0',
        tipo: 'validacion',
      });
    }

    return errores;
  }

  private async verificarProductoExistente(registro: ProductoImportacion, empresaId: number): Promise<unknown> {
    // Buscar por nombre en la misma empresa
    return await this.prisma.producto.findFirst({
      where: {
        nombre: String(registro.nombre).trim(),
        empresaId,
        estado: 'ACTIVO',
      },
    });
  }

  private async guardarProducto(registro: ProductoImportacion, trabajo: TrabajoImportacion, productoExistente: unknown): Promise<void> {
    this.logger.log(`💾 Guardando producto: ${String(registro.nombre)} para empresa ${trabajo.empresaId}`);
    
    const datosProducto = {
      nombre: String(registro.nombre).trim(),
      descripcion: registro.descripcion ? String(registro.descripcion).trim() : null,
      stock: parseInt(String(registro.stock)) || 0,
      precioCompra: parseFloat(String(registro.precioCompra)) || 0,
      precioVenta: parseFloat(String(registro.precioVenta)) || 0,
      stockMinimo: parseInt(String(registro.stockMinimo)) || 10,
      empresaId: trabajo.empresaId,
      tipoProducto: registro.tipoProducto ? String(registro.tipoProducto) : 'GENERICO',
      unidad: registro.unidad ? String(registro.unidad) : 'UNIDAD',
      estado: 'ACTIVO',
      etiquetas: registro.etiquetas ? String(registro.etiquetas).split(',').map((tag: string) => tag.trim()) : [],
    };

    this.logger.log(`📋 Datos del producto a guardar:`, JSON.stringify(datosProducto, null, 2));

    if (productoExistente && typeof productoExistente === 'object' && 'id' in productoExistente) {
      // Actualizar producto existente
      this.logger.log(`🔄 Actualizando producto existente: ${String(registro.nombre)}`);
      await this.prisma.producto.update({
        where: { id: (productoExistente as { id: number }).id },
        data: datosProducto as any,
      });
      this.logger.log(`✅ Producto actualizado: ${String(registro.nombre)}`);
    } else {
      // Crear nuevo producto
      this.logger.log(`🆕 Creando nuevo producto: ${String(registro.nombre)}`);
      await this.prisma.producto.create({
        data: datosProducto as any,
      });
      this.logger.log(`✅ Producto creado: ${String(registro.nombre)}`);
    }
  }


} 