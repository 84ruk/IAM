import { TipoImportacion, TrabajoImportacion, OpcionesImportacion } from '../../colas/interfaces/trabajo-importacion.interface';
import { ImportarProductosDto, ImportarProveedoresDto, ImportarMovimientosDto } from '../dto';
import { ErrorImportacion } from '../../colas/interfaces/trabajo-importacion.interface';

export interface CrearTrabajoParams {
  tipo: TipoImportacion;
  empresaId: number;
  usuarioId: number;
  archivoOriginal: string;
  totalRegistros: number;
  errores: ErrorImportacion[];
  opciones: ImportarProductosDto | ImportarProveedoresDto | ImportarMovimientosDto;
}

export class TrabajoImportacionFactory {
  static crearTrabajo(params: CrearTrabajoParams): Omit<TrabajoImportacion, 'id' | 'estado' | 'progreso' | 'fechaCreacion'> {
    const opcionesImportacion: OpcionesImportacion = {
      sobrescribirExistentes: params.opciones.sobrescribirExistentes,
      validarSolo: params.opciones.validarSolo,
      notificarEmail: params.opciones.notificarEmail,
      emailNotificacion: params.opciones.emailNotificacion,
      configuracionEspecifica: this.parsearConfiguracionEspecifica(params.opciones),
    };

    return {
      tipo: params.tipo,
      empresaId: params.empresaId,
      usuarioId: params.usuarioId,
      archivoOriginal: params.archivoOriginal,
      totalRegistros: params.totalRegistros,
      registrosProcesados: 0,
      registrosExitosos: 0,
      registrosConError: 0,
      errores: params.errores,
      opciones: opcionesImportacion,
      fechaInicio: undefined,
      fechaFin: undefined,
    };
  }

  private static parsearConfiguracionEspecifica(
    opciones: ImportarProductosDto | ImportarProveedoresDto | ImportarMovimientosDto
  ): Record<string, unknown> {
    if ('getConfiguracionEspecifica' in opciones && typeof opciones.getConfiguracionEspecifica === 'function') {
      return opciones.getConfiguracionEspecifica() as Record<string, unknown>;
    }
    
    if ('configuracionEspecifica' in opciones && opciones.configuracionEspecifica) {
      return opciones.configuracionEspecifica as Record<string, unknown>;
    }
    
    return {};
  }

  static crearTrabajoProductos(
    empresaId: number,
    usuarioId: number,
    archivoOriginal: string,
    totalRegistros: number,
    errores: ErrorImportacion[],
    opciones: ImportarProductosDto
  ): Omit<TrabajoImportacion, 'id' | 'estado' | 'progreso' | 'fechaCreacion'> {
    return this.crearTrabajo({
      tipo: TipoImportacion.PRODUCTOS,
      empresaId,
      usuarioId,
      archivoOriginal,
      totalRegistros,
      errores,
      opciones,
    });
  }

  static crearTrabajoProveedores(
    empresaId: number,
    usuarioId: number,
    archivoOriginal: string,
    totalRegistros: number,
    errores: ErrorImportacion[],
    opciones: ImportarProveedoresDto
  ): Omit<TrabajoImportacion, 'id' | 'estado' | 'progreso' | 'fechaCreacion'> {
    return this.crearTrabajo({
      tipo: TipoImportacion.PROVEEDORES,
      empresaId,
      usuarioId,
      archivoOriginal,
      totalRegistros,
      errores,
      opciones,
    });
  }

  static crearTrabajoMovimientos(
    empresaId: number,
    usuarioId: number,
    archivoOriginal: string,
    totalRegistros: number,
    errores: ErrorImportacion[],
    opciones: ImportarMovimientosDto
  ): Omit<TrabajoImportacion, 'id' | 'estado' | 'progreso' | 'fechaCreacion'> {
    return this.crearTrabajo({
      tipo: TipoImportacion.MOVIMIENTOS,
      empresaId,
      usuarioId,
      archivoOriginal,
      totalRegistros,
      errores,
      opciones,
    });
  }
} 