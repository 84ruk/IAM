import { Injectable, Logger } from '@nestjs/common';
import { TrabajoImportacion, EstadoTrabajo, TipoImportacion } from '../interfaces/trabajo-importacion.interface';

export interface TrabajoSerializado {
  id: string;
  tipo: string;
  empresaId: number;
  usuarioId: number;
  archivoOriginal: string;
  totalRegistros: number;
  registrosProcesados: number;
  registrosExitosos: number;
  registrosConError: number;
  errores: any[];
  opciones: any;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  progreso: number;
  estado: string;
}

@Injectable()
export class TrabajoSerializerService {
  private readonly logger = new Logger(TrabajoSerializerService.name);

  /**
   * Serializa un trabajo de importación para almacenamiento en BullMQ
   */
  serializeTrabajo(trabajo: TrabajoImportacion): TrabajoSerializado {
    try {
      const serializado: TrabajoSerializado = {
        id: String(trabajo.id),
        tipo: trabajo.tipo,
        empresaId: Number(trabajo.empresaId),
        usuarioId: Number(trabajo.usuarioId),
        archivoOriginal: String(trabajo.archivoOriginal),
        totalRegistros: Number(trabajo.totalRegistros),
        registrosProcesados: Number(trabajo.registrosProcesados),
        registrosExitosos: Number(trabajo.registrosExitosos),
        registrosConError: Number(trabajo.registrosConError),
        errores: Array.isArray(trabajo.errores) ? trabajo.errores : [],
        opciones: trabajo.opciones || {},
        fechaCreacion: trabajo.fechaCreacion instanceof Date 
          ? trabajo.fechaCreacion.toISOString() 
          : new Date(trabajo.fechaCreacion).toISOString(),
        fechaInicio: trabajo.fechaInicio instanceof Date 
          ? trabajo.fechaInicio.toISOString() 
          : trabajo.fechaInicio ? new Date(trabajo.fechaInicio).toISOString() : undefined,
        fechaFin: trabajo.fechaFin instanceof Date 
          ? trabajo.fechaFin.toISOString() 
          : trabajo.fechaFin ? new Date(trabajo.fechaFin).toISOString() : undefined,
        progreso: Number(trabajo.progreso),
        estado: trabajo.estado,
      };

      this.logger.debug(`📦 Trabajo serializado: ${trabajo.id}`);
      return serializado;
    } catch (error) {
      this.logger.error(`Error serializando trabajo ${trabajo.id}:`, error);
      throw new Error(`Error de serialización: ${error.message}`);
    }
  }

  /**
   * Deserializa un trabajo de importación desde BullMQ
   */
  deserializeTrabajo(datos: any): TrabajoImportacion {
    try {
      // Validar que los datos básicos existan
      if (!datos || typeof datos !== 'object') {
        throw new Error('Datos de trabajo inválidos');
      }

      // Validar campos requeridos
      const camposRequeridos = ['id', 'tipo', 'empresaId', 'usuarioId', 'archivoOriginal'];
      for (const campo of camposRequeridos) {
        if (datos[campo] === undefined || datos[campo] === null) {
          throw new Error(`Campo requerido faltante: ${campo}`);
        }
      }

      const trabajo: TrabajoImportacion = {
        id: String(datos.id),
        tipo: this.validarTipoImportacion(datos.tipo),
        empresaId: Number(datos.empresaId),
        usuarioId: Number(datos.usuarioId),
        archivoOriginal: String(datos.archivoOriginal),
        totalRegistros: Number(datos.totalRegistros) || 0,
        registrosProcesados: Number(datos.registrosProcesados) || 0,
        registrosExitosos: Number(datos.registrosExitosos) || 0,
        registrosConError: Number(datos.registrosConError) || 0,
        errores: Array.isArray(datos.errores) ? datos.errores : [],
        opciones: datos.opciones || {},
        fechaCreacion: this.parsearFecha(datos.fechaCreacion),
        fechaInicio: datos.fechaInicio ? this.parsearFecha(datos.fechaInicio) : undefined,
        fechaFin: datos.fechaFin ? this.parsearFecha(datos.fechaFin) : undefined,
        progreso: Number(datos.progreso) || 0,
        estado: this.validarEstadoTrabajo(datos.estado),
      };

      this.logger.debug(`📦 Trabajo deserializado: ${trabajo.id}`);
      return trabajo;
    } catch (error) {
      this.logger.error(`Error deserializando trabajo:`, error);
      throw new Error(`Error de deserialización: ${error.message}`);
    }
  }

  /**
   * Valida y convierte el tipo de importación
   */
  private validarTipoImportacion(tipo: any): TipoImportacion {
    const tiposValidos = Object.values(TipoImportacion);
    if (tiposValidos.includes(tipo)) {
      return tipo as TipoImportacion;
    }
    this.logger.warn(`Tipo de importación inválido: ${tipo}, usando 'productos' por defecto`);
    return TipoImportacion.PRODUCTOS;
  }

  /**
   * Valida y convierte el estado del trabajo
   */
  private validarEstadoTrabajo(estado: any): EstadoTrabajo {
    const estadosValidos = Object.values(EstadoTrabajo);
    if (estadosValidos.includes(estado)) {
      return estado as EstadoTrabajo;
    }
    this.logger.warn(`Estado de trabajo inválido: ${estado}, usando 'pendiente' por defecto`);
    return EstadoTrabajo.PENDIENTE;
  }

  /**
   * Parsea una fecha de forma segura
   */
  private parsearFecha(fecha: any): Date {
    try {
      if (fecha instanceof Date) {
        return fecha;
      }
      if (typeof fecha === 'string') {
        return new Date(fecha);
      }
      if (typeof fecha === 'number') {
        return new Date(fecha);
      }
      throw new Error(`Formato de fecha inválido: ${fecha}`);
    } catch (error) {
      this.logger.warn(`Error parseando fecha: ${fecha}, usando fecha actual`);
      return new Date();
    }
  }

  /**
   * Valida la integridad de un trabajo deserializado
   */
  validarIntegridadTrabajo(trabajo: TrabajoImportacion): boolean {
    try {
      // Validar campos numéricos
      if (!Number.isInteger(trabajo.empresaId) || trabajo.empresaId <= 0) {
        this.logger.error(`empresaId inválido: ${trabajo.empresaId}`);
        return false;
      }

      if (!Number.isInteger(trabajo.usuarioId) || trabajo.usuarioId <= 0) {
        this.logger.error(`usuarioId inválido: ${trabajo.usuarioId}`);
        return false;
      }

      // Validar campos de texto
      if (!trabajo.archivoOriginal || typeof trabajo.archivoOriginal !== 'string') {
        this.logger.error(`archivoOriginal inválido: ${trabajo.archivoOriginal}`);
        return false;
      }

      // Validar fechas
      if (!(trabajo.fechaCreacion instanceof Date) || isNaN(trabajo.fechaCreacion.getTime())) {
        this.logger.error(`fechaCreacion inválida: ${trabajo.fechaCreacion}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validando integridad del trabajo:`, error);
      return false;
    }
  }
} 