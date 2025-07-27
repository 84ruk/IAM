import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ColasService } from '../colas/colas.service';
import { ProcesadorArchivosService, ArchivoProcesado } from './servicios/procesador-archivos.service';
import { ValidadorDatosService } from './servicios/validador-datos.service';
import { TransformadorDatosService } from './servicios/transformador-datos.service';
import { PlantillasService } from './servicios/plantillas.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseImportacionService, ProcesarImportacionParams } from './services/base-importacion.service';
import { ImportacionConfigService } from './config/importacion.config';
import { TrabajoImportacionFactory } from './factories/trabajo-importacion.factory';
import { BatchProcessorService } from './services/batch-processor.service';
import { ValidationCacheService } from './services/validation-cache.service';
import { ErrorHandlerService } from './services/error-handler.service';
import { 
  ImportarProductosDto, 
  ImportarProveedoresDto, 
  ImportarMovimientosDto,
  ImportacionUnificadaDto,
  TipoImportacionUnificada
} from './dto';
import { 
  TrabajoImportacion, 
  TipoImportacion, 
  EstadoTrabajo,
  OpcionesImportacion,
  ErrorImportacion
} from '../colas/interfaces/trabajo-importacion.interface';
import * as path from 'path';
import * as fs from 'fs';

// Usar la interfaz de las colas
import { ResultadoImportacion } from '../colas/interfaces/trabajo-importacion.interface';

@Injectable()
export class ImportacionService extends BaseImportacionService {
  protected readonly logger = new Logger(ImportacionService.name);

  constructor(
    protected readonly colasService: ColasService,
    protected readonly procesadorArchivos: ProcesadorArchivosService,
    protected readonly validadorDatos: ValidadorDatosService,
    protected readonly transformadorDatos: TransformadorDatosService,
    protected readonly batchProcessor: BatchProcessorService,
    protected readonly validationCache: ValidationCacheService,
    protected readonly errorHandler: ErrorHandlerService,
    private readonly plantillasService: PlantillasService,
    private readonly prisma: PrismaService,
  ) {
    super(colasService, procesadorArchivos, validadorDatos, transformadorDatos, batchProcessor, validationCache, errorHandler, ImportacionService.name);
  }

  /**
   * Inicia la importación de productos
   */
  async importarProductos(
    rutaArchivo: string,
    opciones: ImportarProductosDto,
    empresaId: number,
    usuarioId: number
  ): Promise<ResultadoImportacion> {
    return this.procesarImportacion({
      rutaArchivo,
      empresaId,
      usuarioId,
      tipo: 'productos',
      opciones,
    });
  }

  /**
   * Inicia la importación de proveedores
   */
  async importarProveedores(
    rutaArchivo: string,
    opciones: ImportarProveedoresDto,
    empresaId: number,
    usuarioId: number
  ): Promise<ResultadoImportacion> {
    return this.procesarImportacion({
      rutaArchivo,
      empresaId,
      usuarioId,
      tipo: 'proveedores',
      opciones,
    });
  }

  /**
   * Inicia la importación de movimientos
   */
  async importarMovimientos(
    rutaArchivo: string,
    opciones: ImportarMovimientosDto,
    empresaId: number,
    usuarioId: number
  ): Promise<ResultadoImportacion> {
    return this.procesarImportacion({
      rutaArchivo,
      empresaId,
      usuarioId,
      tipo: 'movimientos',
      opciones,
    });
  }

  /**
   * Inicia la importación unificada (nuevo método)
   */
  async importarUnificada(
    rutaArchivo: string,
    opciones: ImportacionUnificadaDto,
    empresaId: number,
    usuarioId: number
  ): Promise<ResultadoImportacion> {
    // Validar que la configuración específica corresponda al tipo
    if (!opciones.validarConfiguracionEspecifica()) {
      throw new BadRequestException('La configuración específica no corresponde al tipo de importación');
    }

          return this.procesarImportacion({
        rutaArchivo,
        empresaId,
        usuarioId,
        tipo: opciones.tipo as unknown as TipoImportacion,
        opciones: {
          sobrescribirExistentes: opciones.sobrescribirExistentes,
          validarSolo: opciones.validarSolo,
          notificarEmail: opciones.notificarEmail,
          emailNotificacion: opciones.emailNotificacion,
          configuracionEspecifica: opciones.getConfiguracionEspecifica(),
        },
      });
  }

