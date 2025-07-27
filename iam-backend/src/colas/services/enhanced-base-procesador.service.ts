import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportacionCacheService } from '../../importacion/servicios/importacion-cache.service';
import { AdvancedLoggingService } from '../../importacion/services/advanced-logging.service';
import { SmartErrorResolverService } from '../../importacion/services/smart-error-resolver.service';
import { ImportacionProgressTrackerService } from '../../importacion/services/importacion-progress-tracker.service';
import { 
  TrabajoImportacion, 
  ResultadoImportacion, 
  ErrorImportacion, 
  EstadoTrabajo,
  RegistroImportacion,
  DatosExcel
} from '../interfaces/trabajo-importacion.interface';
import { 
  BaseProcesadorInterface, 
  ProcesadorConfig, 
  LoteProcesador 
} from '../interfaces/base-procesador.interface';
import * as XLSX from 'xlsx';
import * as path from 'path';

@Injectable()
export abstract class EnhancedBaseProcesadorService implements BaseProcesadorInterface {
  protected readonly logger: Logger;
  protected readonly config: ProcesadorConfig;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly cacheService: ImportacionCacheService,
    protected readonly advancedLogging: AdvancedLoggingService,
    protected readonly smartErrorResolver: SmartErrorResolverService,
    protected readonly progressTracker: ImportacionProgressTrackerService,
    loggerName: string,
    config: Partial<ProcesadorConfig> = {}
  ) {
    this.logger = new Logger(loggerName);
    this.config = {
      loteSize: 100,
      maxRetries: 3,
      timeout: 30000,
      enableCache: true,
      cacheTTL: 1800,
      ...config
    };
  }

  abstract procesar(trabajo: TrabajoImportacion, job: Job): Promise<ResultadoImportacion>;

  protected async procesarArchivoBase(
    trabajo: TrabajoImportacion, 
    job: Job,
    loteProcesador: LoteProcesador
  ): Promise<ResultadoImportacion> {
    const inicio = Date.now();

    // Inicializar servicios avanzados
    this.advancedLogging.iniciarTracking(trabajo.id, {
      trabajoId: trabajo.id,
      empresaId: trabajo.empresaId,
      usuarioId: trabajo.usuarioId,
      tipoImportacion: trabajo.tipo,
      archivo: trabajo.archivoOriginal,
    });

    this.progressTracker.iniciarTracking(trabajo.id, trabajo.tipo, trabajo.totalRegistros);

    const resultado: ResultadoImportacion = {
      trabajoId: trabajo.id,
      estado: EstadoTrabajo.PROCESANDO,
      estadisticas: {
        total: 0,
        exitosos: 0,
        errores: 0,
        duplicados: 0,
      },
      errores: [],
      tiempoProcesamiento: 0,
    };

    try {
      // Log de inicio
      this.advancedLogging.log('info', 'Iniciando procesamiento de archivo', {
        trabajoId: trabajo.id,
        empresaId: trabajo.empresaId,
        usuarioId: trabajo.usuarioId,
        tipoImportacion: trabajo.tipo,
        archivo: trabajo.archivoOriginal,
        etapa: 'inicio',
        timestamp: new Date(),
      });

      // 1. Leer archivo Excel
      this.progressTracker.actualizarProgreso({
        trabajoId: trabajo.id,
        etapa: 'validacion',
        progreso: 10,
        registrosProcesados: 0,
        registrosTotal: trabajo.totalRegistros,
        errores: [],
        mensaje: 'Leyendo archivo Excel...',
        timestamp: new Date(),
      });

      const datos = await this.leerArchivoExcel(trabajo.archivoOriginal);
      resultado.estadisticas.total = datos.length;

      this.advancedLogging.log('info', 'Archivo leído correctamente', {
        trabajoId: trabajo.id,
        empresaId: trabajo.empresaId,
        usuarioId: trabajo.usuarioId,
        tipoImportacion: trabajo.tipo,
        archivo: trabajo.archivoOriginal,
        etapa: 'lectura',
        timestamp: new Date(),
      }, { registrosEncontrados: datos.length });

      // 2. Validar estructura del archivo
      this.progressTracker.actualizarProgreso({
        trabajoId: trabajo.id,
        etapa: 'validacion',
        progreso: 30,
        registrosProcesados: 0,
        registrosTotal: datos.length,
        errores: [],
        mensaje: 'Validando estructura del archivo...',
        timestamp: new Date(),
      });

      const erroresValidacion = this.validarEstructuraArchivoBase(datos);
      if (erroresValidacion.length > 0) {
        resultado.errores.push(...erroresValidacion);
        resultado.estadisticas.errores = erroresValidacion.length;
        resultado.estado = EstadoTrabajo.ERROR;

        this.progressTracker.marcarEtapaConError(trabajo.id, 'validacion', 'Errores de validación encontrados', erroresValidacion);
        
        this.advancedLogging.log('error', 'Errores de validación en archivo', {
          trabajoId: trabajo.id,
          empresaId: trabajo.empresaId,
          usuarioId: trabajo.usuarioId,
          tipoImportacion: trabajo.tipo,
          archivo: trabajo.archivoOriginal,
          etapa: 'validacion',
          timestamp: new Date(),
        }, { erroresEncontrados: erroresValidacion.length }, erroresValidacion);

        return resultado;
      }

      this.progressTracker.completarEtapa(trabajo.id, 'validacion');

      // 3. Procesar registros en lotes
      this.progressTracker.actualizarProgreso({
        trabajoId: trabajo.id,
        etapa: 'procesamiento',
        progreso: 0,
        registrosProcesados: 0,
        registrosTotal: datos.length,
        errores: [],
        mensaje: 'Iniciando procesamiento de registros...',
        timestamp: new Date(),
      });

      for (let i = 0; i < datos.length; i += this.config.loteSize) {
        const lote = datos.slice(i, i + this.config.loteSize);
        await loteProcesador.procesarLote(lote, trabajo, resultado, job);
        
        // Actualizar progreso
        const registrosProcesados = Math.min(i + this.config.loteSize, datos.length);
        const progreso = Math.round((registrosProcesados / datos.length) * 100);
        
        this.progressTracker.actualizarProgreso({
          trabajoId: trabajo.id,
          etapa: 'procesamiento',
          progreso: progreso,
          registrosProcesados: registrosProcesados,
          registrosTotal: datos.length,
          errores: resultado.errores.slice(-10), // Últimos 10 errores
          mensaje: `Procesando lote ${Math.floor(i / this.config.loteSize) + 1}/${Math.ceil(datos.length / this.config.loteSize)}`,
          timestamp: new Date(),
        });

        // Actualizar métricas
        this.advancedLogging.actualizarMetricas(trabajo.id, {
          registrosProcesados: registrosProcesados,
          registrosExitosos: resultado.estadisticas.exitosos,
          registrosConError: resultado.estadisticas.errores,
        });

        // Actualizar progreso de BullMQ
        await job.updateProgress(Math.min(progreso, 100));
      }

      this.progressTracker.completarEtapa(trabajo.id, 'procesamiento');

      // 4. Resolver errores inteligentemente si es necesario
      if (resultado.errores.length > 0) {
        this.progressTracker.actualizarProgreso({
          trabajoId: trabajo.id,
          etapa: 'guardado',
          progreso: 50,
          registrosProcesados: datos.length,
          registrosTotal: datos.length,
          errores: resultado.errores,
          mensaje: 'Analizando errores para corrección automática...',
          timestamp: new Date(),
        });

        const resolucionErrores = this.smartErrorResolver.resolverErrores(
          resultado.errores,
          trabajo.tipo,
          datos[0] || {}
        );

        if (resolucionErrores.erroresResueltos.length > 0) {
          this.advancedLogging.log('info', 'Errores resueltos automáticamente', {
            trabajoId: trabajo.id,
            empresaId: trabajo.empresaId,
            usuarioId: trabajo.usuarioId,
            tipoImportacion: trabajo.tipo,
            archivo: trabajo.archivoOriginal,
            etapa: 'resolucion_errores',
            timestamp: new Date(),
          }, { 
            erroresResueltos: resolucionErrores.erroresResueltos.length,
            erroresSinResolver: resolucionErrores.erroresSinResolver.length 
          });
        }
      }

      // 5. Generar archivo de resultados si hay errores
      if (resultado.errores.length > 0) {
        this.progressTracker.actualizarProgreso({
          trabajoId: trabajo.id,
          etapa: 'guardado',
          progreso: 80,
          registrosProcesados: datos.length,
          registrosTotal: datos.length,
          errores: resultado.errores,
          mensaje: 'Generando reporte de errores...',
          timestamp: new Date(),
        });

        resultado.archivoResultado = await this.generarArchivoErrores(trabajo, resultado.errores);
      }

      // 6. Finalizar
      this.progressTracker.actualizarProgreso({
        trabajoId: trabajo.id,
        etapa: 'finalizacion',
        progreso: 100,
        registrosProcesados: datos.length,
        registrosTotal: datos.length,
        errores: resultado.errores,
        mensaje: 'Finalizando importación...',
        timestamp: new Date(),
      });

      resultado.estado = EstadoTrabajo.COMPLETADO;
      resultado.tiempoProcesamiento = Date.now() - inicio;

      // Actualizar estadísticas finales
      this.progressTracker.actualizarEstadisticas(
        trabajo.id,
        resultado.estadisticas.exitosos,
        resultado.estadisticas.errores
      );

      // Finalizar tracking
      this.progressTracker.finalizarTracking(trabajo.id);
      this.advancedLogging.finalizarTracking(trabajo.id);

      this.logger.log(`✅ Importación completada: ${resultado.estadisticas.exitosos}/${resultado.estadisticas.total} registros exitosos`);

      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error en procesamiento:`, error);
      
      resultado.estado = EstadoTrabajo.ERROR;
      resultado.tiempoProcesamiento = Date.now() - inicio;

      this.progressTracker.marcarEtapaConError(trabajo.id, 'procesamiento', error.message);
      
      this.advancedLogging.log('error', 'Error durante el procesamiento', {
        trabajoId: trabajo.id,
        empresaId: trabajo.empresaId,
        usuarioId: trabajo.usuarioId,
        tipoImportacion: trabajo.tipo,
        archivo: trabajo.archivoOriginal,
        etapa: 'error',
        timestamp: new Date(),
      }, { error: error.message });

      return resultado;
    }
  }

  // Métodos heredados del procesador base original
  protected async leerArchivoExcel(archivoPath: string): Promise<RegistroImportacion[]> {
    try {
      const workbook = XLSX.readFile(archivoPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (datos.length < 2) {
        throw new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
      }

      const encabezados = datos[0] as string[];
      const filas = datos.slice(1) as any[][];

      return filas.map((fila, index) => {
        const registro: RegistroImportacion = {
          _filaOriginal: index + 2, // +2 porque empezamos desde la fila 2 (después de encabezados)
        };

        encabezados.forEach((encabezado, colIndex) => {
          if (encabezado) {
            const nombreNormalizado = this.normalizarNombreColumna(encabezado);
            registro[nombreNormalizado] = fila[colIndex] || null;
          }
        });

        return registro;
      });
    } catch (error) {
      this.logger.error(`Error leyendo archivo Excel: ${archivoPath}`, error);
      throw new Error(`Error leyendo archivo Excel: ${error.message}`);
    }
  }

  private normalizarNombreColumna(encabezado: string): string {
    return encabezado
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/^_+|_+$/g, '');
  }

  protected validarEstructuraArchivoBase(datos: RegistroImportacion[]): ErrorImportacion[] {
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

    // Validación básica de estructura
    const primerRegistro = datos[0];
    const camposRequeridos = this.obtenerCamposRequeridos();

    camposRequeridos.forEach(campo => {
      if (!(campo in primerRegistro) || primerRegistro[campo] === null || primerRegistro[campo] === undefined) {
        errores.push({
          fila: 1,
          columna: campo,
          valor: '',
          mensaje: `Campo requerido no encontrado: ${campo}`,
          tipo: 'validacion',
        });
      }
    });

    return errores;
  }

  protected abstract obtenerCamposRequeridos(): string[];

  protected async generarArchivoErrores(trabajo: TrabajoImportacion, errores: ErrorImportacion[]): Promise<string> {
    // Implementación básica - se puede mejorar
    const timestamp = Date.now();
    const nombreArchivo = `errores-${trabajo.tipo}-${timestamp}.json`;
    const rutaArchivo = path.join(process.cwd(), 'uploads', 'reportes', nombreArchivo);
    
    // Asegurar que el directorio existe
    const dir = path.dirname(rutaArchivo);
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }

    require('fs').writeFileSync(rutaArchivo, JSON.stringify(errores, null, 2));
    return rutaArchivo;
  }

  protected async procesarConRetry<T>(
    operacion: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let ultimoError: Error = new Error('Error desconocido');

    for (let intento = 1; intento <= maxRetries; intento++) {
      try {
        return await operacion();
      } catch (error) {
        ultimoError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Intento ${intento}/${maxRetries} falló:`, ultimoError.message);

        if (intento < maxRetries) {
          await this.delay(Math.pow(2, intento) * 1000); // Backoff exponencial
        }
      }
    }

    throw ultimoError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 