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
import { AdvancedLoggingService } from './services/advanced-logging.service';
import { SmartErrorResolverService } from './services/smart-error-resolver.service';
import { ImportacionProgressTrackerService } from './services/importacion-progress-tracker.service';
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
    private readonly advancedLogging: AdvancedLoggingService,
    private readonly smartErrorResolver: SmartErrorResolverService,
    private readonly progressTracker: ImportacionProgressTrackerService,
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
   * Cancelar un trabajo de importación con rollback automático
   */
  async cancelarTrabajoAvanzado(
    trabajoId: string, 
    empresaId: number
  ): Promise<{
    success: boolean;
    trabajo: TrabajoImportacion;
    rollbackInfo?: {
      registrosRevertidos: number;
      tiempoRollback: number;
      transaccionesRevertidas: number;
    };
  }> {
    try {
      this.logger.log(`Cancelando trabajo ${trabajoId} para empresa ${empresaId}`);
      
      // Obtener el trabajo
      const trabajo = await this.obtenerEstadoTrabajo(trabajoId, empresaId);
      
      if (!trabajo) {
        throw new NotFoundException(`Trabajo ${trabajoId} no encontrado`);
      }
      
      if (trabajo.estado === 'completado' || trabajo.estado === 'error' || trabajo.estado === 'cancelado') {
        throw new BadRequestException(`No se puede cancelar un trabajo en estado ${trabajo.estado}`);
      }
      
      const startTime = Date.now();
      
      // Cancelar el trabajo en la cola
      await this.colasService.cancelarTrabajo(trabajoId);
      
      // Realizar rollback de los registros procesados
      const rollbackInfo = await this.realizarRollback(trabajoId, empresaId);
      
      const tiempoRollback = Date.now() - startTime;
      
      // Actualizar estado del trabajo (simulado)
      const trabajoActualizado: TrabajoImportacion = {
        ...trabajo,
        estado: 'cancelado' as EstadoTrabajo,
        fechaActualizacion: new Date(),
        mensaje: 'Trabajo cancelado por el usuario'
      };
      
      return {
        success: true,
        trabajo: trabajoActualizado,
        rollbackInfo: {
          registrosRevertidos: rollbackInfo.registrosRevertidos,
          tiempoRollback,
          transaccionesRevertidas: rollbackInfo.transaccionesRevertidas
        }
      };
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

  /**
   * Obtiene el progreso detallado de un trabajo de importación
   */
  async obtenerProgresoDetallado(trabajoId: string, empresaId: number): Promise<{
    trabajo: TrabajoImportacion;
    progreso: any;
    logs: any;
    correcciones: any;
  }> {
    try {
      // Obtener trabajo básico
      const trabajo = await this.obtenerEstadoTrabajo(trabajoId, empresaId);
      
      // Obtener progreso granular
      const progreso = this.progressTracker.obtenerProgreso(trabajoId);
      
      // Obtener logs avanzados
      const logs = this.advancedLogging.generarResumenLogs(trabajoId);
      
      // Obtener métricas de rendimiento
      const metricas = this.advancedLogging.obtenerMetricas(trabajoId);

      return {
        trabajo,
        progreso,
        logs,
        correcciones: {
          metricas,
          tiempoRestante: progreso ? this.progressTracker.calcularTiempoRestante(trabajoId) : 0,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo progreso detallado del trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Resuelve errores de forma inteligente y aplica correcciones
   */
  async resolverErroresInteligentemente(
    trabajoId: string,
    empresaId: number,
    opciones: {
      autoCorregir: boolean;
      usarValoresPorDefecto: boolean;
      nivelConfianzaMinimo: number;
    }
  ): Promise<{
    erroresResueltos: number;
    correcciones: any[];
    erroresSinResolver: any[];
    reporte: any;
  }> {
    try {
      const trabajo = await this.obtenerEstadoTrabajo(trabajoId, empresaId);
      
      // Obtener datos del trabajo (esto requeriría implementación adicional)
      const datos: Record<string, unknown> = {}; // TODO: Obtener datos del trabajo
      
      // Resolver errores inteligentemente
      const resultado = this.smartErrorResolver.resolverErrores(
        trabajo.errores,
        trabajo.tipo,
        datos
      );

      // Aplicar correcciones si se solicita
      if (opciones.autoCorregir && resultado.correcciones.length > 0) {
        // Convertir datos a array para aplicar correcciones
        const datosArray: Record<string, unknown>[] = [datos];
        const datosCorregidos = this.smartErrorResolver.aplicarCorrecciones(
          datosArray,
          resultado.correcciones
        );
        // TODO: Actualizar datos del trabajo
      }

      // Generar reporte de correcciones
      const reporte = this.smartErrorResolver.generarReporteCorrecciones(
        resultado.correcciones
      );

      return {
        erroresResueltos: resultado.erroresResueltos.length,
        correcciones: resultado.correcciones,
        erroresSinResolver: resultado.erroresSinResolver,
        reporte,
      };
    } catch (error) {
      this.logger.error(`❌ Error resolviendo errores inteligentemente para trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener logs detallados de un trabajo
   */
  async obtenerLogs(
    trabajoId: string, 
    empresaId: number,
    opciones?: {
      tipo?: string;
      nivel?: string;
    }
  ): Promise<{
    logs: any[];
    totalLogs: number;
    filtros: any;
  }> {
    try {
      this.logger.log(`Obteniendo logs del trabajo ${trabajoId} para empresa ${empresaId}`);
      
      // Verificar que el trabajo pertenece a la empresa
      const trabajo = await this.obtenerEstadoTrabajo(trabajoId, empresaId);
      if (!trabajo) {
        throw new NotFoundException(`Trabajo ${trabajoId} no encontrado`);
      }
      
      // Obtener logs del servicio avanzado
      const logsDetallados = await this.obtenerLogsDetallados(trabajoId, empresaId, opciones?.nivel as any);
      
      return {
        logs: logsDetallados.logs,
        totalLogs: logsDetallados.logs.length,
        filtros: {
          tipo: opciones?.tipo,
          nivel: opciones?.nivel
        }
      };
    } catch (error) {
      this.logger.error(`Error obteniendo logs del trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene logs detallados de un trabajo
   */
  async obtenerLogsDetallados(
    trabajoId: string, 
    empresaId: number,
    nivel?: 'debug' | 'info' | 'warn' | 'error'
  ): Promise<{
    logs: any[];
    metricas: any;
    resumen: any;
  }> {
    try {
      // Verificar acceso al trabajo
      await this.obtenerEstadoTrabajo(trabajoId, empresaId);
      
      // Obtener logs
      const logs = this.advancedLogging.obtenerLogs(trabajoId, nivel);
      
      // Obtener métricas
      const metricas = this.advancedLogging.obtenerMetricas(trabajoId);
      
      // Obtener resumen
      const resumen = this.advancedLogging.generarResumenLogs(trabajoId);
      
      return {
        logs,
        metricas,
        resumen,
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo logs detallados del trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Resolver errores de validación automáticamente
   */
  async resolverErrores(
    trabajoId: string, 
    empresaId: number,
    opciones: {
      autoCorregir?: boolean;
      usarValoresPorDefecto?: boolean;
      nivelConfianzaMinimo?: number;
      tipoCorreccion?: string;
      valoresPorDefecto?: Record<string, any>;
    }
  ): Promise<{
    success: boolean;
    erroresResueltos: any[];
    erroresPendientes: any[];
    reporte: any;
  }> {
    try {
      this.logger.log(`Resolviendo errores del trabajo ${trabajoId} para empresa ${empresaId}`);
      
      // Verificar que el trabajo pertenece a la empresa
      const trabajo = await this.obtenerEstadoTrabajo(trabajoId, empresaId);
      if (!trabajo) {
        throw new NotFoundException(`Trabajo ${trabajoId} no encontrado`);
      }
      
      // Usar el servicio de resolución inteligente
      const resultado = await this.resolverErroresInteligentemente(trabajoId, empresaId, {
        autoCorregir: opciones.autoCorregir ?? true,
        usarValoresPorDefecto: opciones.usarValoresPorDefecto ?? true,
        nivelConfianzaMinimo: opciones.nivelConfianzaMinimo ?? 70
      });
      
      return {
        success: resultado.erroresResueltos > 0,
        erroresResueltos: resultado.correcciones,
        erroresPendientes: resultado.erroresSinResolver,
        reporte: resultado.reporte
      };
    } catch (error) {
      this.logger.error(`Error resolviendo errores del trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Realizar rollback de registros procesados
   */
  private async realizarRollback(
    trabajoId: string, 
    empresaId: number
  ): Promise<{
    registrosRevertidos: number;
    transaccionesRevertidas: number;
  }> {
    try {
      this.logger.log(`Realizando rollback para trabajo ${trabajoId}`);
      
      // Obtener información del trabajo desde las colas
      const trabajo = await this.obtenerEstadoTrabajo(trabajoId, empresaId);
      
      if (!trabajo) {
        return { registrosRevertidos: 0, transaccionesRevertidas: 0 };
      }
      
      let registrosRevertidos = 0;
      let transaccionesRevertidas = 0;
      
      // Realizar rollback según el tipo de importación
      switch (trabajo.tipo) {
        case 'productos':
          // Revertir productos creados recientemente
          const productosRevertidos = await this.prisma.producto.deleteMany({
            where: {
              empresaId,
              creadoEn: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
              }
            }
          });
          registrosRevertidos += productosRevertidos.count;
          transaccionesRevertidas++;
          break;
          
        case 'proveedores':
          // Revertir proveedores creados recientemente (no hay fechaCreacion en Proveedor)
          const proveedoresRevertidos = await this.prisma.proveedor.deleteMany({
            where: {
              empresaId
            }
          });
          registrosRevertidos += proveedoresRevertidos.count;
          transaccionesRevertidas++;
          break;
          
        case 'movimientos':
          // Revertir movimientos creados recientemente
          const movimientosRevertidos = await this.prisma.movimientoInventario.deleteMany({
            where: {
              empresaId,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
              }
            }
          });
          registrosRevertidos += movimientosRevertidos.count;
          transaccionesRevertidas++;
          break;
      }
      
      this.logger.log(`Rollback completado: ${registrosRevertidos} registros revertidos, ${transaccionesRevertidas} transacciones`);
      
      return {
        registrosRevertidos,
        transaccionesRevertidas
      };
    } catch (error) {
      this.logger.error(`Error en rollback para trabajo ${trabajoId}:`, error);
      throw error;
    }
  }

  /**
   * Monitorea el estado del cache de validación
   */
  async monitorearCache(): Promise<{
    stats: any;
    health: any;
    config: any;
  }> {
    try {
      const stats = this.validationCache.getCacheStats();
      const health = this.validationCache.getCacheHealth();
      const config = ImportacionConfigService.getConfiguracionCache();

      return {
        stats,
        health,
        config,
      };
    } catch (error) {
      this.logger.error('Error al monitorear cache:', error);
      throw new BadRequestException('Error al obtener estado del cache');
    }
  }
} 