  /**
   * Obtiene el estado de un trabajo de importación
   */
  async obtenerEstadoTrabajo(trabajoId: string, empresaId: number): Promise<TrabajoImportacion> {
    try {
      this.logger.log(`🔍 ImportacionService: Buscando trabajo ${trabajoId} para empresa ${empresaId}`);
      
      const trabajo = await this.colasService.obtenerTrabajoImportacion(trabajoId);
      
      if (!trabajo) {
        this.logger.warn(`⚠️ ImportacionService: Trabajo ${trabajoId} no encontrado`);
        throw new NotFoundException('Trabajo de importación no encontrado');
      }

      this.logger.log(`📋 ImportacionService: Trabajo encontrado - empresaId: ${trabajo.empresaId}, empresaId solicitada: ${empresaId}`);
      
      if (trabajo.empresaId !== empresaId) {
        this.logger.warn(`⚠️ ImportacionService: EmpresaId no coincide - trabajo: ${trabajo.empresaId}, solicitada: ${empresaId}`);
        throw new NotFoundException('Trabajo de importación no encontrado');
      }

      this.logger.log(`✅ ImportacionService: Trabajo ${trabajoId} validado correctamente`);
      this.logger.log(`📋 Trabajo completo devuelto:`, JSON.stringify(trabajo, null, 2));
      return trabajo;
    } catch (error) {
      this.logger.error(`Error obteniendo estado del trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Cancela un trabajo de importación
   */
  async cancelarTrabajo(trabajoId: string, empresaId: number): Promise<void> {
    try {
      const trabajo = await this.colasService.obtenerTrabajoImportacion(trabajoId);
      
      if (!trabajo || trabajo.empresaId !== empresaId) {
        throw new NotFoundException('Trabajo de importación no encontrado');
      }

      if (trabajo.estado === EstadoTrabajo.COMPLETADO || trabajo.estado === EstadoTrabajo.ERROR) {
        throw new BadRequestException('No se puede cancelar un trabajo ya completado o con error');
      }

      await this.colasService.cancelarTrabajoImportacion(trabajoId);
      this.logger.log(`✅ Trabajo ${trabajoId} cancelado`);
    } catch (error) {
      this.logger.error(`Error cancelando trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Lista todos los trabajos de importación de una empresa
   */
  async listarTrabajos(empresaId: number, limit = 50, offset = 0): Promise<{
    trabajos: TrabajoImportacion[];
    total: number;
  }> {
    try {
      const trabajos = await this.colasService.listarTrabajosEmpresa(empresaId, limit, offset);
      const total = await this.colasService.contarTrabajosEmpresa(empresaId);

      return { trabajos, total };
    } catch (error) {
      this.logger.error(`Error listando trabajos para empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Descarga el reporte de errores de un trabajo
   */
  async descargarReporteErrores(trabajoId: string, empresaId: number): Promise<string> {
    try {
      const trabajo = await this.colasService.obtenerTrabajoImportacion(trabajoId);
      
      if (!trabajo || trabajo.empresaId !== empresaId) {
        throw new NotFoundException('Trabajo de importación no encontrado');
      }

      if (!trabajo.errores || trabajo.errores.length === 0) {
        throw new BadRequestException('No hay errores para reportar');
      }

      const reportePath = await this.colasService.generarReporteErrores(trabajoId);
      return reportePath;
    } catch (error) {
      this.logger.error(`Error generando reporte de errores para trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Genera una plantilla de Excel
   */
  async generarPlantilla(tipo: 'productos' | 'proveedores' | 'movimientos'): Promise<string> {
    try {
      switch (tipo) {
        case 'productos':
          return await this.plantillasService.generarPlantillaProductos();
        case 'proveedores':
          return await this.plantillasService.generarPlantillaProveedores();
        case 'movimientos':
          return await this.plantillasService.generarPlantillaMovimientos();
        default:
          throw new BadRequestException('Tipo de plantilla no válido');
      }
    } catch (error) {
      this.logger.error(`Error generando plantilla ${tipo}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la ruta de una plantilla para descarga
   */
  obtenerRutaPlantilla(nombreArchivo: string): string {
    return this.plantillasService.obtenerRutaPlantilla(nombreArchivo);
  }

  /**
   * Lista las plantillas disponibles
   */
  listarPlantillas(): string[] {
    return this.plantillasService.listarPlantillas();
  }

  /**
   * Obtiene productos de una empresa para validación de movimientos
   */
  private async obtenerProductosEmpresa(empresaId: number): Promise<Map<string, unknown>> {
    try {
              const productos = await this.prisma.producto.findMany({
          where: {
            empresaId,
          },
        select: {
          id: true,
          nombre: true,
          codigoBarras: true,
          stock: true,
        },
      });

      const mapaProductos = new Map<string, any>();
      
      productos.forEach(producto => {
        // Mapear por nombre (normalizado)
        const nombreNormalizado = producto.nombre.toLowerCase().trim();
        mapaProductos.set(nombreNormalizado, producto);
        
        // Mapear por código de barras si existe
        if (producto.codigoBarras) {
          mapaProductos.set(producto.codigoBarras, producto);
        }
      });

      return mapaProductos;
    } catch (error) {
      this.logger.error(`Error obteniendo productos de empresa ${empresaId}:`, error);
      throw error;
    }
  }

  /**
   * Limpia archivos temporales
   */
  async limpiarArchivosTemporales(rutaArchivo: string): Promise<void> {
    try {
      await this.procesadorArchivos.limpiarArchivoTemporal(rutaArchivo);
    } catch (error) {
      this.logger.warn(`No se pudo limpiar archivo temporal ${rutaArchivo}:`, error);
    }
  }

  /**
   * Obtiene estadísticas de la cola de importación
   */
  async obtenerEstadisticasCola(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return await this.colasService.obtenerEstadisticasCola();
  }
} 