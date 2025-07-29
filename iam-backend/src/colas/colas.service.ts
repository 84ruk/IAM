import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { TrabajoImportacion, EstadoTrabajo, ResultadoImportacion } from './interfaces/trabajo-importacion.interface';
import { ImportacionProductosProcesador } from './procesadores/importacion-productos.procesador';
import { ImportacionProveedoresProcesador } from './procesadores/importacion-proveedores.procesador';
import { ImportacionMovimientosProcesador } from './procesadores/importacion-movimientos.procesador';
import { ImportacionUnificadaProcesador } from './procesadores/importacion-unificada.procesador';
import { RedisConfigService } from '../common/services/redis-config.service';
import { ColasConfigService } from './services/colas-config.service';
import { TrabajoSerializerService } from './services/trabajo-serializer.service';
import { ImportacionCacheService } from '../importacion/servicios/importacion-cache.service';

@Injectable()
export class ColasService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ColasService.name);
  private redis: Redis;
  private importacionQueue: Queue;
  private importacionWorker: Worker;


  constructor(
    private configService: ConfigService,
    private redisConfigService: RedisConfigService,
    private colasConfigService: ColasConfigService,
    private trabajoSerializerService: TrabajoSerializerService,
    private importacionProductosProcesador: ImportacionProductosProcesador,
    private importacionProveedoresProcesador: ImportacionProveedoresProcesador,
    private importacionMovimientosProcesador: ImportacionMovimientosProcesador,
    private importacionUnificadaProcesador: ImportacionUnificadaProcesador,
    private cacheService: ImportacionCacheService,
  ) {}

  async onModuleInit() {
    await this.inicializarRedis();
    await this.inicializarColas();
    await this.inicializarWorkers();
    this.logger.log('Servicio de colas inicializado correctamente');
  }

  async onModuleDestroy() {
    await this.cerrarConexiones();
    this.logger.log('Conexiones de colas cerradas');
  }

  private async inicializarRedis() {
    if (!this.redisConfigService.isRedisConfigured()) {
      this.logger.error('Redis no configurado, colas de procesamiento no pueden funcionar');
      throw new Error('Redis configuration required for queue processing');
    }

    try {
      const redisConfig = this.redisConfigService.getIORedisConfig();
      const redisOptions = this.colasConfigService.getRedisConfig();
      this.redis = new Redis(redisConfig, redisOptions);

      this.redis.on('error', (error) => {
        this.logger.error('Error de conexión Redis:', error);
      });

      this.redis.on('connect', () => {
        this.logger.log('Conectado a Redis para BullMQ');
      });

      this.redis.on('ready', () => {
        this.logger.log('Redis listo para BullMQ');
      });

      this.redis.on('close', () => {
        this.logger.warn('Conexión Redis cerrada');
      });

      this.redis.on('reconnecting', () => {
        this.logger.log('Reconectando a Redis...');
      });

      // Conectar explícitamente
      await this.redis.connect();
    } catch (error) {
      this.logger.error('Error inicializando Redis para BullMQ:', error);
      throw new Error(`Redis initialization failed: ${error.message}`);
    }
  }

  private async inicializarColas() {
    const queueConfig = this.colasConfigService.getQueueConfig();
    
    this.importacionQueue = new Queue('importacion', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: queueConfig.removeOnComplete,
        removeOnFail: queueConfig.removeOnFail,
        attempts: queueConfig.attempts,
        backoff: {
          type: queueConfig.backoffType,
          delay: queueConfig.backoffDelay,
        },
      },
    });

    this.logger.log('Cola de importación inicializada');
  }

  private async inicializarWorkers() {
    const workerConfig = this.colasConfigService.getWorkerConfig();
    
    this.importacionWorker = new Worker(
      'importacion',
      async (job: Job) => {
        return await this.procesarTrabajoImportacion(job);
      },
      {
        connection: this.redis,
        concurrency: workerConfig.concurrency,
        autorun: workerConfig.autorun,
      }
    );

    // Eventos del worker
    this.importacionWorker.on('completed', (job: Job, result: ResultadoImportacion) => {
      this.logger.log(`Trabajo ${job.id} completado: ${result.estadisticas.exitosos}/${result.estadisticas.total} registros`);
    });

    this.importacionWorker.on('failed', (job: Job, err: Error) => {
      this.logger.error(`Trabajo ${job.id} fallido:`, err.message);
    });

    this.importacionWorker.on('active', (job: Job) => {
      this.logger.log(`Trabajo ${job.id} activo - procesando...`);
    });

    this.importacionWorker.on('progress', (job: Job, progress: number) => {
      this.logger.log(`Progreso trabajo ${job.id}: ${progress}%`);
    });

    this.logger.log('Worker de importación inicializado');
  }

  private async procesarTrabajoImportacion(job: Job): Promise<ResultadoImportacion> {
    const trabajo: TrabajoImportacion = job.data;
    const inicio = Date.now();

    try {
      let resultado: ResultadoImportacion;

      // Usar el procesador unificado para todos los tipos
      if (this.importacionUnificadaProcesador.esTipoSoportado(trabajo.tipo)) {
        resultado = await this.importacionUnificadaProcesador.procesar(trabajo, job);
      } else {
        // Fallback a procesadores específicos si es necesario
      switch (trabajo.tipo) {
        case 'productos':
          resultado = await this.importacionProductosProcesador.procesar(trabajo, job);
          break;
        case 'proveedores':
          resultado = await this.importacionProveedoresProcesador.procesar(trabajo, job);
          break;
        case 'movimientos':
          resultado = await this.importacionMovimientosProcesador.procesar(trabajo, job);
          break;
        default:
          throw new Error(`Tipo de importación no soportado: ${trabajo.tipo}`);
        }
      }

      resultado.tiempoProcesamiento = Date.now() - inicio;
      return resultado;

    } catch (error) {
      this.logger.error(`Error procesando trabajo ${job.id}:`, error);
      throw error;
    }
  }

  // Métodos públicos para el controlador
  async crearTrabajoImportacion(trabajo: Omit<TrabajoImportacion, 'id' | 'estado' | 'progreso' | 'fechaCreacion'>): Promise<string> {
    const trabajoCompleto: TrabajoImportacion = {
      ...trabajo,
      id: this.generarIdTrabajo(),
      estado: EstadoTrabajo.PENDIENTE,
      progreso: 0,
      fechaCreacion: new Date(),
    };

    // Validar integridad del trabajo antes de serializar
    if (!this.trabajoSerializerService.validarIntegridadTrabajo(trabajoCompleto)) {
      throw new Error('Datos del trabajo inválidos');
    }

    // Serializar el trabajo para almacenamiento
    const trabajoSerializado = this.trabajoSerializerService.serializeTrabajo(trabajoCompleto);
    
    const job = await this.importacionQueue.add(
      `importacion-${trabajo.tipo}`,
      trabajoSerializado,
      {
        jobId: trabajoCompleto.id,
        priority: this.obtenerPrioridad(trabajo.tipo),
        delay: 0,
      }
    );

    this.logger.log(`Trabajo ${trabajoCompleto.id} agregado a la cola`);
    
    return trabajoCompleto.id;
  }

  async obtenerTrabajoImportacion(trabajoId: string): Promise<TrabajoImportacion | null> {
    try {
      // Primero intentar obtener del cache (datos más actualizados)
      const trabajoCache = await this.cacheService.getTrabajoCache(trabajoId);
      if (trabajoCache) {
        this.logger.debug(`📦 Trabajo ${trabajoId} obtenido desde cache`);
        return trabajoCache;
      }

      // Si no está en cache, obtener desde BullMQ
      const job = await this.importacionQueue.getJob(trabajoId);
      if (!job) {
        return null;
      }

      const estado = await job.getState();
      const progreso = job.progress || 0;

      // Deserializar el trabajo usando el servicio
      const trabajoDeserializado = this.trabajoSerializerService.deserializeTrabajo(job.data);

      // Actualizar estado y progreso desde BullMQ
      const trabajoCompleto = {
        ...trabajoDeserializado,
        estado: this.mapearEstadoBullMQ(estado),
        progreso: typeof progreso === 'number' ? progreso : 0,
      };

      // Validar integridad del trabajo deserializado
      if (!this.trabajoSerializerService.validarIntegridadTrabajo(trabajoCompleto)) {
        this.logger.error(`Trabajo ${trabajoId} no pasa validación de integridad`);
        return null;
      }

      // Guardar en cache para futuras consultas
      await this.cacheService.setTrabajoCache(trabajoId, trabajoCompleto);

      this.logger.debug(`📦 Trabajo ${trabajoId} obtenido desde BullMQ y cacheado`);
      return trabajoCompleto;
    } catch (error) {
      this.logger.error(`Error obteniendo trabajo ${trabajoId}:`, error);
      return null;
    }
  }

  async obtenerEstadoTrabajo(trabajoId: string): Promise<TrabajoImportacion | null> {
    return this.obtenerTrabajoImportacion(trabajoId);
  }

  async cancelarTrabajo(trabajoId: string): Promise<boolean> {
    const job = await this.importacionQueue.getJob(trabajoId);
    if (!job) return false;

    await job.moveToFailed(new Error('Trabajo cancelado por el usuario'), '0');
    this.logger.log(`Trabajo ${trabajoId} cancelado`);
    return true;
  }

  async obtenerTrabajosEmpresa(empresaId: number, limite: number = 50): Promise<TrabajoImportacion[]> {
    try {
      const jobs = await this.importacionQueue.getJobs(['completed', 'failed', 'waiting', 'active'], 0, limite);
      
      const trabajosFiltrados: TrabajoImportacion[] = [];
      
      for (const job of jobs) {
        try {
          if (job.data.empresaId === empresaId) {
            const estado = await job.getState();
            const trabajoData = job.data as TrabajoImportacion;
            trabajosFiltrados.push({
              ...trabajoData,
              estado: this.mapearEstadoBullMQ(estado),
              progreso: job.progress || trabajoData.progreso || 0,
            });
          }
        } catch (error) {
          this.logger.warn(`Error procesando trabajo ${job.id}:`, error);
          // Continuar con el siguiente trabajo
        }
      }
      
      return trabajosFiltrados;
    } catch (error) {
      this.logger.error(`Error obteniendo trabajos para empresa ${empresaId}:`, error);
      throw error;
    }
  }

  async listarTrabajosEmpresa(empresaId: number, limit: number = 50, offset: number = 0): Promise<TrabajoImportacion[]> {
    try {
      const jobs = await this.importacionQueue.getJobs(['completed', 'failed', 'waiting', 'active'], offset, offset + limit);
      
      const trabajosFiltrados: TrabajoImportacion[] = [];
      
      for (const job of jobs) {
        try {
          if (job.data.empresaId === empresaId) {
            const estado = await job.getState();
            const trabajoData = job.data as TrabajoImportacion;
            trabajosFiltrados.push({
              ...trabajoData,
              estado: this.mapearEstadoBullMQ(estado),
              progreso: job.progress || trabajoData.progreso || 0,
            });
          }
        } catch (error) {
          this.logger.warn(`Error procesando trabajo ${job.id}:`, error);
          // Continuar con el siguiente trabajo
        }
      }
      
      return trabajosFiltrados;
    } catch (error) {
      this.logger.error(`Error listando trabajos para empresa ${empresaId}:`, error);
      throw error;
    }
  }

  async contarTrabajosEmpresa(empresaId: number): Promise<number> {
    const jobs = await this.importacionQueue.getJobs(['completed', 'failed', 'waiting', 'active'], 0, -1);
    return jobs.filter(job => job.data.empresaId === empresaId).length;
  }

  async cancelarTrabajoImportacion(trabajoId: string): Promise<void> {
    const job = await this.importacionQueue.getJob(trabajoId);
    if (!job) {
      throw new Error('Trabajo no encontrado');
    }

    await job.moveToFailed(new Error('Trabajo cancelado por el usuario'), '0');
    this.logger.log(`🚫 Trabajo ${trabajoId} cancelado`);
  }

  async generarReporteErrores(trabajoId: string): Promise<string> {
    const trabajo = await this.obtenerEstadoTrabajo(trabajoId);
    if (!trabajo || !trabajo.errores || trabajo.errores.length === 0) {
      throw new Error('No hay errores para reportar');
    }

    // Implementar generación de reporte Excel
    const reportePath = `./uploads/reportes/errores-${trabajoId}.xlsx`;
    // TODO: Implementar generación de Excel con errores
    return reportePath;
  }

  /**
   * Limpia trabajos antiguos de la cola
   */
  async limpiarTrabajosAntiguos(diasAntiguedad: number = 7): Promise<void> {
    try {
      this.logger.log(`🧹 Limpiando trabajos más antiguos de ${diasAntiguedad} días...`);
      
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
      
      const trabajosCompletados = await this.importacionQueue.getJobs(['completed', 'failed']);
      let trabajosEliminados = 0;
      
      for (const job of trabajosCompletados) {
        if (job.finishedOn && new Date(job.finishedOn) < fechaLimite) {
          await job.remove();
          trabajosEliminados++;
        }
      }
      
      this.logger.log(`✅ Limpieza completada: ${trabajosEliminados} trabajos eliminados`);
    } catch (error) {
      this.logger.error('Error limpiando trabajos antiguos:', error);
    }
  }

  /**
   * Obtiene estadísticas de la cola
   */
  async obtenerEstadisticasCola(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.importacionQueue.getWaiting(),
        this.importacionQueue.getActive(),
        this.importacionQueue.getCompleted(),
        this.importacionQueue.getFailed(),
        this.importacionQueue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas de cola:', error);
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  // Métodos auxiliares
  private generarIdTrabajo(): string {
    return `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private obtenerPrioridad(tipo: string): number {
    const prioridades = this.colasConfigService.getPriorities();
    return prioridades[tipo as keyof typeof prioridades] || prioridades.productos;
  }

  private mapearEstadoBullMQ(estadoBullMQ: string): EstadoTrabajo {
    const mapeo = {
      'completed': EstadoTrabajo.COMPLETADO,
      'failed': EstadoTrabajo.ERROR,
      'waiting': EstadoTrabajo.PENDIENTE,
      'active': EstadoTrabajo.PROCESANDO,
      'delayed': EstadoTrabajo.PENDIENTE,
      'paused': EstadoTrabajo.PENDIENTE,
    };
    return mapeo[estadoBullMQ] || EstadoTrabajo.PENDIENTE;
  }

  private async cerrarConexiones() {
    if (this.importacionWorker) {
      await this.importacionWorker.close();
    }

    if (this.importacionQueue) {
      await this.importacionQueue.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
  }
} 