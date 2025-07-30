import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportacionCacheService } from '../../importacion/servicios/importacion-cache.service';
import { AdvancedLoggingService } from '../../importacion/services/advanced-logging.service';
import { SmartErrorResolverService } from '../../importacion/services/smart-error-resolver.service';
import { ImportacionProgressTrackerService } from '../../importacion/services/importacion-progress-tracker.service';
import { ImportacionWebSocketService } from '../../importacion/servicios/importacion-websocket.service';
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
    protected readonly websocketService: ImportacionWebSocketService,
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

    // Emitir evento de trabajo creado
    this.websocketService.emitTrabajoCreado(trabajo);

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

      // Emitir progreso actualizado
      this.websocketService.emitProgresoActualizado(
        trabajo.empresaId,
        trabajo.id,
        10,
        0,
        0,
        0,
        'PROCESANDO',
        'Archivo leído correctamente'
      );

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

        // Crear un error de validación unificado
        const errorValidacion: ErrorImportacion = {
          fila: 0,
          columna: 'estructura',
          valor: 'archivo',
          mensaje: 'Errores de validación encontrados',
          tipo: 'validacion'
        };
        
        this.progressTracker.marcarEtapaConError(trabajo.id, 'validacion', errorValidacion);
        
        // Emitir error de validación
        this.websocketService.emitErrorValidacion(
          trabajo.empresaId,
          trabajo.id,
          1,
          'estructura',
          'archivo',
          'Errores de validación en estructura del archivo',
          'validacion'
        );

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

      // Emitir progreso actualizado después de validación exitosa
      this.websocketService.emitProgresoActualizado(
        trabajo.empresaId,
        trabajo.id,
        30,
        0,
        0,
        0,
        'PROCESANDO',
        'Validación de estructura completada'
      );

      // 3. Procesar registros en lotes
      this.progressTracker.actualizarProgreso({
        trabajoId: trabajo.id,
        etapa: 'procesamiento',
        progreso: 40,
        registrosProcesados: 0,
        registrosTotal: datos.length,
        errores: [],
        mensaje: 'Procesando registros...',
        timestamp: new Date(),
      });

      for (let i = 0; i < datos.length; i += this.config.loteSize) {
        const lote = datos.slice(i, i + this.config.loteSize);
        await loteProcesador.procesarLote(lote, trabajo, resultado, job);
        
        // Actualizar progreso usando el método nativo de BullMQ
        const registrosProcesados = Math.min(i + this.config.loteSize, datos.length);
        const progreso = Math.round((registrosProcesados / datos.length) * 100);
        await job.updateProgress(Math.min(progreso, 100));

        // Emitir progreso actualizado
        this.websocketService.emitProgresoActualizado(
          trabajo.empresaId,
          trabajo.id,
          progreso,
          registrosProcesados,
          resultado.estadisticas.exitosos,
          resultado.estadisticas.errores,
          'PROCESANDO',
          `Procesados ${registrosProcesados}/${datos.length} registros`
        );

        // Actualizar el trabajo en cache
        trabajo.progreso = progreso;
        trabajo.registrosProcesados = registrosProcesados;
        trabajo.registrosExitosos = resultado.estadisticas.exitosos;
        trabajo.registrosConError = resultado.estadisticas.errores;
        await this.cacheService.setTrabajoCache(trabajo.id, trabajo);
      }

      // 4. Generar archivo de resultados si hay errores
      if (resultado.errores.length > 0) {
        resultado.archivoResultado = await this.generarArchivoErrores(trabajo, resultado.errores);
      }

      resultado.estado = EstadoTrabajo.COMPLETADO;
      resultado.tiempoProcesamiento = Date.now() - inicio;

      // Emitir trabajo completado
      this.websocketService.emitTrabajoCompletado(trabajo);

      this.logger.log(`Importación completada: ${resultado.estadisticas.exitosos}/${resultado.estadisticas.total} registros`);

      return resultado;

    } catch (error) {
      this.logger.error(`Error procesando importación de ${trabajo.tipo}:`, error);
      
      // Emitir error
      this.websocketService.emitTrabajoError(trabajo);
      
      throw new Error(`Error procesando importación: ${error.message}`);
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