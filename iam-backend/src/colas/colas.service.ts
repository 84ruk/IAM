import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { TrabajoImportacion, EstadoTrabajo, ResultadoImportacion } from './interfaces/trabajo-importacion.interface';
import { ImportacionProductosProcesador } from './procesadores/importacion-productos.procesador';
import { ImportacionProveedoresProcesador } from './procesadores/importacion-proveedores.procesador';
import { ImportacionMovimientosProcesador } from './procesadores/importacion-movimientos.procesador';

@Injectable()
export class ColasService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ColasService.name);
  private redis: Redis;
  private importacionQueue: Queue;
  private importacionWorker: Worker;


  constructor(
    private configService: ConfigService,
    private importacionProductosProcesador: ImportacionProductosProcesador,
    private importacionProveedoresProcesador: ImportacionProveedoresProcesador,
    private importacionMovimientosProcesador: ImportacionMovimientosProcesador,
  ) {}

  async onModuleInit() {
    await this.inicializarRedis();
    await this.inicializarColas();
    await this.inicializarWorkers();
    this.logger.log('✅ Servicio de colas inicializado correctamente');
  }

  async onModuleDestroy() {
    await this.cerrarConexiones();
    this.logger.log('🔌 Conexiones de colas cerradas');
  }

  private async inicializarRedis() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // BullMQ requiere que sea null
      enableReadyCheck: false,
    });

    this.redis.on('error', (error) => {
      this.logger.error('❌ Error de conexión Redis:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('🔗 Conectado a Redis');
    });
  }

  private async inicializarColas() {
    this.importacionQueue = new Queue('importacion', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100, // Mantener últimos 100 trabajos completados
        removeOnFail: 50,      // Mantener últimos 50 trabajos fallidos
        attempts: 3,           // Reintentar hasta 3 veces
        backoff: {
          type: 'exponential',
          delay: 2000,         // 2 segundos inicial
        },
      },
    });



    this.logger.log('📋 Cola de importación inicializada');
  }

  private async inicializarWorkers() {
    this.importacionWorker = new Worker(
      'importacion',
      async (job: Job) => {
        return await this.procesarTrabajoImportacion(job);
      },
      {
        connection: this.redis,
        concurrency: 2, // Procesar máximo 2 trabajos simultáneos
        autorun: true,
      }
    );

    // Eventos del worker
    this.importacionWorker.on('completed', (job: Job, result: ResultadoImportacion) => {
      this.logger.log(`✅ Trabajo ${job.id} completado: ${result.estadisticas.exitosos}/${result.estadisticas.total} registros`);
    });

    this.importacionWorker.on('failed', (job: Job, err: Error) => {
      this.logger.error(`❌ Trabajo ${job.id} fallido:`, err.message);
    });

    this.importacionWorker.on('progress', (job: Job, progress: number) => {
      this.logger.log(`📊 Progreso trabajo ${job.id}: ${progress}%`);
    });

    this.logger.log('👷 Worker de importación inicializado');
  }

  private async procesarTrabajoImportacion(job: Job): Promise<ResultadoImportacion> {
    const trabajo: TrabajoImportacion = job.data;
    const inicio = Date.now();

    this.logger.log(`🚀 Iniciando procesamiento de ${trabajo.tipo} para empresa ${trabajo.empresaId}`);

    try {
      let resultado: ResultadoImportacion;

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

      resultado.tiempoProcesamiento = Date.now() - inicio;
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error procesando trabajo ${job.id}:`, error);
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

    const job = await this.importacionQueue.add(
      `importacion-${trabajo.tipo}`,
      trabajoCompleto,
      {
        jobId: trabajoCompleto.id,
        priority: this.obtenerPrioridad(trabajo.tipo),
        delay: 0,
      }
    );

    this.logger.log(`📝 Trabajo creado: ${job.id} (${trabajo.tipo})`);
    return trabajoCompleto.id;
  }

  async obtenerTrabajoImportacion(trabajoId: string): Promise<TrabajoImportacion | null> {
    const job = await this.importacionQueue.getJob(trabajoId);
    if (!job) return null;

    const estado = await job.getState();
    const progreso = await job.progress();
    const data = job.data as TrabajoImportacion;

    return {
      ...data,
      estado: this.mapearEstadoBullMQ(estado),
      progreso: typeof progreso === 'number' ? progreso : 0,
    };
  }

  async obtenerEstadoTrabajo(trabajoId: string): Promise<TrabajoImportacion | null> {
    return this.obtenerTrabajoImportacion(trabajoId);
  }

  async cancelarTrabajo(trabajoId: string): Promise<boolean> {
    const job = await this.importacionQueue.getJob(trabajoId);
    if (!job) return false;

    await job.moveToFailed(new Error('Trabajo cancelado por el usuario'), '0');
    this.logger.log(`🚫 Trabajo ${trabajoId} cancelado`);
    return true;
  }

  async obtenerTrabajosEmpresa(empresaId: number, limite: number = 50): Promise<TrabajoImportacion[]> {
    const jobs = await this.importacionQueue.getJobs(['completed', 'failed', 'waiting', 'active'], 0, limite);
    
    return jobs
      .filter(job => job.data.empresaId === empresaId)
      .map(job => ({
        ...job.data,
        estado: this.mapearEstadoBullMQ(job.getState()),
        progreso: job.progress() || 0,
      }));
  }

  async listarTrabajosEmpresa(empresaId: number, limit: number = 50, offset: number = 0): Promise<TrabajoImportacion[]> {
    const jobs = await this.importacionQueue.getJobs(['completed', 'failed', 'waiting', 'active'], offset, offset + limit);
    
    return jobs
      .filter(job => job.data.empresaId === empresaId)
      .map(job => ({
        ...job.data,
        estado: this.mapearEstadoBullMQ(job.getState()),
        progreso: job.progress() || 0,
      }));
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

  // Métodos auxiliares
  private generarIdTrabajo(): string {
    return `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private obtenerPrioridad(tipo: string): number {
    const prioridades = {
      'movimientos': 1,    // Mayor prioridad
      'productos': 2,
      'proveedores': 3,    // Menor prioridad
    };
    return prioridades[tipo] || 2;
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